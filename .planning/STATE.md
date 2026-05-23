# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-23)

**Core value:** 120+ code templates, configs, and legal docs — copy in one click before deeper features earn trust
**Current focus:** Phase 1 — Foundation

## Current Position

Phase: 1 of 11 (Foundation)
Plan: 5 of 5 in current phase
Status: Phase complete
Last activity: 2026-05-23 — Plan 01-05 complete (Sentry + PostHog + Resend infrastructure clients)

Progress: [██░░░░░░░░] 5%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 6 min
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 5/5 | 29 min | 6 min |

**Recent Trend:**
- Last 5 plans: 01-01 (11 min), 01-02 (11 min), 01-03 (1 min), 01-04 (1 min), 01-05 (5 min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Template library is top-priority module — immediate copy-paste value on day one
- CLI deferred to post-launch — web app validates core value first
- Supabase RLS as security layer — enforced at DB layer, never bypassed in app code
- Modular monolith — 6 bounded modules in lib/modules/
- postgres.js with prepare:false for Supabase PgBouncer transaction pool mode
- Scaffold design tokens added to globals.css @theme inline block (not separate file)
- body has class=dark for persistent dark mode on auth/holding pages
- zustand and gsap installed to fix pre-existing untracked auth page build errors
- PlanSchema re-declared in plan-limits.ts (not imported from validations/) for Edge-safe import
- null encodes unlimited across numeric resource limits; 0 means no-team for teamSeats
- enforcePlanLimit accepts getCurrentCount callback so callers control the DB query
- CI workflow uses npm (not pnpm) — actions/setup-node@v4 with npm cache, npm ci, npm run commands
- Test step in CI uses npm test -- --run to pass --run flag through npm to Vitest (prevents watch mode)
- timestamp({ withTimezone: true }) is the correct drizzle-orm 0.45.2 API — timestamptz does not exist
- Sibling imports in schema files (from './users' not './index') prevent circular dependency chains
- ESM import for withSentryConfig required (package.json "type":"module" — require() throws in ESM scope)
- PostHog server client: flushAt:1/flushInterval:0 for immediate serverless event delivery
- onRouterTransitionStart must be exported from instrumentation-client.ts for Sentry navigation tracking

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-05-23
Stopped at: Completed 01-05-PLAN.md (Sentry + PostHog + Resend infrastructure clients)
Resume file: .planning/phases/02-auth/02-01-PLAN.md
