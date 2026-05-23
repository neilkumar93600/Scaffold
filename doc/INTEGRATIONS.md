# Scaffold — Integrations

> Detailed behaviour specs for every external service integration

---

## 1. Supabase

### 1.1 PostgreSQL

**Connection:** Supabase JS v2 client with PgBouncer (transaction mode)
- `createServerClient()` — per-request in RSC and API routes (server-side)
- `createBrowserClient()` — singleton in client components (browser-side)
- Max 25 connections per Vercel function instance

**RLS enforcement:** ALL user-facing queries go through the RLS-enabled client. Service-role key (`SUPABASE_SERVICE_ROLE_KEY`) is ONLY used in:
- Stripe webhook handler (user.plan update)
- Inngest background jobs (staleness checks, ZIP generation)
- Never in any user-facing API route

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value } }
  )
}

// lib/supabase/admin.ts — SERVICE ROLE: background jobs + webhooks ONLY
export function createSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### 1.2 Supabase Auth

**Providers configured:** GitHub, Google
**Session type:** JWT access token (1h TTL) + refresh token (30d TTL)
**Callback URL:** `https://scaffold.app/auth/callback`

**OAuth flow:**
```
/login page → supabase.auth.signInWithOAuth({ provider: 'github' })
→ GitHub OAuth
→ Supabase callback: https://[project].supabase.co/auth/v1/callback
→ App callback: /auth/callback (exchanges code for session)
→ Redirect to /dashboard or /onboarding
```

**Session management in middleware:**
```ts
// middleware.ts
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createServerClient(url, anonKey, {
    cookies: { /* get/set/remove from request/response */ }
  })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}
```

### 1.3 Supabase Storage

**Bucket:** `scaffolds` (private)
**Path structure:** `{userId}/{projectId}/scaffold.zip`
**Presigned URL TTL:** 48 hours
**Cleanup:** Supabase Storage lifecycle policy deletes objects older than 72h (safety margin)

```ts
// Upload generated ZIP
const { data } = await supabaseAdmin.storage
  .from('scaffolds')
  .upload(`${userId}/${projectId}/scaffold.zip`, zipBuffer, {
    contentType: 'application/zip',
    upsert: true,
  })

// Generate presigned URL
const { data: { signedUrl } } = await supabaseAdmin.storage
  .from('scaffolds')
  .createSignedUrl(`${userId}/${projectId}/scaffold.zip`, 60 * 60 * 48)
```

---

## 2. Stripe

### 2.1 Products & Prices

| Product | Monthly Price ID | Annual Price ID |
|---|---|---|
| Solo | `STRIPE_SOLO_MONTHLY_PRICE_ID` | `STRIPE_SOLO_ANNUAL_PRICE_ID` |
| Team | `STRIPE_TEAM_MONTHLY_PRICE_ID` | `STRIPE_TEAM_ANNUAL_PRICE_ID` |
| Studio | `STRIPE_STUDIO_MONTHLY_PRICE_ID` | `STRIPE_STUDIO_ANNUAL_PRICE_ID` |

Annual prices are set at 17% discount (10/mo, 27/mo, 74/mo billed annually).

### 2.2 Checkout Flow

```ts
// POST /api/v1/billing/checkout
const session = await stripe.checkout.sessions.create({
  customer: user.stripe_customer_id ?? undefined,  // reuse if exists
  customer_creation: user.stripe_customer_id ? undefined : 'always',
  customer_email: user.stripe_customer_id ? undefined : user.email,
  mode: 'subscription',
  line_items: [{ price: getPriceId(plan, interval), quantity: 1 }],
  success_url: 'https://scaffold.app/billing/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://scaffold.app/billing',
  metadata: {
    userId: user.id,
    teamId: teamId ?? '',
  },
  allow_promotion_codes: true,
})
```

### 2.3 Webhook Events Consumed

**Endpoint:** `POST /api/v1/webhooks/stripe`
**Signature:** Verified with `stripe.webhooks.constructEvent(rawBody, sig, secret)`
**Idempotency:** Every event ID logged in `stripe_events` before processing

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `user.plan` + `user.stripe_customer_id` (or `team.plan` + `team.stripe_customer_id`) |
| `customer.subscription.updated` | Sync plan if changed; update `plan_expires_at` |
| `customer.subscription.deleted` | Revert `user.plan = 'free'`; preserve all data; email sent |
| `invoice.payment_failed` | Flag user; send dunning email via Resend; no plan downgrade yet |
| `invoice.payment_succeeded` | Optional: send receipt email |

### 2.4 Billing Portal

Stripe-hosted portal handles: plan changes, cancellation, invoice history, payment method updates.
No custom billing UI in v1.

```ts
// POST /api/v1/billing/portal
const session = await stripe.billingPortal.sessions.create({
  customer: user.stripe_customer_id,
  return_url: returnUrl,
})
return { url: session.url }
```

### 2.5 Downgrade Behaviour

On `customer.subscription.deleted`:
```
1. user.plan reverted to 'free'
2. All data preserved — no deletion
3. If user has >3 stacks: older stacks become read-only (cannot create new; existing preserved)
4. If user has >15 templates: older personal templates become read-only
5. Decision log becomes read-only (existing decisions preserved, new entries blocked)
6. "Welcome back to Free" email sent via Resend
```

---

## 3. Inngest

### 3.1 Event Catalog

| Event Name | Trigger | Handler Function |
|---|---|---|
| `scaffold/generate` | POST /api/v1/init | `generateScaffoldJob` |
| `scaffold/template-stale` | Staleness check job | `sendStaleNotifications` |
| `scaffold/run-completed` | Playbook run completes | `notifyRunCompleted` |
| `team/invite-sent` | POST /api/v1/teams/:id/invites | `sendInviteEmail` |
| `billing/downgrade` | Stripe subscription deleted | `handleDowngrade` |

### 3.2 generate-scaffold Job

```ts
inngest.createFunction(
  { id: 'generate-scaffold', retries: 3 },
  { event: 'scaffold/generate' },
  async ({ event, step }) => {
    const { stackId, projectName, userId, jobId } = event.data

    const zip = await step.run('assemble-zip', async () => {
      return generateScaffold(stackId, { name: projectName })
    })

    const url = await step.run('upload-zip', async () => {
      return uploadToStorage(userId, jobId, zip)
    })

    await step.run('update-job-status', async () => {
      return updateJobStatus(jobId, 'complete', url)
    })
  }
)
```

**Retries:** 3 attempts with exponential backoff (1min, 5min, 15min)
**Timeout:** 60 seconds per step

### 3.3 template-staleness-check Cron

```ts
inngest.createFunction(
  { id: 'template-staleness-check', retries: 1 },
  { cron: '0 2 * * 0' },  // Sunday 02:00 UTC
  async ({ step }) => {
    const staleTemplates = await step.run('check-registries', checkAllTemplates)

    await step.run('mark-stale', async () => {
      await markTemplatesStale(staleTemplates.map(t => t.id))
    })

    // Batch notify in groups of 100
    for (const batch of chunk(staleTemplates, 100)) {
      await step.sendEvent('scaffold/template-stale', {
        data: { templateIds: batch.map(t => t.id) }
      })
    }
  }
)
```

---

## 4. Resend

### 4.1 React Email Templates

All emails built with React Email components. Located in `emails/` directory.

| Template | File | Trigger |
|---|---|---|
| Welcome | `emails/welcome.tsx` | User completes onboarding |
| Team invite | `emails/team-invite.tsx` | POST /teams/:id/invites |
| Staleness alert | `emails/stale-templates.tsx` | Weekly cron |
| Downgrade | `emails/plan-downgrade.tsx` | Stripe subscription deleted |
| Payment failed | `emails/payment-failed.tsx` | invoice.payment_failed |

### 4.2 Send Pattern

```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Scaffold <hello@scaffold.app>',
  to: user.email,
  subject: 'Your project scaffold is ready',
  react: <WelcomeEmail name={user.name} />,
})
```

### 4.3 Batching for Staleness Notifications

Staleness notifications are batched to avoid rate limits:

```ts
// Max 100 emails per Inngest step
async function sendStaleNotifications(templateIds: string[]) {
  const affectedUsers = await getUsersWhoCopiedTemplates(templateIds)

  // Group by user to send one digest email per user (not one per template)
  const grouped = groupBy(affectedUsers, u => u.userId)

  for (const [userId, templates] of Object.entries(grouped)) {
    const user = await getUser(userId)
    if (!user || user.plan === 'free') continue  // free users don't get notifications

    await resend.emails.send({
      from: 'Scaffold <updates@scaffold.app>',
      to: user.email,
      subject: `${templates.length} template${templates.length > 1 ? 's' : ''} you use have updates`,
      react: <StaleTemplatesEmail user={user} templates={templates} />,
    })
  }
}
```

---

## 5. Upstash Redis

### 5.1 Rate Limiting

```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),  // overridden per plan
  analytics: true,
})

// In middleware:
const { success, limit, remaining, reset } = await ratelimit.limit(
  `ratelimit:${userId}:${userPlan}`
)
```

### 5.2 Template List Cache

```ts
// Cache key: 'templates:public:${category}:${page}'
// TTL: 5 minutes

async function getPublicTemplates(category: string, page: number) {
  const cacheKey = `templates:public:${category}:${page}`
  const cached = await redis.get(cacheKey)
  if (cached) return cached

  const templates = await db.select(...)
    .from(templatesTable)
    .where(eq(templatesTable.isPublic, true))

  await redis.setex(cacheKey, 300, JSON.stringify(templates))  // 5min TTL
  return templates
}

// Invalidate on template create/update:
async function invalidateTemplateCache() {
  const keys = await redis.keys('templates:public:*')
  if (keys.length > 0) await redis.del(...keys)
}
```

---

## 6. Slack Integration (Team Plan)

### 6.1 OAuth Install Flow

```
1. Team admin clicks "Connect Slack" in team settings
2. Redirect to Slack OAuth: https://slack.com/oauth/v2/authorize?client_id=...&scope=chat:write,commands
3. Slack redirects to: /api/v1/slack/callback?code=...&state=...
4. Exchange code for bot token via Slack OAuth API
5. Encrypt bot token with AES-256 (app-layer)
6. Store in teams.slack_config = { botToken: encrypted, channelId, webhookUrl }
```

### 6.2 Events Posted to Slack

**Playbook run completed:**
```json
{
  "text": "✅ *My Startup* — Production Deploy playbook completed by @Alex",
  "blocks": [
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "✅ *Production Deploy* completed\nProject: *My Startup*\nBy: @Alex\n20/20 steps · 0 blockers" }
    }
  ]
}
```

### 6.3 Slash Command: /scaffold status

```
Input:   /scaffold status my-startup
Response (Block Kit):
  My Startup — Production Deploy
  Progress: ████████░░ 78% (14/18 steps)
  Due: March 15
  Open steps: Configure Stripe webhooks, Add Sentry alerts, Write ToS
```

---

## 7. PostHog — Product Analytics

### 7.1 Event Catalog

| Event | Properties | Trigger |
|---|---|---|
| `user_signed_up` | `{ method: 'github'\|'google' }` | New user created |
| `onboarding_completed` | `{ stack_tool_count: number }` | User saves first stack |
| `stack_created` | `{ tool_count, has_team }` | POST /stacks |
| `stack_detected` | `{ manifest_type, detected_count }` | POST /stacks/detect |
| `template_copied` | `{ template_id, category, is_stale }` | POST /templates/:id/copy |
| `playbook_run_started` | `{ playbook_category, auto_complete_count, stack_id }` | POST /runs |
| `playbook_step_toggled` | `{ run_id, step_id, is_auto_complete }` | PATCH /runs/:id/steps/:stepId |
| `playbook_run_completed` | `{ playbook_category, duration_days, total_steps }` | Run marked complete |
| `scaffold_generated` | `{ tool_count, file_count }` | ZIP generation complete |
| `plan_upgraded` | `{ from_plan, to_plan, interval }` | Stripe checkout complete |
| `plan_downgraded` | `{ from_plan }` | Stripe subscription deleted |
| `decision_created` | `{ has_stack_link, has_team }` | POST /decisions |
| `team_invited` | `{ team_plan }` | POST /teams/:id/invites |

### 7.2 Funnel Tracking

Key funnels tracked in PostHog:
1. Signup → Onboarding complete → First stack → Plan upgrade
2. Free user → 3rd project → Plan limit hit → Upgrade
3. Team invite sent → Invite accepted → New member → Team upgrade

---

## 8. Sentry — Error Monitoring

### 8.1 Configuration

```ts
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,  // 10% of transactions
  integrations: [
    new Sentry.Integrations.Prisma(),
    nodeProfilingIntegration(),
  ],
  beforeSend(event) {
    // Strip PII — never send emails or tokens to Sentry
    if (event.user) delete event.user.email
    return event
  },
})
```

### 8.2 Custom Error Context

```ts
// lib/sentry.ts — withSentry wrapper for API routes
export function withSentry(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    return Sentry.withScope(async (scope) => {
      const user = await getUserFromRequest(req)
      if (user) {
        scope.setUser({ id: user.id, plan: user.plan })
        scope.setTag('plan', user.plan)
      }
      scope.setTag('route', req.nextUrl.pathname)
      try {
        return await handler(req, ctx)
      } catch (err) {
        Sentry.captureException(err)
        return NextResponse.json(
          { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        )
      }
    })
  }
}
```

### 8.3 Alerts Configured

| Alert | Condition | Channel |
|---|---|---|
| Error spike | >10 new errors in 5min | Slack #alerts |
| New error type | First occurrence of error fingerprint | Slack #alerts |
| P99 latency >1s | API routes 99th percentile | Slack #perf |
| Stripe webhook failure | Any 4xx/5xx on /webhooks/stripe | PagerDuty |