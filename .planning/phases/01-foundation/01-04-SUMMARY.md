---
phase: 01-foundation
plan: "04"
subsystem: infra
tags: [github-actions, ci, eslint, vitest, typescript, next-build, npm]

# Dependency graph
requires:
  - phase: 01-01
    provides: package.json scripts (lint, typecheck, test, build) that CI invokes
provides:
  - GitHub Actions CI pipeline running lint → typecheck → test → build on every PR and push to main
affects: [all-phases, 11-launch]

# Tech tracking
tech-stack:
  added: [github-actions]
  patterns: [fail-fast CI pipeline, stub env vars for build isolation, npm ci for reproducible installs]

key-files:
  created:
    - .github/workflows/ci.yml
  modified: []

key-decisions:
  - "Used npm (not pnpm) to match the project's actual package manager"
  - "Used actions/setup-node@v4 with npm cache instead of pnpm/action-setup"
  - "Test step uses npm test -- --run to pass --run flag through npm to Vitest (prevents watch mode)"
  - "npx next typegen step marked continue-on-error: true as it may not exist in all Next.js 16 versions"

patterns-established:
  - "CI workflow: npm ci for deterministic dependency install"
  - "Stub env vars in Build step so next build does not fail on missing real secrets"
  - "Lint uses eslint directly via npm run lint (next lint removed in Next.js 16)"

requirements-completed: [OPS-07]

# Metrics
duration: 1min
completed: 2026-05-23
---

# Phase 1 Plan 04: CI Workflow Summary

**GitHub Actions CI pipeline using npm with lint → typecheck → test (Vitest --run) → next build, triggered on PRs, main pushes, and nightly schedule**

## Performance

- **Duration:** 1 min
- **Started:** 2026-05-23T12:00:03Z
- **Completed:** 2026-05-23T12:01:04Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `.github/workflows/ci.yml` with valid YAML, no duplicate step names
- Pipeline sequence: lint → typecheck → test → build with fail-fast behavior
- Nightly schedule at 2am UTC for proactive health monitoring
- Stub env vars for all `NEXT_PUBLIC_*` and service keys so `next build` never fails on missing real secrets

## Task Commits

Each task was committed atomically:

1. **Task 1: GitHub Actions CI workflow** - `39a7240` (feat)

**Plan metadata:** _(committed below)_

## Files Created/Modified
- `.github/workflows/ci.yml` - GitHub Actions CI pipeline: checkout → setup-node → npm ci → lint → typegen → typecheck → test → build

## Decisions Made
- Used **npm** (not pnpm) to match the project's actual package manager — `actions/setup-node@v4` with `cache: 'npm'` and `npm ci` for reproducible installs
- Test command is `npm test -- --run` to pass the `--run` flag through npm to Vitest, preventing watch mode hang in CI
- The `npx next typegen` step has `continue-on-error: true` since `next typegen` may not exist in all Next.js 16 versions (best-effort type generation before typecheck)
- Lint uses `npm run lint` which calls `eslint` directly — `next lint` was removed in Next.js 16

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Used npm instead of pnpm throughout workflow**
- **Found during:** Task 1 (CI workflow creation)
- **Issue:** Plan specifies pnpm (pnpm/action-setup@v4, pnpm install --frozen-lockfile, pnpm lint, etc.) but the project uses npm as its package manager per the npm_override instruction
- **Fix:** Replaced pnpm/action-setup with actions/setup-node@v4 cache:'npm', replaced pnpm install --frozen-lockfile with npm ci, replaced all pnpm run X with npm run X, replaced pnpm test --run with npm test -- --run
- **Files modified:** .github/workflows/ci.yml
- **Verification:** All content checks pass — correct commands confirmed in file
- **Committed in:** 39a7240 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — package manager mismatch)
**Impact on plan:** Necessary correction to use the project's actual package manager. No scope creep.

## Issues Encountered
None - file creation was straightforward, all verification checks passed.

## User Setup Required
None — CI runs automatically once the file is merged. Branch protection rules (requiring CI to pass before merging) are deferred to Phase 11 when all checks are stable.

## Next Phase Readiness
- CI pipeline ready to enforce quality gates on every PR going forward
- Branch protection configuration documented for Phase 11 when checks are stable
- OPS-07 satisfied: CI pipeline runs lint → typecheck → vitest → next build on every PR

---
*Phase: 01-foundation*
*Completed: 2026-05-23*
