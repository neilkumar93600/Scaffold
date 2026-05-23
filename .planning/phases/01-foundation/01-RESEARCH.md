# Phase 1: Foundation - Research

**Researched:** 2026-05-23
**Domain:** Next.js 16 project foundation — Drizzle ORM + Supabase, CI/CD pipeline, infrastructure client wiring, plan limits config
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Plan limits config**

| Resource | Free | Solo | Team | Studio |
|----------|------|------|------|--------|
| Projects | 3 | Unlimited | Unlimited | Unlimited |
| Templates | 15 | Unlimited | Unlimited | Unlimited |
| Stacks | 3 | Unlimited | Unlimited | Unlimited |
| Playbook runs | 3 | Unlimited | Unlimited | Unlimited |
| Decision log | Feature-gated | Unlocked Solo+ | Unlocked | Unlocked |
| Team access | Feature-gated | Feature-gated | Up to 8 seats | Unlimited seats |

- Solo plan removes ALL numeric limits
- Team plan: unlimited shared resources, 8-seat cap
- Studio: truly unlimited

**Database schema scope**
- Define ALL core domain tables in Phase 1: users, stacks, tools, templates, playbooks, playbook_steps, playbook_runs, run_steps, decisions, teams, team_members, team_invites
- EXCEPTIONS: stripe_events (Phase 10), cli_tokens (Phase 2)
- Built-in playbook seed data: Phase 6 (not Phase 1)
- RLS enabled for all Phase 1 tables; later phases add their own RLS policies

**Placeholder page**
- Branded holding page at /: Scaffold wordmark, tagline, disabled sign-in buttons
- Dark theme in globals.css immediately (design tokens from CLAUDE.md)
- Stub all route groups: app/(auth)/ and app/(dashboard)/
- /api/health endpoint: DB connectivity + env var presence + Redis ping → { status: "ok"|"degraded", checks: { db, env, redis } }

**CI/CD pipeline**
- Checks: lint → typecheck → vitest → next build (fail fast)
- Triggers: PRs + push to main + scheduled nightly
- Branch protection: blocks merge on failure (required status check)
- Vercel preview deploy on every PR

### Claude's Discretion
- Tools catalog implementation (static TypeScript config vs DB table)
- CI secret strategy (stub values vs GitHub Secrets)
- Drizzle schema file organization (one file vs per-table files)
- Health endpoint response shape beyond the three required signals

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 1 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| OPS-07 | CI pipeline: lint → typecheck → vitest → next build on every PR | GitHub Actions workflow with pnpm/action-setup, ESLint flat config, tsc --noEmit, vitest run, next build — all verified via official docs |
</phase_requirements>

---

## Summary

Phase 1 establishes the full project skeleton on an already-scaffolded Next.js 16 codebase. The app, shadcn/ui components, TypeScript config, and Tailwind 4 are already installed; work focuses on adding Drizzle ORM + Supabase connection, all infrastructure clients, the plan limits config, and CI/CD.

Next.js 16 has significant breaking changes relevant to this phase: `next lint` is fully removed (use ESLint CLI directly — `eslint .`), `next build` no longer runs linting, async Request APIs are now the only form (synchronous access removed), and `middleware.ts` is deprecated in favor of `proxy.ts`. The existing `eslint.config.mjs` already uses ESLint flat config format which is correct for Next.js 16. The existing `package.json` uses `pnpm dev --turbopack` which is now the default and the flag is optional.

Drizzle ORM connects to Supabase's pooled connection string with `prepare: false` (required for transaction pool mode). Schema organization is per-domain-table file under `lib/db/schema/`, referenced via glob in `drizzle.config.ts`. All infrastructure clients (Upstash Redis, Inngest, Sentry, PostHog, Resend) follow a singleton module pattern under `lib/`.

**Primary recommendation:** Wire infrastructure clients as singleton modules exported from `lib/`, define Drizzle schema as per-table files under `lib/db/schema/`, use ESLint CLI directly in CI (not `pnpm lint`), and implement plan limits as a static TypeScript config object.

---

## Standard Stack

### Core (already installed or required additions)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| next | 16.1.7 | Framework + App Router | Already installed |
| typescript | 5.9.3 | Type safety | Already installed |
| tailwindcss | ^4.2.1 | Styling | Already installed |
| drizzle-orm | latest (~0.43) | Type-safe ORM | NOT installed — add |
| drizzle-kit | latest (~0.31) | Schema generation + migrations | NOT installed — add (devDep) |
| postgres | latest (~3.4) | PostgreSQL driver for Drizzle | NOT installed — add |
| zod | 3.x | Schema validation | NOT installed — add |
| @supabase/supabase-js | latest (~2.x) | Supabase Auth + Storage client | NOT installed — add |

### Infrastructure Clients (all NOT installed)

| Library | Version | Purpose | Init Location |
|---------|---------|---------|---------------|
| @upstash/redis | latest (~2.x) | Redis client (HTTP-based, serverless) | lib/redis.ts |
| @upstash/ratelimit | latest (~2.x) | Rate limiting algorithms on Redis | lib/ratelimit.ts |
| inngest | latest (~3.x) | Background job client + serve handler | lib/inngest/client.ts |
| @sentry/nextjs | latest (~9.x) | Error tracking + performance | instrumentation-client.ts, sentry.server.config.ts |
| posthog-js | latest (~1.x) | Client-side analytics | instrumentation-client.ts |
| posthog-node | latest (~4.x) | Server-side analytics | lib/posthog.ts |
| resend | latest (~4.x) | Email delivery client | lib/resend.ts |
| @react-email/components | latest | Email template components | emails/ |

### Dev Dependencies (NOT installed)

| Library | Version | Purpose |
|---------|---------|---------|
| vitest | latest (~3.x) | Unit test runner |
| @vitejs/plugin-react | latest | React plugin for Vitest |
| jsdom | latest | DOM environment for tests |
| @testing-library/react | latest | Component testing utilities |
| @testing-library/dom | latest | DOM testing utilities |
| vite-tsconfig-paths | latest | Path alias resolution in Vitest |

**Installation commands:**
```bash
# Core ORM + DB
pnpm add drizzle-orm postgres zod @supabase/supabase-js

# Infrastructure clients
pnpm add @upstash/redis @upstash/ratelimit inngest @sentry/nextjs posthog-js posthog-node resend @react-email/components

# Dev: ORM tooling
pnpm add -D drizzle-kit

# Dev: Testing
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

---

## Architecture Patterns

### Recommended Project Structure

```
lib/
├── db/
│   ├── index.ts              # Drizzle db instance (singleton)
│   ├── schema/
│   │   ├── index.ts          # Re-exports all schemas
│   │   ├── users.ts
│   │   ├── teams.ts
│   │   ├── team-members.ts
│   │   ├── stacks.ts
│   │   ├── templates.ts
│   │   ├── playbooks.ts
│   │   ├── playbook-runs.ts
│   │   └── decisions.ts
│   └── migrations/           # Generated SQL migration files
├── modules/
│   ├── auth/
│   ├── stacks/
│   ├── playbooks/
│   ├── templates/
│   ├── init/
│   └── decisions/
├── validations/              # Zod schemas (one per module)
├── billing/
│   └── plan-limits.ts        # planLimits config + enforcePlanLimit
├── inngest/
│   └── client.ts             # Inngest client singleton
├── redis.ts                  # Upstash Redis singleton
├── resend.ts                 # Resend client singleton
└── posthog.ts                # PostHog server-side client
app/
├── (auth)/
│   └── login/
│       └── page.tsx          # Stub — returns null until Phase 2
├── (dashboard)/
│   └── page.tsx              # Stub — Coming soon shell
├── api/
│   ├── v1/
│   │   └── (all feature routes — Phase 2+)
│   ├── health/
│   │   └── route.ts          # DB + env + Redis health check
│   └── inngest/
│       └── route.ts          # Inngest serve handler
├── globals.css               # Overwrite with dark theme tokens
├── layout.tsx                # Already configured with fonts
└── page.tsx                  # Branded placeholder (Phase 1)
instrumentation-client.ts     # Sentry client + PostHog init
sentry.server.config.ts       # Sentry server init
sentry.edge.config.ts         # Sentry edge init
instrumentation.ts            # Next.js instrumentation hook
drizzle.config.ts             # Drizzle Kit configuration
vitest.config.mts             # Vitest config
.env.example                  # All env vars documented
.github/
└── workflows/
    └── ci.yml                # Lint + typecheck + test + build
```

### Pattern 1: Drizzle DB Singleton

**What:** Single Drizzle instance reused across serverless function invocations via module-level singleton.
**When to use:** All DB access throughout the app.

```typescript
// Source: https://orm.drizzle.team/docs/connect-supabase
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// CRITICAL: prepare: false required for Supabase transaction pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false })

export const db = drizzle({ client, schema })
```

### Pattern 2: Drizzle Schema (per-table file)

**What:** Each domain table in its own file under `lib/db/schema/`, re-exported from `index.ts`.
**When to use:** All tables defined in Phase 1.

```typescript
// Source: https://orm.drizzle.team/docs/sql-schema-declaration
// lib/db/schema/users.ts
import { pgTable, uuid, text, boolean, timestamptz } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  plan: text('plan').notNull().default('free'),
  planExpiresAt: timestamptz('plan_expires_at'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  onboardingDone: boolean('onboarding_done').notNull().default(false),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
})
```

### Pattern 3: drizzle.config.ts

```typescript
// Source: https://orm.drizzle.team/docs/drizzle-config-file
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema/*.ts',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Pattern 4: Plan Limits Config

**What:** Static TypeScript object mapping plan names to resource caps, with a sentinel value for unlimited.
**Why static config over DB table:** The plan tiers and their limits are product decisions that change infrequently and need to be enforced in Edge middleware (no DB access available). A static config is importable everywhere without async.

```typescript
// lib/billing/plan-limits.ts
import { z } from 'zod'

export const PlanSchema = z.enum(['free', 'solo', 'team', 'studio'])
export type Plan = z.infer<typeof PlanSchema>

// Sentinel: null = unlimited (no cap enforced)
type ResourceLimit = number | null

type PlanLimits = {
  projects: ResourceLimit
  templates: ResourceLimit
  stacks: ResourceLimit
  playbookRuns: ResourceLimit
  decisionLog: boolean      // feature gate: true = accessible
  teamAccess: boolean       // feature gate: true = team features accessible
  teamSeats: ResourceLimit  // null = unlimited seats
}

export const planLimits: Record<Plan, PlanLimits> = {
  free: {
    projects: 3,
    templates: 15,
    stacks: 3,
    playbookRuns: 3,
    decisionLog: false,
    teamAccess: false,
    teamSeats: 0,
  },
  solo: {
    projects: null,
    templates: null,
    stacks: null,
    playbookRuns: null,
    decisionLog: true,
    teamAccess: false,
    teamSeats: 0,
  },
  team: {
    projects: null,
    templates: null,
    stacks: null,
    playbookRuns: null,
    decisionLog: true,
    teamAccess: true,
    teamSeats: 8,
  },
  studio: {
    projects: null,
    templates: null,
    stacks: null,
    playbookRuns: null,
    decisionLog: true,
    teamAccess: true,
    teamSeats: null,
  },
}

export type LimitCheckResult =
  | { allowed: true }
  | { allowed: false; current: number; max: number }

export async function enforcePlanLimit(
  userId: string,
  plan: Plan,
  resource: keyof Pick<PlanLimits, 'projects' | 'templates' | 'stacks' | 'playbookRuns'>,
  getCurrentCount: () => Promise<number>
): Promise<LimitCheckResult> {
  const limit = planLimits[plan][resource]
  if (limit === null) return { allowed: true }

  const current = await getCurrentCount()
  if (current < limit) return { allowed: true }
  return { allowed: false, current, max: limit }
}
```

### Pattern 5: Infrastructure Client Singletons

**What:** Each third-party client initialized once at module level, exported as singleton.

```typescript
// Source: https://upstash.com/docs/redis/tutorials/nextjs_with_redis
// lib/redis.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
```

```typescript
// Source: https://www.inngest.com/docs/getting-started/nextjs-quick-start
// lib/inngest/client.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({ id: 'scaffold' })
```

```typescript
// Source: https://resend.com/docs/send-with-nextjs
// lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)
```

```typescript
// Source: https://posthog.com/docs/libraries/next-js
// lib/posthog.ts (server-side only)
import { PostHog } from 'posthog-node'

export function getPostHogClient() {
  const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })
  return client
}
```

### Pattern 6: Inngest Route Handler

```typescript
// Source: https://www.inngest.com/docs/getting-started/nextjs-quick-start
// app/api/inngest/route.ts
import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [],  // populated in later phases
})
```

### Pattern 7: Sentry Initialization (Next.js 16)

```typescript
// Source: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
// instrumentation-client.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  sendDefaultPii: false,
})
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})
```

```typescript
// instrumentation.ts
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
```

```typescript
// next.config.mjs (must be updated)
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
})
```

### Pattern 8: PostHog (Next.js 15.3+ approach)

```typescript
// Source: https://posthog.com/docs/libraries/next-js
// instrumentation-client.ts (merged with Sentry init)
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
})
```

### Pattern 9: GitHub Actions CI Workflow

```yaml
# Source: https://pnpm.io/continuous-integration + official Next.js docs
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'   # nightly at 2am UTC

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint   # runs: eslint . (NOT next lint — removed in Next.js 16)

      - name: Typecheck
        run: pnpm typecheck   # runs: tsc --noEmit

      - name: Test
        run: pnpm test --run   # --run = CI mode, no watch

      - name: Build
        run: pnpm build
        env:
          # Stub env vars so next build doesn't fail on missing env
          NEXT_PUBLIC_SUPABASE_URL: 'https://stub.supabase.co'
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'stub-anon-key'
          DATABASE_URL: 'postgresql://stub:stub@localhost:5432/stub'
          NEXT_PUBLIC_SENTRY_DSN: 'https://stub@stub.ingest.sentry.io/0'
          NEXT_PUBLIC_POSTHOG_KEY: 'phc_stub'
          NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com'
          NEXT_PUBLIC_APP_URL: 'https://stub.example.com'
```

### Pattern 10: Vitest Config

```typescript
// Source: https://nextjs.org/docs/app/guides/testing/vitest
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

### Anti-Patterns to Avoid

- **Using `pnpm lint` script that calls `next lint`:** `next lint` is removed in Next.js 16. The existing `package.json` `lint` script already calls `eslint` directly — this is correct.
- **Calling `postgres()` without `prepare: false` for Supabase:** Prepared statements are not supported in Supabase transaction pool mode; the build will appear fine but queries will fail at runtime.
- **Storing all schema in one `schema.ts` file:** Works, but per-table files avoid merge conflicts and align with Drizzle's glob support.
- **Importing `@supabase/supabase-js` browser client in Server Components:** Use the server client from `@supabase/ssr` for RSC; the browser client requires `'use client'`.
- **Running `vitest` without `--run` in CI:** Without `--run`, Vitest enters watch mode and the CI job never completes.
- **Using synchronous `cookies()`, `headers()`, `params` in Next.js 16:** These are now async-only. Synchronous access is a build error, not just a warning.
- **Using `middleware.ts`:** Deprecated in Next.js 16 in favor of `proxy.ts`. For Phase 1, use `proxy.ts` filename from the start.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Postgres connection | Manual pg client | `drizzle-orm/postgres-js` + `postgres` | Connection pooling, type safety, migration management |
| Redis rate limiting | Custom counter logic | `@upstash/ratelimit` | Handles sliding window, concurrency, atomic ops |
| Background jobs | Custom queue with Redis | Inngest | Retries, observability, typed events, dev UI |
| Error capture | try/catch + console.log | `@sentry/nextjs` withSentryConfig | Stack traces, source maps, performance, user context |
| Email | Raw SMTP / nodemailer | Resend + `@react-email/components` | Deliverability, type-safe templates, API-based |
| Feature flag limits | Custom DB queries in middleware | Static `planLimits` config | Middleware has no DB access; config is sync and zero-latency |

**Key insight:** The boundary between Edge (proxy.ts, middleware) and Node.js runtime matters. Plan limit checks need synchronous access to plan data — use the static config. Feature-level enforcement can use the config; the DB confirms the current count.

---

## Common Pitfalls

### Pitfall 1: Supabase Connection Pooling — Missing `prepare: false`

**What goes wrong:** Queries succeed in local dev (direct connection) but fail silently or throw "prepared statement does not exist" errors in Vercel/serverless environments.
**Why it happens:** Supabase uses PgBouncer in transaction pool mode by default. Prepared statements require a persistent connection session, which transaction pooling doesn't provide.
**How to avoid:** Always pass `{ prepare: false }` to the `postgres()` client when using Supabase's pooled connection URL.
**Warning signs:** Errors like `prepared statement "drizzle_stmt_xx" already exists` or queries hanging on first request.

### Pitfall 2: `next lint` Removed in Next.js 16

**What goes wrong:** CI pipeline fails at the lint step if `pnpm lint` calls `next lint` instead of `eslint` directly.
**Why it happens:** Next.js 16 removed the `next lint` wrapper. `next build` also no longer runs linting.
**How to avoid:** The existing `package.json` already has `"lint": "eslint"` — confirm this calls ESLint directly (not via `next lint`). The existing `eslint.config.mjs` is already in flat config format, which is correct.
**Warning signs:** `Error: Unknown command 'lint'` from the next binary.

### Pitfall 3: Missing `next-env.d.ts` for Typecheck in CI

**What goes wrong:** `tsc --noEmit` fails in CI with "Cannot find type definition file for 'node'" or Next.js types missing because `next-env.d.ts` is only generated when Next.js runs.
**Why it happens:** `next-env.d.ts` is a generated file, excluded from git. CI machines don't have it.
**How to avoid:** Run `pnpm exec next typegen` before `tsc --noEmit` in CI, or add it to a `postinstall` script. Alternatively, structure the CI job so `next build` runs (which generates the file), or accept that typecheck runs against what's committed (the `include` path in tsconfig.json already covers `.next/types/**`).
**Warning signs:** TS errors in CI that don't appear locally, specifically missing Next.js type declarations.

### Pitfall 4: Vitest Watch Mode in CI

**What goes wrong:** The CI `test` job runs indefinitely and never reports success or failure.
**Why it happens:** `vitest` without flags defaults to interactive watch mode in non-CI environments.
**How to avoid:** Add `--run` flag to the test command in CI: `pnpm test --run`. Alternatively, check if `CI=true` is set (Vitest auto-detects CI=true and runs once).
**Warning signs:** Job hangs after "waiting for file changes" message.

### Pitfall 5: Sentry `withSentryConfig` Breaks Non-MJS Config

**What goes wrong:** `next.config.mjs` uses ES module `import` syntax but Sentry docs show CommonJS `require()` patterns.
**Why it happens:** The project uses `"type": "module"` in package.json (ESM). Sentry setup must use `import` syntax.
**How to avoid:** Import `withSentryConfig` with `import { withSentryConfig } from '@sentry/nextjs'` — not `const { withSentryConfig } = require(...)`.
**Warning signs:** `require is not defined in ES module scope` at build time.

### Pitfall 6: Drizzle Schema Circular Imports via `index.ts` Re-export

**What goes wrong:** Drizzle schema files that reference each other (e.g., `stacks` references `users`) cause circular import errors when all are re-exported from `index.ts`.
**Why it happens:** TypeScript's ESM module resolution can create circular dependency issues with Drizzle's foreign key references.
**How to avoid:** Import the referenced table directly from its source file rather than from the barrel `index.ts`. For example, in `stacks.ts`, import `users` from `./users`, not from `./index`.
**Warning signs:** `ReferenceError: Cannot access 'users' before initialization` at startup.

### Pitfall 7: Global CSS Token Collision — Tailwind v4 vs Custom Tokens

**What goes wrong:** The existing `globals.css` uses Tailwind v4's `@theme inline` block and shadcn's standard token names (`--background`, `--primary`, etc.). Adding custom tokens (`--bg`, `--teal`) outside this block may not register with Tailwind's utility class generation.
**Why it happens:** Tailwind v4 reads design tokens from the `@theme` block, not from arbitrary `:root` CSS variables.
**How to avoid:** Add the project's custom design tokens inside the `@theme inline` block, alongside the existing shadcn tokens. Map them: `--color-bg: #0B0C0F; --color-teal: #00D4AA;` etc. Use semantic names in the theme that generate utility classes like `bg-bg` and `text-teal`.
**Warning signs:** Tailwind classes referencing custom tokens render no styles (invisible fallback behavior).

---

## Code Examples

### Health Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { sql } from 'drizzle-orm'

export async function GET() {
  const checks: Record<string, 'ok' | 'fail'> = {
    db: 'fail',
    env: 'fail',
    redis: 'fail',
  }

  // 1. DB connectivity
  try {
    await db.execute(sql`SELECT 1`)
    checks.db = 'ok'
  } catch {}

  // 2. Required env vars present
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
  ]
  if (required.every(key => !!process.env[key])) {
    checks.env = 'ok'
  }

  // 3. Redis ping
  try {
    await redis.ping()
    checks.redis = 'ok'
  } catch {}

  const status = Object.values(checks).every(v => v === 'ok') ? 'ok' : 'degraded'

  return NextResponse.json({ status, checks }, {
    status: status === 'ok' ? 200 : 503,
  })
}
```

### Drizzle Schema with Foreign Key (correct import pattern)

```typescript
// lib/db/schema/stacks.ts
import { pgTable, uuid, text, boolean, jsonb, timestamptz } from 'drizzle-orm/pg-core'
import { users } from './users'   // Direct import — NOT from ./index (avoids circular deps)
import { teams } from './teams'

export const stacks = pgTable('stacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  description: text('description'),
  isLocked: boolean('is_locked').notNull().default(false),
  tools: jsonb('tools').notNull().default([]),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
})
```

### Dark Theme CSS Variables (replacing existing globals.css tokens)

```css
/* Add to globals.css — map to Tailwind @theme inline block */
@theme inline {
  /* Existing shadcn tokens kept as-is, add Scaffold custom tokens: */
  --color-bg: #0B0C0F;
  --color-bg2: #111318;
  --color-bg3: #181C22;
  --color-teal: #00D4AA;
  --color-amber: #F0A44A;
  --color-text-primary: #F0EFE8;
  --color-muted-text: #8A8D97;
  --color-muted2: #5A5D66;
}
```

---

## State of the Art

| Old Approach | Current Approach | Source | Impact |
|--------------|------------------|--------|--------|
| `next lint` CLI command | Run `eslint .` directly | Next.js 16 upgrade guide | CI scripts must call `eslint` not `next lint` |
| Synchronous `cookies()`, `headers()`, `params` | All async — `await cookies()` etc. | Next.js 16 breaking change | All route handlers must be async |
| `middleware.ts` export | `proxy.ts` export | Next.js 16 deprecation | Start with `proxy.ts` filename |
| `experimental.turbopack` in config | Top-level `turbopack:` config key | Next.js 16 | Minor config location change |
| `--turbopack` flag on `next dev` | Default (Turbopack is default) | Next.js 16 | `pnpm dev --turbopack` flag is now redundant but harmless |
| `next build` runs linting | Build no longer runs linting | Next.js 16 | CI must explicitly run lint as separate step |
| PostHog providers.tsx pattern | `instrumentation-client.ts` | PostHog docs 2026 | Simpler, aligned with Next.js 15.3+ instrumentation |
| Drizzle `drizzle-kit push` only | Use `push` for dev, `generate`+`migrate` for prod | Drizzle docs | Phase 1 can use `push`; document plan for production |

**Deprecated/outdated:**
- `next lint`: Fully removed in Next.js 16 — use `eslint .` directly
- `serverRuntimeConfig` / `publicRuntimeConfig`: Removed in Next.js 16 — use env vars directly
- `--turbopack` flag: No longer needed (Turbopack is default)
- `images.domains`: Deprecated — use `images.remotePatterns`

---

## Claude's Discretion Recommendations

### Tools Catalog: Use Static TypeScript Config

**Recommendation:** Static TypeScript config (not a DB table).

**Rationale:**
1. The tools catalog is reference data (framework names, versions, categories) that does not vary per user and does not need RLS.
2. It needs to be accessible synchronously in Edge/middleware context for stack matching.
3. A DB table adds a migration, RLS policy, and a DB round-trip for data that will rarely change.
4. Drizzle query builder already uses `toolId` as JSONB string keys in `stacks.tools[]` — the catalog is just the lookup table for that string registry.

**Structure:** `lib/catalog/tools.ts` — a typed array of `{ id, name, category, description }` objects, exported as a constant. No DB table needed in Phase 1.

### CI Secret Strategy: Stub Environment Variables

**Recommendation:** Stub values for build/typecheck steps; no real secrets in CI for Phase 1.

**Rationale:**
1. Phase 1 has no integration tests. Vitest unit tests run against pure TypeScript logic — no DB, no Redis, no external services needed.
2. `next build` only fails if env vars are referenced at build time (not runtime). Using stub values avoids importing real credentials into GitHub.
3. Real secrets (SUPABASE, STRIPE, etc.) can be added to GitHub Secrets when integration tests are added in later phases.

**Implementation:** Inline stub `env:` block in the GitHub Actions `Build` step (see CI workflow example above). Keep real secrets out of the repository entirely until needed.

### Drizzle Schema File Organization: Per-Table Files

**Recommendation:** Per-table files under `lib/db/schema/`, re-exported from `lib/db/schema/index.ts`.

**Rationale:**
1. Drizzle Kit's glob support (`schema: './lib/db/schema/*.ts'`) handles multiple files natively.
2. Per-table files avoid merge conflicts when multiple phases add tables simultaneously.
3. Foreign key imports must be direct (from `./users`, not from `./index`) to avoid circular dependency issues — this is easy to enforce with per-table files.
4. The PROJECT has 10+ tables — a single `schema.ts` would be ~500+ lines.

---

## Open Questions

1. **Supabase `@supabase/ssr` vs `@supabase/supabase-js` for App Router auth middleware**
   - What we know: `@supabase/supabase-js` is the general client; `@supabase/ssr` is the package specifically designed for Next.js App Router cookie-based session management.
   - What's unclear: Whether Phase 1 needs `@supabase/ssr` for the proxy.ts (middleware equivalent) or if it can be deferred to Phase 2 (auth implementation).
   - Recommendation: Install `@supabase/ssr` in Phase 1 alongside `@supabase/supabase-js` since `proxy.ts` will reference it. Keeps Phase 2 from needing a new install step.

2. **`next typegen` in CI for type generation**
   - What we know: `next-env.d.ts` is generated at dev/build time and excluded from git. The CI typecheck step may fail without it.
   - What's unclear: Whether the current project's tsconfig correctly defers to `.next/types/` which CI won't have.
   - Recommendation: Add `pnpm exec next typegen` as a CI step before typecheck, or verify that the existing tsconfig `include` patterns handle this without it.

3. **Sentry `withSentryConfig` and Turbopack (Next.js 16)**
   - What we know: Sentry docs mention Next.js 16 has beta Turbopack-specific features for React component annotation.
   - What's unclear: Whether `withSentryConfig` fully supports Turbopack builds in Next.js 16 production mode, or whether `--webpack` flag may be needed for Sentry source map uploads.
   - Recommendation: Start without Turbopack source map upload flags; add them once the Sentry integration is validated in a deployed environment.

---

## Sources

### Primary (HIGH confidence)
- `https://nextjs.org/docs/app/guides/upgrading/version-16` — Next.js 16 breaking changes: `next lint` removal, async Request APIs, middleware→proxy rename, Turbopack defaults (verified, dated 2026-05-19)
- `https://nextjs.org/docs/app/guides/testing/vitest` — Official Vitest setup for Next.js, vitest.config.mts pattern (verified, dated 2026-05-19)
- `https://orm.drizzle.team/docs/connect-supabase` — Drizzle + Supabase connection with `prepare: false`
- `https://orm.drizzle.team/docs/drizzle-config-file` — drizzle.config.ts glob schema configuration
- `https://pnpm.io/continuous-integration` — pnpm/action-setup GitHub Actions configuration
- `https://www.inngest.com/docs/getting-started/nextjs-quick-start` — Inngest client + route handler setup
- `https://posthog.com/docs/libraries/next-js` — PostHog instrumentation-client.ts approach (Next.js 15.3+)
- `https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/` — Sentry Next.js manual setup files

### Secondary (MEDIUM confidence)
- `https://upstash.com/docs/redis/tutorials/nextjs_with_redis` — Upstash Redis client setup (verified with npm package documentation)
- `https://resend.com/docs/send-with-nextjs` — Resend client initialization
- `https://supabase.com/docs/guides/database/drizzle` — Supabase pooled connection string, `prepare: false` requirement

### Tertiary (LOW confidence)
- Community patterns for `planLimits` static config shape — no authoritative source, derived from project requirements and common SaaS patterns

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified via official docs and package pages; versions from existing package.json or official latest
- Architecture: HIGH — per-table schema files, singleton clients, plan limits config all verified against official source patterns
- Next.js 16 breaking changes: HIGH — verified directly from official Next.js 16 upgrade guide (dated 2026-05-19)
- CI workflow: HIGH — pnpm action setup verified from pnpm.io; GitHub Actions steps verified from official docs
- Pitfalls: HIGH for Supabase prepare:false, Next.js 16 lint removal, Vitest --run; MEDIUM for Drizzle circular imports (community pattern)

**Research date:** 2026-05-23
**Valid until:** 2026-06-23 (stable stack — 30 days; Next.js 16 is recent but breaking changes are now documented)
