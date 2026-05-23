# Phase 2: Auth & Onboarding - Research

**Researched:** 2026-05-23
**Domain:** Supabase Auth + Next.js App Router + OAuth + CLI token management
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Onboarding flow**
- 3 steps: project type → stack builder → ready
- Stack builder step: optional — has a "skip for now" exit that creates no stack
- Skip behavior: "skip setup" exits the entire flow early; sets onboarding_complete = true immediately (skip is a one-way door — not shown again)
- Returning users who skipped: shown a soft prompt (banner/tooltip on dashboard), NOT redirected back to onboarding

**Post-auth routing**
- Dashboard in Phase 2: layout shell with sidebar nav + empty content area (not a stub). Sidebar should include nav items for stacks, playbooks, templates, settings — real content added per phase.

**Auth errors & edge cases**
- Provider conflict: if same email exists under different OAuth provider, auto-link accounts silently
- Login page loading state: spinner on the clicked button, other button disabled — prevents double-submit

**CLI token UI**
- Location: /settings/tokens (account settings sub-page)
- Token reveal on generation: modal dialog with plaintext token, copy button, and warning ("Save this — won't be shown again")
- Token list columns: name, created date, last used, revoke button
- Revoke confirmation: confirm dialog before revoke

### Claude's Discretion
- Project type step options and structure
- Ready screen (step 3) design
- New user post-OAuth routing decision (onboarding redirect vs overlay)
- Deep-link redirect param handling
- OAuth failure error page vs login page with error
- Session expiry handling
- Exact sidebar nav items and layout

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up and log in with GitHub OAuth (no password creation) | signInWithOAuth({provider:'github'}) + callback route with exchangeCodeForSession |
| AUTH-02 | User can sign up and log in with Google OAuth | signInWithOAuth({provider:'google'}) + same callback route |
| AUTH-03 | New user completes 3-step onboarding: project type → stack builder → ready screen | Client component wizard, server action to set onboardingDone=true, Zod schema for step data |
| AUTH-04 | User session persists across browser refresh (Supabase JWT + refresh token) | middleware.ts with createServerClient + getUser() refreshes tokens into cookies automatically |
| AUTH-05 | User can generate a CLI API token (shown plaintext once, stored as SHA-256 hash) | Node.js crypto.randomBytes + crypto.createHash('sha256'), shown once in modal |
| AUTH-06 | User can revoke CLI API tokens from dashboard | DELETE /api/v1/auth/tokens/[id] + confirm dialog in UI |
</phase_requirements>

---

## Summary

This phase wires up Supabase OAuth (GitHub + Google), session persistence via cookie middleware, a 3-step onboarding wizard, the dashboard layout shell, and CLI token management. The most critical discovery is that **the codebase already has substantial Phase 1 scaffolding** that must be reconciled before building: the auth store references a `profiles` table that does not exist in the Drizzle schema (which uses `users`), the `database.types.ts` stub references `profiles` rows, and the `use-auth` hook attempts client-side `onAuthStateChange` with profile fetching — all of which conflict with the server-first architecture required by the CLAUDE.md conventions.

The second key finding is that `@supabase/ssr` v0.10.3 already installed uses the `getAll`/`setAll` cookie API (not the older `get`/`set`/`remove` pattern). The server client in `lib/supabase/server.ts` is already correct for this version. The middleware still needs to be created — it does not yet exist in the project.

The third key finding is that **CLI tokens need a new Drizzle table** (`cli_tokens`) — it is referenced in the PRD/TRD but is absent from both `lib/db/schema/index.ts` and `lib/db/migrations/0001_rls.sql`.

**Primary recommendation:** Build auth on the existing `lib/supabase/server.ts` + `lib/supabase/client.ts` clients (they are correct for @supabase/ssr v0.10.3). Create middleware.ts for session refresh. Fix the schema/store misalignment (profiles → users). Add cli_tokens table. Build all new UI on top of the shadcn primitives already present.

---

## Codebase Inventory (What Phase 1 Built)

### Already Exists — Use As-Is
| File | Status | Notes |
|------|--------|-------|
| `lib/supabase/server.ts` | Ready | createServerClient with getAll/setAll cookies — correct for v0.10.3 |
| `lib/supabase/client.ts` | Ready | createBrowserClient — correct |
| `lib/supabase/admin.ts` | Ready | getSupabaseAdmin() with service role key |
| `lib/db/index.ts` | Ready | Drizzle with prepare:false for PgBouncer |
| `lib/db/schema/users.ts` | Ready | has onboardingDone boolean column |
| `lib/billing/plan-limits.ts` | Ready | enforcePlanLimit() helper |
| `lib/posthog.ts` | Ready | getPostHogClient() server-side |
| `lib/redis.ts` | Ready | Upstash Redis instance |
| `app/(auth)/layout.tsx` | Ready | Two-column auth layout with AuthLeftPanel |
| `app/(auth)/login/page.tsx` | Needs rework | Has email/password + Google only; needs GitHub added; references `useAuth` which needs fixing |
| `components/ui/*` | Ready | Full shadcn set including dialog, table, card, toast, sidebar |
| `stores/ui.store.ts` | Ready | sidebarOpen state |

### Already Exists — Must Fix
| File | Problem | Fix Required |
|------|---------|--------------|
| `hooks/use-auth.ts` | References `profiles` table (doesn't exist) and has email/password auth (not needed) | Replace with OAuth-only hook; fetch from `users` table |
| `stores/auth.store.ts` | References `Database['public']['Tables']['profiles']['Row']` | Update to reference `users` table type or use Supabase `User` type directly |
| `types/database.types.ts` | Only defines `profiles` table stub, not `users` or `cli_tokens` | Extend or replace with correct table definitions |
| `config/site.ts` | Has wrong app name ("SellerSaathi") | Update to "Scaffold" |

### Must Be Created
| File | Purpose |
|------|---------|
| `middleware.ts` (project root) | Session refresh for all routes |
| `app/auth/callback/route.ts` | OAuth code exchange |
| `lib/db/schema/cli_tokens.ts` | CLI token table schema |
| `lib/modules/auth/index.ts` | M1 auth module: requireAuth, syncUser |
| `lib/validations/auth.ts` | Zod schemas for token creation, onboarding steps |
| `app/api/v1/auth/me/route.ts` | GET current user |
| `app/api/v1/auth/tokens/route.ts` | GET list + POST generate CLI token |
| `app/api/v1/auth/tokens/[id]/route.ts` | DELETE revoke CLI token |
| `app/(dashboard)/layout.tsx` | Dashboard layout with sidebar shell |
| `app/(dashboard)/onboarding/page.tsx` | 3-step onboarding flow |
| `app/(dashboard)/settings/tokens/page.tsx` | CLI token management page |
| `components/onboarding/*` | Onboarding step components |
| `components/dashboard/*` | Sidebar, nav components |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/ssr | 0.10.3 (installed) | Next.js SSR auth client creation | Official Supabase package for App Router |
| @supabase/supabase-js | 2.106.1 (installed) | Supabase JS client | Base client library |
| drizzle-orm | 0.45.2 (installed) | DB queries for user sync + token storage | Project ORM standard |
| zod | 4.4.3 (installed) | Validate token creation, onboarding data | Project validation standard |
| zustand | 5.0.13 (installed) | Auth store (user state client-side) | Already used in stores/auth.store.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Node.js crypto (built-in) | Node 20+ | SHA-256 hashing for CLI tokens | Server-side only — API routes |
| sonner | 2.0.7 (installed) | Toast notifications (token copied, revoked) | Success/error feedback |

### Not Needed (Already Has Alternatives)
| Skip | Reason |
|------|--------|
| bcrypt/bcryptjs | PRD specifies SHA-256, not bcrypt. SHA-256 is fast enough for tokens (not passwords) |
| iron-session | Supabase handles sessions |
| next-auth | Supabase Auth replaces it |
| react-hook-form | Simple onboarding steps don't need it; controlled inputs + Server Actions suffice |

---

## Architecture Patterns

### Pattern 1: Supabase Auth Middleware (Session Refresh)

**What:** Middleware refreshes expired JWT tokens on every request before route handlers run. Without this, Server Components receive stale sessions.

**When to use:** Every Next.js project using @supabase/ssr — it's the session persistence mechanism for AUTH-04.

**File:** `middleware.ts` (project root, not inside app/)

```typescript
// Source: @supabase/ssr v0.10.3 + official Supabase Next.js guide
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: call getUser(), NOT getSession()
  // getUser() revalidates the JWT with Supabase Auth server
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from login/signup
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup'
  )) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Critical:** The middleware must return `supabaseResponse` (not a new `NextResponse.next()`), otherwise cookies won't be set and sessions break.

---

### Pattern 2: OAuth Callback Route

**What:** Exchanges the PKCE code from the OAuth provider for a Supabase session stored in cookies.

**File:** `app/auth/callback/route.ts`

```typescript
// Source: Official Supabase Next.js guide + verified in dev.to article
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Sync user to Drizzle users table on first login
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await db.insert(users).values({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        }).onConflictDoNothing()  // idempotent: existing users untouched
      }

      // Determine routing: new user → onboarding, returning user → next param
      const dbUser = user ? await db.select().from(users)
        .where(eq(users.id, user.id)).limit(1) : []
      const isNewUser = dbUser.length > 0 && !dbUser[0].onboardingDone

      const redirectTo = isNewUser
        ? `${origin}/dashboard/onboarding`
        : `${origin}${next}`

      return NextResponse.redirect(redirectTo)
    }
  }

  // Exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

**Note:** The callback URL registered in Supabase dashboard and in `signInWithOAuth` `redirectTo` must match exactly. For local dev: `http://localhost:3000/auth/callback`. For production: `https://{domain}/auth/callback`.

---

### Pattern 3: requireAuth Helper (Auth Module M1)

**What:** Server-side helper that verifies the user is authenticated before API route proceeds. Uses `getUser()` not `getSession()`.

**File:** `lib/modules/auth/index.ts`

```typescript
// Source: Supabase official guidance — always use getUser() in server code
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return null

  // Return the Drizzle users row for plan/onboarding data
  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  return dbUser ?? null
}
```

**Usage in API routes:**
```typescript
const user = await requireAuth()
if (!user) return NextResponse.json(
  { error: 'Unauthorized', code: 'UNAUTHORIZED' },
  { status: 401 }
)
```

---

### Pattern 4: signInWithOAuth (Client Component)

**What:** Initiates GitHub or Google OAuth redirect from the login page.

**File:** Replaces/updates `hooks/use-auth.ts`

```typescript
// Source: Supabase signInWithOAuth docs + dev.to verified article
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const supabase = createClient()

  const signInWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { signInWithGitHub, signInWithGoogle, signOut }
}
```

**Note:** `signInWithOAuth` redirects the browser — it does not return a session. The session arrives via the callback route.

---

### Pattern 5: CLI Token Generation (SHA-256)

**What:** Generate a random token, show it once as plaintext, store only the SHA-256 hash.

**File:** `app/api/v1/auth/tokens/route.ts`

```typescript
// Source: Node.js crypto docs + PRD specification
import { createHash, randomBytes } from 'crypto'

function generateCliToken(): { raw: string; hash: string } {
  // 32 bytes = 256-bit entropy, hex-encoded = 64 char string
  const raw = `scf_${randomBytes(32).toString('hex')}`
  const hash = createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}
```

**Storage schema:** Store `tokenHash` (SHA-256), `name` (user label), `userId`, `createdAt`, `lastUsedAt`, `revokedAt` (nullable — soft delete).

**Verification pattern** (for CLI authentication in later phase):
```typescript
const incoming = createHash('sha256').update(rawToken).digest('hex')
const token = await db.select().from(cliTokens)
  .where(and(eq(cliTokens.tokenHash, incoming), isNull(cliTokens.revokedAt)))
  .limit(1)
```

---

### Pattern 6: Onboarding Flow Architecture

**What:** 3-step wizard with client-side step state, server action to complete.

**Architecture decision:** Client component for step navigation (needs useState), Server Action for persisting onboarding_done=true.

```
app/(dashboard)/onboarding/
  page.tsx                    ← RSC wrapper (checks onboardingDone, redirects if already done)
  
components/onboarding/
  OnboardingWizard.tsx        ← 'use client' — manages currentStep, formData state
  StepProjectType.tsx         ← Step 1: radio cards for project type
  StepStackBuilder.tsx        ← Step 2: optional stack selections + "Skip for now" button
  StepReady.tsx               ← Step 3: success screen with CTA to dashboard
  _actions.ts                 ← Server Actions: completeOnboarding(), skipOnboarding()
```

**Server Action pattern:**
```typescript
'use server'
import { requireAuth } from '@/lib/modules/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

export async function completeOnboarding() {
  const user = await requireAuth()
  if (!user) redirect('/login')

  await db.update(users)
    .set({ onboardingDone: true, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  redirect('/dashboard')
}
```

---

### Pattern 7: Dashboard Layout Shell

**What:** Persistent sidebar with nav + main content area. Uses shadcn Sidebar component (already installed).

**Architecture:**
```
app/(dashboard)/
  layout.tsx              ← RSC: loads user, passes to DashboardLayoutClient
  page.tsx                ← Dashboard home

components/dashboard/
  DashboardLayout.tsx     ← 'use client' — sidebar state management
  Sidebar.tsx             ← Nav items: stacks, playbooks, templates, settings
  UserMenu.tsx            ← User avatar, plan badge, sign out
```

**Nav items for sidebar (Phase 2 shell, content in later phases):**
- Stacks (`/dashboard/stacks`) — icon: Layers
- Playbooks (`/dashboard/playbooks`) — icon: BookOpen
- Templates (`/dashboard/templates`) — icon: FileCode
- Settings (`/dashboard/settings`) — icon: Settings
- Tokens (`/dashboard/settings/tokens`) — accessible from settings

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow | Custom auth redirects | `supabase.auth.signInWithOAuth()` | PKCE, state, nonce handled automatically |
| Session cookies | Custom cookie management | @supabase/ssr createServerClient | Handles rotation, expiry, HTTPS-only flags |
| JWT refresh | Manual token refresh | middleware.ts with `getUser()` | SSR package handles refresh automatically |
| Token entropy | Math.random() | `crypto.randomBytes(32)` | Cryptographically secure random |
| SHA-256 | Custom hash function | Node.js `createHash('sha256')` | Correct implementation, no dependencies |
| Route protection | Custom middleware auth | `requireAuth()` in every route + middleware redirect | Defense in depth — both layers needed |
| Sidebar state | Custom context | shadcn `sidebar.tsx` already provides `SidebarProvider` | Already in codebase |

**Key insight:** The @supabase/ssr package handles every subtle cookie/session/refresh edge case. Any custom session management will get the edge cases wrong.

---

## Common Pitfalls

### Pitfall 1: Using getSession() Instead of getUser() in Server Code
**What goes wrong:** `getSession()` reads from cookies without re-validating the JWT with the Supabase server. An expired or revoked session appears valid.
**Why it happens:** Developers use getSession() for speed; it seems equivalent but isn't.
**How to avoid:** Always `supabase.auth.getUser()` in middleware and server components. Use `getSession()` only client-side where stale data is acceptable.
**Warning signs:** Auth appears to work but doesn't properly expire sessions.

### Pitfall 2: Middleware Returns Wrong Response Object
**What goes wrong:** Cookie set-calls in the Supabase client don't propagate to browser. Users appear logged out on every page load.
**Why it happens:** In @supabase/ssr v0.10+, the `setAll` callback mutates a local `supabaseResponse` variable. If middleware returns a different `NextResponse.next()`, those cookies are lost.
**How to avoid:** Return `supabaseResponse` from middleware, not a new `NextResponse.next()`.
**Warning signs:** Session works immediately after login but breaks on next browser refresh.

### Pitfall 3: Schema Mismatch — profiles vs users
**What goes wrong:** `stores/auth.store.ts` and `hooks/use-auth.ts` reference a `profiles` table that doesn't exist in the Drizzle schema.
**Why it happens:** Phase 1 scaffolding was copied from a generic template with a `profiles` table; Scaffold uses `users`.
**How to avoid:** Phase 2 must fix `use-auth.ts`, `auth.store.ts`, and `database.types.ts` to use `users` table. This is the first task in the auth module plan.
**Warning signs:** TypeScript errors on `Database['public']['Tables']['profiles']`, runtime Supabase query returning null.

### Pitfall 4: OAuth Callback URL Not Registered
**What goes wrong:** OAuth redirect fails with "redirect_uri_mismatch" error.
**Why it happens:** Supabase dashboard requires every callback URL to be whitelisted under Authentication → URL Configuration → Redirect URLs.
**How to avoid:** Add both `http://localhost:3000/auth/callback` and `https://{production-domain}/auth/callback` to allowed redirect URLs in Supabase dashboard. Must match exactly the `redirectTo` value passed to `signInWithOAuth`.
**Warning signs:** OAuth button redirects to provider then fails immediately on return.

### Pitfall 5: cli_tokens Table Missing from Schema
**What goes wrong:** AUTH-05 and AUTH-06 have no database table to write to.
**Why it happens:** The table is in PRD/TRD but was not added to `lib/db/schema/index.ts` or `0001_rls.sql` in Phase 1.
**How to avoid:** Plan 02-01 or 02-02 must include creating `lib/db/schema/cli_tokens.ts`, exporting from `index.ts`, running migration, and adding RLS policy.
**Warning signs:** TypeScript cannot import `cliTokens` from schema.

### Pitfall 6: User Row Not Synced on First OAuth Login
**What goes wrong:** Supabase creates an auth.users entry but the app's `public.users` table has no row. `requireAuth()` returns null for brand-new OAuth users.
**Why it happens:** Supabase auth and the app's Drizzle `users` table are separate. OAuth login creates a Supabase auth record but not a Drizzle record.
**How to avoid:** Insert into `users` with `onConflictDoNothing()` in the callback route immediately after `exchangeCodeForSession`. The auth.uid() in RLS policies refers to Supabase auth user ID — the Drizzle row must use the same UUID.
**Warning signs:** New OAuth users get 401 errors on first API call because `requireAuth()` can't find their users row.

### Pitfall 7: Onboarding Skip is Not Idempotent
**What goes wrong:** User clicks "skip" multiple times or back-navigates, triggering multiple `onboarding_complete = true` writes.
**Why it happens:** Server action called multiple times without guard.
**How to avoid:** RSC wrapper for onboarding page checks `onboardingDone` before rendering — if already true, redirect immediately. Server action is idempotent (SET onboarding_done = true is safe to call multiple times).

### Pitfall 8: Raw CLI Token Logged or Cached
**What goes wrong:** Raw token appears in server logs, error tracking (Sentry), or CDN cache.
**Why it happens:** Token passed as URL param or logged in catch blocks.
**How to avoid:** Never log raw tokens. Show token only in modal (client-side, never in a URL). Store only the hash. Consider adding raw token to Sentry's `denyUrls` / `beforeSend` scrubbing.

---

## Code Examples

### User Sync in Callback Route (Idempotent)
```typescript
// Source: drizzle-orm docs — onConflictDoNothing()
await db.insert(users).values({
  id: user.id,
  email: user.email!,
  name: user.user_metadata?.full_name ?? null,
  avatarUrl: user.user_metadata?.avatar_url ?? null,
}).onConflictDoNothing()
```

### CLI Token Hash and Verify
```typescript
// Source: Node.js built-in crypto module
import { createHash, randomBytes } from 'node:crypto'

// Generate
const raw = `scf_${randomBytes(32).toString('hex')}`
const hash = createHash('sha256').update(raw).digest('hex')

// Verify (CLI auth, later phase)
const hash = createHash('sha256').update(incomingRaw).digest('hex')
const [token] = await db.select().from(cliTokens)
  .where(and(eq(cliTokens.tokenHash, hash), isNull(cliTokens.revokedAt)))
```

### Protect Server Component Page
```typescript
// Source: Supabase getUser() pattern
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  // render page...
}
```

### Token Reveal Modal (Client Component)
```typescript
// Pattern: show raw token once, never refetch
const [rawToken, setRawToken] = useState<string | null>(null)

async function handleGenerate() {
  const res = await fetch('/api/v1/auth/tokens', {
    method: 'POST',
    body: JSON.stringify({ name: tokenName })
  })
  const data = await res.json()
  setRawToken(data.token)  // show modal
}

// Modal closes → rawToken = null, gone forever
```

### Onboarding Page RSC Guard
```typescript
// RSC wrapper checks onboardingDone before rendering wizard
import { requireAuth } from '@/lib/modules/auth'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const user = await requireAuth()
  if (!user) redirect('/login')
  if (user.onboardingDone) redirect('/dashboard')

  return <OnboardingWizard />
}
```

---

## cli_tokens Schema (Must Be Created)

```typescript
// lib/db/schema/cli_tokens.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const cliTokens = pgTable('cli_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  tokenHash: text('token_hash').notNull().unique(), // SHA-256 hex digest
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**RLS for cli_tokens:**
```sql
ALTER TABLE cli_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own ON cli_tokens
  FOR ALL USING (user_id = auth.uid());
```

---

## Supabase Dashboard Configuration Required

These steps are not code but must happen before OAuth works:

1. **Authentication → Providers → GitHub:** Enable, add Client ID + Secret from GitHub OAuth App. Callback URL to register at GitHub: `https://{project-ref}.supabase.co/auth/v1/callback`
2. **Authentication → Providers → Google:** Enable, add Client ID + Secret from Google Cloud Console.
3. **Authentication → URL Configuration → Redirect URLs:** Add `http://localhost:3000/auth/callback` and `https://{domain}/auth/callback`
4. **Authentication → Providers → Email:** Can disable email confirmation for OAuth-only flow if desired.
5. **Identity Linking:** Automatic linking by email is enabled by default in Supabase — no action needed for the auto-link-same-email requirement.

---

## database.types.ts Alignment

The current `types/database.types.ts` stub only defines `profiles`. Phase 2 must update it to expose `users` and `cli_tokens` (minimally) so TypeScript resolves. The real fix is regenerating via `supabase gen types typescript` after connecting the project, but for development the stub should match the Drizzle schema.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @supabase/auth-helpers-nextjs | @supabase/ssr | 2023 | auth-helpers deprecated; use @supabase/ssr |
| get/set/remove cookie methods | getAll/setAll cookie methods | @supabase/ssr v0.5+ | Project already uses correct new API |
| getSession() for server verification | getUser() for server verification | 2024 guidance | getSession() not trusted server-side |
| Client-side onAuthStateChange for everything | Server-side getUser() + client subscriber | 2024 | RSC architecture; server is authoritative |
| Implicit OAuth flow | PKCE flow | Supabase default | More secure; code + verifier exchanged |

---

## Open Questions

1. **Supabase project not yet connected**
   - What we know: Env vars are placeholders in .env.example. No real Supabase project exists yet.
   - What's unclear: Whether user will connect an existing project or create a new one before Phase 2 implementation.
   - Recommendation: Planner should note Supabase dashboard setup as a prerequisite task (not a code task). Code should work against placeholders during development with a real project added before testing OAuth.

2. **`app/(dashboard)/layout.tsx` — what Route Group pattern to use**
   - What we know: Dashboard is in `(dashboard)` route group. CONTEXT.md says layout shell with sidebar.
   - What's unclear: Whether `/settings` and `/settings/tokens` should be inside `(dashboard)` or a separate route group.
   - Recommendation: Put both inside `(dashboard)` — they share the sidebar layout and authentication requirement.

3. **Identity linking UX edge case**
   - What we know: Supabase auto-links by email. User decision is "auto-link silently."
   - What's unclear: Whether to show a toast notification when linking occurs or just silently proceed.
   - Recommendation: Planner's discretion — no toast is simplest and matches "silently" intent.

---

## Sources

### Primary (HIGH confidence)
- `E:/Scaffold/lib/supabase/server.ts` — existing server client using @supabase/ssr v0.10.3 getAll/setAll API
- `E:/Scaffold/lib/supabase/client.ts` — existing browser client
- `E:/Scaffold/lib/db/schema/users.ts` — confirmed users table with onboardingDone column
- `E:/Scaffold/lib/db/migrations/0001_rls.sql` — confirmed cli_tokens RLS policy absent
- `E:/Scaffold/package.json` — confirmed @supabase/ssr@0.10.3, drizzle-orm@0.45.2, next@16.1.7

### Secondary (MEDIUM confidence)
- dev.to article on Google OAuth with Supabase + Next.js App Router — verified against official Supabase patterns: middleware, callback route, signInWithOAuth structure
- Supabase identity linking docs — auto-linking behavior confirmed
- Supabase server-side auth docs — getUser() vs getSession() guidance confirmed

### Tertiary (LOW confidence)
- Supabase advanced guide on getClaims — mentions it as JWT-only validation without server round-trip; not recommended for route protection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed installed in package.json
- Architecture patterns: HIGH — verified against @supabase/ssr v0.10.3 installed in project + official docs
- Pitfalls: HIGH — discovered from reading actual codebase (profiles/users mismatch is real, cli_tokens absence is real)
- CLI token pattern: HIGH — Node.js built-in crypto, no external dependency

**Research date:** 2026-05-23
**Valid until:** 2026-07-23 (Supabase/Next.js APIs stable; @supabase/ssr releases infrequently)
