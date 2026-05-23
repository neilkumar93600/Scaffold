---
phase: 01-foundation
plan: "03"
subsystem: billing
tags: [zod, typescript, plan-limits, feature-gates, edge-compatible]

# Dependency graph
requires:
  - phase: 01-01
    provides: "Project scaffolding and package dependencies (zod already installed)"
provides:
  - "planLimits static config: per-plan resource caps for free/solo/team/studio"
  - "enforcePlanLimit: async function for pre-write resource cap enforcement"
  - "checkFeatureAccess: sync function for boolean feature gates (decisionLog, teamAccess)"
  - "PlanSchema Zod enum for plan type validation"
affects:
  - "all API route handlers that create resources (stacks, templates, playbooks, projects)"
  - "middleware plan enforcement layer"
  - "billing module (Stripe subscription sync)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static config object (not DB-driven) for Edge-compatible plan limit enforcement"
    - "Dual PlanSchema declaration: independent in plan-limits.ts and validations/plan.ts to avoid server-only import chains in Edge context"
    - "Async count-getter pattern: enforcePlanLimit accepts () => Promise<number> so callers own the DB query"

key-files:
  created:
    - lib/billing/plan-limits.ts
    - lib/validations/plan.ts
  modified: []

key-decisions:
  - "PlanSchema re-declared in plan-limits.ts (not imported from validations/) to keep the file safe for Edge middleware import without triggering server-only module chains"
  - "null encodes unlimited (no cap) across all numeric resource fields — avoids sentinel values like -1 or Infinity"
  - "enforcePlanLimit takes a getCurrentCount callback rather than a raw count so callers control when and how they query the DB"

patterns-established:
  - "Plan enforcement pattern: call enforcePlanLimit(plan, resource, countGetter) before every resource-creation DB write, return 402 PLAN_LIMIT on denial"
  - "Feature gate pattern: call checkFeatureAccess(plan, feature) for boolean access checks (decisionLog, teamAccess)"

requirements-completed: []

# Metrics
duration: 1min
completed: 2026-05-23
---

# Phase 1 Plan 03: Plan Limits Config Summary

**Static planLimits table with enforcePlanLimit and checkFeatureAccess functions — Edge-compatible, no DB dependency, covering free/solo/team/studio tiers**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-23T11:58:23Z
- **Completed:** 2026-05-23T11:59:23Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created `lib/billing/plan-limits.ts` with the complete locked plan config table (free/solo/team/studio) and the `enforcePlanLimit` and `checkFeatureAccess` enforcement functions
- Created `lib/validations/plan.ts` with a standalone `PlanSchema` Zod enum and `Plan` type
- TypeScript typecheck passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Plan limits config and enforcement function** - `36d53ef` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `lib/billing/plan-limits.ts` - planLimits config, enforcePlanLimit async function, checkFeatureAccess sync function, PlanSchema, Plan type — Edge-safe, no server-only imports
- `lib/validations/plan.ts` - PlanSchema Zod enum and Plan type for use in other modules

## Decisions Made
- PlanSchema is re-declared inside `plan-limits.ts` instead of imported from `lib/validations/plan.ts`. This ensures the billing enforcement file is safely importable in Edge middleware without pulling in any server-only module resolution chain.
- `null` is used to represent "unlimited" across all numeric resource fields (projects, templates, stacks, playbookRuns, teamSeats where applicable).
- `enforcePlanLimit` accepts a `getCurrentCount: () => Promise<number>` callback so API route handlers retain control over which DB query to execute.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan limit enforcement is complete and ready for use in all resource-creation API routes (stacks, templates, playbooks, projects)
- API routes should call `enforcePlanLimit(user.plan, resource, countGetter)` before DB writes and return 402 on denial
- Feature gates (`decisionLog`, `teamAccess`) should be checked with `checkFeatureAccess(user.plan, feature)`
- No blockers for subsequent plans

---
*Phase: 01-foundation*
*Completed: 2026-05-23*
