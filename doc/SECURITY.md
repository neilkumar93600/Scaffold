# Scaffold — Security

> Authentication, authorization, input validation, secrets management, and threat mitigations

---

## 1. Authentication

### 1.1 Session Architecture

| Concern | Implementation |
|---|---|
| Provider | Supabase Auth |
| Access token | JWT, 1-hour TTL, signed with Supabase project secret |
| Refresh token | 30-day TTL, httpOnly cookie |
| Storage | Browser: httpOnly + SameSite=Lax cookies via `@supabase/ssr` |
| OAuth providers | GitHub, Google — no passwords stored in Scaffold DB |
| New user creation | Triggered by Supabase Auth webhook — app creates `public.users` row |

**JWT validation in middleware:**
```ts
// Runs on Vercel Edge — fast, before any route handler
const { data: { user }, error } = await supabase.auth.getUser()
if (!user || error) {
  return NextResponse.redirect('/login')
}
```

### 1.2 CLI API Tokens

```
Generation:
  1. Cryptographically secure random bytes (32 bytes) → hex string
  2. Token format: 'scaf_live_' + randomHex(32)
  3. Stored in DB: SHA-256(token)  — never plaintext
  4. Displayed to user: once, on generation page
  5. Never retrievable again — user must revoke and regenerate

Usage:
  Authorization: Bearer scaf_live_xxxxxxxx
  Middleware: SHA-256(incoming token) compared to stored hash

Revocation:
  DELETE /api/v1/auth/tokens/:id
  Row deleted from DB — token immediately invalid
```

---

## 2. Authorization

### 2.1 Row Level Security (RLS)

RLS is enforced at the **PostgreSQL layer** by Supabase. Application code cannot bypass it when using the `anon` or `authenticated` role client. The `service_role` client bypasses RLS — used ONLY in:
- Stripe webhook handler
- Inngest background jobs
- Never in any user-facing API route

**Critical rule:** Any route using `createSupabaseAdmin()` (service role) must manually enforce authorization in application code, since RLS is bypassed.

### 2.2 Role-Based Access Control

| Action | owner | admin | member |
|---|---|---|---|
| Read team library | ✓ | ✓ | ✓ |
| Edit team stack (unlocked) | ✓ | ✓ | ✗ |
| Lock/unlock team stack | ✓ | ✓ | ✗ |
| Invite member | ✓ | ✓ | ✗ |
| Remove member | ✓ | ✓ | ✗ |
| Change member role | ✓ | ✓→member only | ✗ |
| Delete team | ✓ | ✗ | ✗ |
| Transfer ownership | ✓ | ✗ | ✗ |

### 2.3 Plan Enforcement

**Rule:** Plan limits ONLY enforced server-side. Client-side gates are UX-only.

```ts
// lib/billing/plan-limits.ts — single source of truth
// Called in EVERY resource-creation endpoint before any DB write

async function assertPlanAllows(userId: string, resource: string) {
  const user = await getUserById(userId)  // fresh DB read — never trust cached plan
  const limit = planLimits[user.plan][resource]

  if (limit === false) {
    throw new PlanLimitError(`${resource} requires a paid plan`, resource, 0, 0)
  }

  if (typeof limit === 'number' && limit !== Infinity) {
    const current = await countResource(userId, resource)
    if (current >= limit) {
      throw new PlanLimitError(`${resource} limit reached`, resource, current, limit)
    }
  }
}
```

**Test requirement:** Every plan-limited endpoint has a Vitest integration test:
- Free user at limit → 402
- Free user below limit → 201
- Paid user → 201 (no limit)

---

## 3. Input Validation

### 3.1 Zod on Every Request Body

```ts
// No request body reaches business logic without Zod parse
const result = CreateStackSchema.safeParse(await req.json())
if (!result.success) {
  return NextResponse.json(
    { error: result.error.message, code: 'VALIDATION_ERROR' },
    { status: 400 }
  )
}
// result.data is now fully typed and validated
```

### 3.2 Content Security

| Concern | Mitigation |
|---|---|
| Template content XSS | Content stored as plain text. Rendered in `<pre><code>` only. No `dangerouslySetInnerHTML`. |
| Decision log XSS | Same — plain text fields, rendered escaped in JSX |
| Project name injection | Validated as alphanumeric + hyphens/spaces max 200 chars |
| ZIP path traversal | Whitelist of allowed output paths — see LOGIC.md §5.3 |
| SQL injection | Drizzle ORM parameterised queries only. No string interpolation in SQL. |
| SSRF | No user-controlled URLs fetched by server in v1 |

### 3.3 File Upload Security (ZIP Download — no upload in v1)

v1 does not accept user file uploads. ZIP generation is entirely server-side with whitelisted paths. File upload for template import (v2) will require:
- MIME type validation
- File size limit
- Content scanning (no executable files)

---

## 4. Secrets Management

### 4.1 Environment Variable Classification

| Variable | Classification | Where Used |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (RLS-protected) | Client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Server only (webhooks, jobs) |
| `STRIPE_SECRET_KEY` | **Secret** | Server only |
| `STRIPE_WEBHOOK_SECRET` | **Secret** | Webhook handler only |
| `RESEND_API_KEY` | **Secret** | Server only |
| `INNGEST_EVENT_KEY` | **Secret** | Server only |
| `INNGEST_SIGNING_KEY` | **Secret** | Server only |
| `UPSTASH_REDIS_REST_TOKEN` | **Secret** | Server only |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | Client + server |

**Rule:** Any variable without `NEXT_PUBLIC_` prefix must NEVER be accessed in `'use client'` components. TypeScript + ESLint rule enforces this.

### 4.2 Slack Bot Token Encryption

Slack bot tokens stored encrypted in `teams.slack_config`:

```ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.SLACK_ENCRYPTION_KEY!, 'hex') // 32 bytes

export function encryptToken(token: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(token), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decryptToken(encrypted: string): string {
  const [ivHex, encHex] = encrypted.split(':')
  const decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString()
}
```

---

## 5. Webhook Security

### 5.1 Stripe Webhook Verification

```ts
// MUST read raw body — do NOT use req.json()
const rawBody = await req.text()
const sig = req.headers.get('stripe-signature')

let event: Stripe.Event
try {
  event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
} catch (err) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
}
```

**If signature check fails:** 400, log to Sentry with alert. Never process the event.

### 5.2 Idempotency

```ts
// Check before processing ANY Stripe event
const existing = await db.select()
  .from(stripeEvents)
  .where(eq(stripeEvents.id, event.id))
  .limit(1)

if (existing.length > 0) {
  return NextResponse.json({ received: true })  // Already processed
}

// Process + record atomically
await db.transaction(async (tx) => {
  await processEvent(tx, event)
  await tx.insert(stripeEvents).values({ id: event.id, type: event.type })
})
```

---

## 6. HTTP Security Headers

Set via `next.config.mjs`:

```js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "frame-src https://js.stripe.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    ].join('; '),
  },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

---

## 7. GDPR Compliance

| Right | Implementation |
|---|---|
| Right to access | User can export their data from account settings (v2 — JSON export) |
| Right to erasure | DELETE /api/v1/users/me — cascades to all owned data via DB FK |
| Right to portability | Data export as JSON (v2) |
| Consent | ToS + Privacy Policy accepted at signup |
| Data minimization | Only email, name, avatar_url collected; no sensitive data |
| Third-party processors | Supabase (EU hosting available), Stripe (PCI-compliant), Resend, PostHog |

**Data retention:** User data retained until deletion request. Stripe events retained 90 days for billing audit. Logs retained 30 days (Vercel default).

---

## 8. Security Testing Requirements

| Test | Tool | Frequency |
|---|---|---|
| Dependency CVE scan | `pnpm audit` | Every PR |
| RLS policy tests | Vitest + Supabase test client | Every PR |
| Plan limit bypass tests | Vitest integration | Every PR |
| Input validation fuzz | Zod schema unit tests | Every PR |
| Auth bypass tests | Playwright E2E | Every staging deploy |
| OWASP Top 10 review | Manual + security-auditor agent | Every major feature |

---

## 9. Incident Response

### 9.1 If a credential is leaked

1. **Immediately** rotate the affected key in the service dashboard
2. Update Vercel environment variable
3. Redeploy (Vercel instant deploy)
4. Check Sentry + service logs for evidence of misuse
5. If user data affected: notify affected users within 72h (GDPR requirement)
6. Post-mortem in `doc/INCIDENTS.md`

### 9.2 If RLS bypass is discovered

1. Stop all writes immediately — enable Supabase database pause if needed
2. Assess data exposure: which tables, which users
3. Fix RLS policy and test in staging
4. Apply migration to production
5. Notify affected users if their data was exposed
6. Security audit of all other RLS policies