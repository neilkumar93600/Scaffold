---
phase: 01-foundation
plan: "01"
subsystem: infra
tags: [drizzle, vitest, postgres, upstash, redis, inngest, sentry, posthog, resend, supabase, zustand, gsap, tailwind]

# Dependency graph
requires: []
provides:
  - All production dependencies installed and lockfile committed
  - Drizzle ORM configured for Supabase/postgres-js (PgBouncer compatible)
  - Vitest + jsdom test runner with tsconfigPaths
  - Branded dark-theme holding page at app/ with Scaffold design tokens
  - Route group directories app/(auth) and app/(dashboard) stubbed
  - Health check API at /api/health returning JSON with db/redis/env checks
  - Inngest serve handler at /api/inngest
  - lib/db, lib/redis, lib/inngest/client singletons
  - lib/supabase client/server/admin stubs
  - config/site.ts, types/database.types.ts, stores/auth.store.ts stubs
  - .env.example documenting all environment variable slots
affects: [auth, database, testing, all-subsequent-phases]

# Tech tracking
tech-stack:
  added:
    - drizzle-orm@0.45.2 + drizzle-kit@0.31.10
    - postgres@3.4.9
    - zod@4.4.3
    - @supabase/supabase-js@2.106.1 + @supabase/ssr@0.10.3
    - @upstash/redis@1.38.0 + @upstash/ratelimit@2.0.8
    - inngest@4.4.0
    - @sentry/nextjs@10.53.1
    - posthog-js@1.376.0 + posthog-node@5.35.1
    - resend@6.12.3 + @react-email/components@1.0.12
    - vitest@4.1.7 + @vitejs/plugin-react@6.0.2 + vite-tsconfig-paths@6.1.1
    - @testing-library/react@16.3.2 + @testing-library/dom@10.4.1 + jsdom@29.1.1
    - zustand@latest (required by pre-existing auth store)
    - gsap@3.15.0 + @gsap/react@2.1.2 (required by pre-existing auth error page)
  patterns:
    - "Drizzle singleton with postgres client in lib/db/index.ts (prepare: false for PgBouncer)"
    - "Upstash Redis singleton in lib/redis.ts"
    - "Inngest client singleton in lib/inngest/client.ts"
    - "Scaffold design tokens added to @theme inline block in globals.css"
    - "Dark mode via .dark class on body in layout.tsx"

key-files:
  created:
    - drizzle.config.ts
    - vitest.config.mts
    - lib/db/index.ts
    - lib/redis.ts
    - lib/inngest/client.ts
    - app/api/health/route.ts
    - app/api/inngest/route.ts
    - app/(auth)/login/page.tsx
    - app/(dashboard)/page.tsx
    - config/site.ts
    - types/database.types.ts
    - lib/supabase/client.ts
    - lib/supabase/server.ts
    - stores/auth.store.ts
    - .env.example
  modified:
    - package.json
    - app/globals.css
    - app/layout.tsx
    - app/page.tsx
    - components/ui/calendar.tsx

key-decisions:
  - "postgres.js with prepare:false for Supabase PgBouncer transaction pool mode"
  - "Scaffold design tokens added to globals.css @theme inline block (not separate file)"
  - "body has class=dark for persistent dark mode without theme toggle on auth/holding pages"
  - "zustand and gsap installed to fix pre-existing untracked auth page build errors"

patterns-established:
  - "Singleton pattern: lib/db, lib/redis, lib/inngest/client — import and re-use"
  - "Stub pattern: route group pages return null/placeholder until phase implements them"
  - "Health endpoint checks db/redis/env and returns degraded when infra not connected"

requirements-completed: []

# Metrics
duration: 11min
completed: 2026-05-23
---

# Phase 01 Plan 01: Foundation Setup Summary

**Next.js 16 app wired with Drizzle/postgres-js, Upstash Redis, Inngest, and Scaffold dark-theme design tokens — full dependency set installed, build passes, /api/health endpoint live**

## Performance

- **Duration:** 11 min
- **Started:** 2026-05-23T11:36:16Z
- **Completed:** 2026-05-23T11:47:41Z
- **Tasks:** 2
- **Files modified:** 90+

## Accomplishments

- Installed all 20+ production and dev dependencies (drizzle, vitest, supabase, upstash, inngest, sentry, posthog, resend, zustand, gsap)
- Created drizzle.config.ts and vitest.config.mts; added test/db scripts to package.json
- Wired dark-theme branded holding page with Scaffold custom design tokens in globals.css
- Created lib/db, lib/redis, lib/inngest singletons plus /api/health and /api/inngest route handlers
- Built .env.example documenting all 20+ environment variable slots
- Resolved 5 pre-existing build blockers in untracked project files

## Task Commits

Each task was committed atomically:

1. **Task 1: Install packages, configure Drizzle and Vitest** - `2b4131d` (chore)
2. **Task 2: Branded page, route stubs, health/Inngest API, lib singletons** - `3239eaf` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `drizzle.config.ts` - Drizzle Kit config pointing to lib/db/schema/*.ts
- `vitest.config.mts` - Vitest with jsdom and tsconfigPaths
- `package.json` - Added test, test:coverage, test:e2e, db:generate, db:push, db:studio scripts
- `app/globals.css` - Added Scaffold design tokens (bg, teal, amber, text-primary, muted) to @theme inline
- `app/layout.tsx` - Added class="dark" to body
- `app/page.tsx` - Branded dark-theme holding page with disabled sign-in buttons
- `app/(auth)/login/page.tsx` - Route group stub
- `app/(dashboard)/page.tsx` - Dashboard stub
- `app/api/health/route.ts` - Health check: db ping, env var check, redis ping
- `app/api/inngest/route.ts` - Inngest serve handler (GET/POST/PUT)
- `lib/db/index.ts` - Drizzle singleton with postgres-js (prepare:false)
- `lib/redis.ts` - Upstash Redis singleton
- `lib/inngest/client.ts` - Inngest client singleton
- `config/site.ts` - siteConfig stub
- `types/database.types.ts` - Database type stub with profiles table
- `.env.example` - All env var slots documented

## Decisions Made

- Used `postgres` driver with `prepare: false` for Supabase PgBouncer transaction pool mode
- Appended Scaffold design tokens inside existing `@theme inline {}` block (not a new block)
- Applied `.dark` class directly on `<body>` — no theme toggle needed for Phase 1 holding state
- Installed `zustand` and `gsap/@gsap/react` as blocking deps from pre-existing auth pages

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed react-day-picker v9 ClassNames 'table' key rename**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** Pre-existing `components/ui/calendar.tsx` used `table:` key in classNames but react-day-picker v9 renamed it to `month_grid`
- **Fix:** Renamed `table` to `month_grid` in the classNames object
- **Files modified:** components/ui/calendar.tsx
- **Verification:** `pnpm typecheck` passes
- **Committed in:** 2b4131d (Task 1 commit)

**2. [Rule 3 - Blocking] Created missing config/site.ts stub**
- **Found during:** Task 2 (pnpm build)
- **Issue:** Pre-existing auth pages imported `@/config/site` which didn't exist
- **Fix:** Created `config/site.ts` with `siteConfig = { name: 'Scaffold', ... }`
- **Files modified:** config/site.ts (new)
- **Committed in:** 3239eaf (Task 2 commit)

**3. [Rule 3 - Blocking] Created missing types/database.types.ts stub**
- **Found during:** Task 2 (typecheck after initial build)
- **Issue:** `lib/supabase/client.ts` and `stores/auth.store.ts` imported `@/types/database.types`
- **Fix:** Created stub with `profiles` table Row/Insert/Update types
- **Files modified:** types/database.types.ts (new)
- **Committed in:** 3239eaf (Task 2 commit)

**4. [Rule 3 - Blocking] Installed missing zustand dependency**
- **Found during:** Task 2 (typecheck after discovering auth store)
- **Issue:** `stores/auth.store.ts` used `zustand/middleware` which wasn't installed
- **Fix:** `pnpm add zustand`
- **Files modified:** package.json, pnpm-lock.yaml
- **Committed in:** 3239eaf (Task 2 commit)

**5. [Rule 3 - Blocking] Installed missing gsap/@gsap/react dependencies**
- **Found during:** Task 2 (pnpm build type check)
- **Issue:** `app/(auth)/error.tsx` imported `gsap` and `@gsap/react` which weren't installed
- **Fix:** `pnpm add gsap @gsap/react`
- **Files modified:** package.json, pnpm-lock.yaml
- **Committed in:** 3239eaf (Task 2 commit)

---

**Total deviations:** 5 auto-fixed (1 bug fix, 4 blocking missing deps/stubs)
**Impact on plan:** All fixes necessary to achieve a passing build. Pre-existing untracked files from a previous project scaffold required these dependencies.

## Issues Encountered

Pre-existing untracked files (`app/(auth)/login/page.tsx`, `stores/auth.store.ts`, `lib/supabase/client.ts`, etc.) were from a prior project template and referenced missing modules. All resolved via Rules 1 and 3.

## User Setup Required

None — no external service configuration required for Phase 1. External services (Supabase, Stripe, Redis, etc.) are configured in later phases. See `.env.example` for all env var slots.

## Next Phase Readiness

- Package foundation complete — all dependencies installed and importable
- `pnpm build` and `pnpm typecheck` pass cleanly
- Dark-theme branded page serves at `/`
- `/api/health` returns JSON `{ status, checks }` (degraded without real infra — correct)
- Route group directories exist with stubs for Phase 2 (Auth) to implement
- lib/db, lib/redis, lib/inngest singletons ready for use in subsequent plans

---
*Phase: 01-foundation*
*Completed: 2026-05-23*
