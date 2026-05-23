---
phase: 01-foundation
plan: "05"
subsystem: infra
tags: [sentry, posthog, resend, observability, email, analytics, instrumentation]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: packages installed (sentry/nextjs, posthog-node, posthog-js, resend all in package.json from plan 01-01)

provides:
  - Sentry server runtime initialization via sentry.server.config.ts
  - Sentry edge runtime initialization via sentry.edge.config.ts
  - Next.js instrumentation hook loading Sentry per runtime
  - Client-side Sentry + PostHog initialization in instrumentation-client.ts
  - PostHog server-side client factory (getPostHogClient) in lib/posthog.ts
  - Resend email client singleton (resend) in lib/resend.ts
  - next.config.mjs wrapped with withSentryConfig using ESM import

affects: [all feature phases that use captureEvent, all API routes using withSentry wrapper, email sending in auth/billing phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Next.js instrumentation hook pattern for runtime-specific Sentry init
    - PostHog serverless pattern (flushAt:1, flushInterval:0) for immediate event delivery
    - ESM import for withSentryConfig (required by "type":"module" in package.json)

key-files:
  created:
    - instrumentation.ts
    - instrumentation-client.ts
    - sentry.server.config.ts
    - sentry.edge.config.ts
    - lib/posthog.ts
    - lib/resend.ts
  modified:
    - next.config.mjs
    - lib/db/schema/decisions.ts
    - lib/db/schema/playbook-runs.ts
    - lib/db/schema/playbook-steps.ts
    - lib/db/schema/playbooks.ts
    - lib/db/schema/run-steps.ts
    - lib/db/schema/stacks.ts
    - lib/db/schema/team-invites.ts
    - lib/db/schema/team-members.ts
    - lib/db/schema/templates.ts

key-decisions:
  - "ESM import for withSentryConfig required because package.json has type:module — require() would throw"
  - "onRouterTransitionStart exported from instrumentation-client.ts for Sentry navigation tracking"
  - "PostHog server client uses flushAt:1/flushInterval:0 for reliable event delivery in serverless"
  - "automaticVercelMonitors moved to webpack key in Sentry config to resolve deprecation"

patterns-established:
  - "instrumentation.ts: Next.js instrumentation hook pattern — load runtime-specific configs via dynamic import"
  - "PostHog serverless pattern: new client per request + shutdown() after events"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-05-23
---

# Phase 01 Plan 05: Observability and Email Infrastructure Summary

**Sentry (server + edge + client), PostHog (client + server factory), and Resend wired via Next.js instrumentation hooks and lib/ singletons with ESM-compatible next.config.mjs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-23T12:00:11Z
- **Completed:** 2026-05-23T12:05:05Z
- **Tasks:** 2
- **Files modified:** 17 (6 created, 11 modified)

## Accomplishments
- Sentry initialized for all three Next.js runtimes (nodejs, edge, client) via instrumentation hook pattern
- PostHog initialized client-side in instrumentation-client.ts and server-side factory exported from lib/posthog.ts
- Resend client singleton exported from lib/resend.ts
- next.config.mjs wrapped with withSentryConfig using ESM import (required by package.json "type":"module")

## Task Commits

Each task was committed atomically:

1. **Task 1: Sentry server, edge, and instrumentation files** - `3cfa517` (feat)
2. **Task 2: PostHog server client and Resend client** - `81cf3cd` (feat)

**Plan metadata:** (TBD — added after state updates)

## Files Created/Modified
- `sentry.server.config.ts` - Sentry init for Node.js server runtime
- `sentry.edge.config.ts` - Sentry init for Edge runtime
- `instrumentation.ts` - Next.js instrumentation hook; loads runtime-specific Sentry config
- `instrumentation-client.ts` - Client-side Sentry init + PostHog browser init; exports onRouterTransitionStart
- `lib/posthog.ts` - Server-side PostHog factory (getPostHogClient) with serverless flush settings
- `lib/resend.ts` - Resend email client singleton
- `next.config.mjs` - Wrapped with withSentryConfig using ESM import; moved automaticVercelMonitors to webpack key

Schema files auto-fixed (Rule 3):
- `lib/db/schema/decisions.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/playbook-runs.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/playbook-steps.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/playbooks.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/run-steps.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/stacks.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/team-invites.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/team-members.ts` - timestamptz → timestamp({ withTimezone: true })
- `lib/db/schema/templates.ts` - timestamptz → timestamp({ withTimezone: true })

## Decisions Made
- Used ESM `import { withSentryConfig }` in next.config.mjs — required because package.json has `"type":"module"` and `require()` throws in ES module scope
- Exported `onRouterTransitionStart = Sentry.captureRouterTransitionStart` from instrumentation-client.ts to satisfy Sentry's navigation instrumentation requirement
- PostHog server client uses `flushAt: 1, flushInterval: 0` to ensure events are sent immediately in serverless without needing long-running processes
- Moved `automaticVercelMonitors` to `webpack` key in Sentry config to resolve deprecation warning

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed invalid `timestamptz` import breaking TypeScript build**
- **Found during:** Task 1 (typecheck + build verification)
- **Issue:** 9 schema files imported `timestamptz` from `drizzle-orm/pg-core` — this export does not exist in drizzle-orm. The correct API is `timestamp('col', { withTimezone: true })`. This caused `npm run typecheck` to report 6+ type errors and `npm run build` to fail with type check failure.
- **Fix:** Replaced `timestamptz` import and all usages with `timestamp` + `{ withTimezone: true }` option across all 9 affected schema files. The `users.ts` and `teams.ts` files already used the correct pattern.
- **Files modified:** decisions.ts, playbook-runs.ts, playbook-steps.ts, playbooks.ts, run-steps.ts, stacks.ts, team-invites.ts, team-members.ts, templates.ts (all in lib/db/schema/)
- **Verification:** `npm run typecheck` exits 0, `npm run build` completes successfully
- **Committed in:** `3cfa517` (Task 1 commit — schema fixes bundled with Sentry files)

**2. [Rule 2 - Missing Critical] Added `onRouterTransitionStart` export to instrumentation-client.ts**
- **Found during:** Task 1 (build output showed ACTION REQUIRED warning)
- **Issue:** Sentry requires `onRouterTransitionStart` export from instrumentation-client.ts for navigation instrumentation
- **Fix:** Added `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart`
- **Files modified:** instrumentation-client.ts
- **Verification:** Build output no longer shows ACTION REQUIRED warning
- **Committed in:** `3cfa517` (Task 1 commit)

**3. [Rule 1 - Bug] Moved `automaticVercelMonitors` to `webpack` key in Sentry config**
- **Found during:** Task 1 (build output showed DEPRECATION WARNING)
- **Issue:** `automaticVercelMonitors` at root level of Sentry config options is deprecated; correct location is under `webpack` key
- **Fix:** Moved option to `webpack: { automaticVercelMonitors: false }`
- **Files modified:** next.config.mjs
- **Verification:** Build output no longer shows DEPRECATION WARNING
- **Committed in:** `3cfa517` (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (1 Rule 3 blocking, 1 Rule 2 missing critical, 1 Rule 1 bug)
**Impact on plan:** All auto-fixes required for correctness and clean build output. No scope creep.

## Issues Encountered
- `timestamptz` is not a valid drizzle-orm export — pre-existing error from plan 01-01 schema generation. Fixed under Rule 3 since it blocked the build verification step for this plan.

## User Setup Required
None — no external service configuration required beyond what's already in .env.local. All clients initialize from existing env vars (SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, RESEND_API_KEY).

## Next Phase Readiness
- All observability and communication clients are wired and ready
- API routes can now import `getPostHogClient()` for analytics events
- API routes can now import `resend` for email sending
- Sentry error capture active for all runtimes once SENTRY_DSN env var is set
- Database schema files have correct TypeScript types, unblocking Drizzle ORM usage

---
*Phase: 01-foundation*
*Completed: 2026-05-23*
