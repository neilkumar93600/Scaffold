---
phase: 01-foundation
plan: "02"
subsystem: database
tags: [drizzle-orm, postgresql, supabase, rls, schema, typescript]

# Dependency graph
requires:
  - phase: 01-foundation plan 01
    provides: Drizzle ORM installed, drizzle.config.ts, lib/db/index.ts base singleton
provides:
  - 11 Drizzle domain table schema files (users, teams, team_members, team_invites, stacks, templates, playbooks, playbook_steps, playbook_runs, run_steps, decisions)
  - lib/db/schema/index.ts barrel re-export of all tables
  - lib/db/index.ts updated with schema import for full Drizzle type awareness
  - lib/db/migrations/0001_rls.sql with ENABLE ROW LEVEL SECURITY + CREATE POLICY for all 11 tables
affects: [all modules in lib/modules/, api routes, M1-auth, M2-stacks, M3-playbooks, M4-templates, M5-init, M6-decisions]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-table schema files with sibling imports (never via index) to prevent circular dependencies"
    - "timestamp({ withTimezone: true }) instead of timestamptz for drizzle-orm 0.45.2"
    - "JSONB columns for variable-shape arrays (tools, tags, stackCompat, autoCompleteFor) with [] default"
    - "UUID PKs via defaultRandom() on all tables"
    - "onDelete: cascade for user-owned data, onDelete: set null for team references"

key-files:
  created:
    - lib/db/schema/users.ts
    - lib/db/schema/teams.ts
    - lib/db/schema/team-members.ts
    - lib/db/schema/team-invites.ts
    - lib/db/schema/stacks.ts
    - lib/db/schema/templates.ts
    - lib/db/schema/playbooks.ts
    - lib/db/schema/playbook-steps.ts
    - lib/db/schema/playbook-runs.ts
    - lib/db/schema/run-steps.ts
    - lib/db/schema/decisions.ts
    - lib/db/schema/index.ts
    - lib/db/migrations/0001_rls.sql
  modified:
    - lib/db/index.ts
    - .env.example

key-decisions:
  - "timestamp({ withTimezone: true }) is the correct Drizzle 0.45.2 API — timestamptz does not exist as an export"
  - "Sibling imports (from './users' not from './index') in all cross-table schemas to prevent circular dependency chains"

patterns-established:
  - "Schema pattern: all tables use UUID PK + created_at; mutable tables also have updated_at"
  - "FK pattern: user-owned data CASCADE, team-associated data SET NULL"
  - "JSONB pattern: variable-shape arrays stored as JSONB with documented shape in comment, Zod validates before write"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-05-23
---

# Phase 01 Plan 02: Database Schema Summary

**11-table Drizzle schema (users → decisions) with JSONB fields, FK cascade/set-null rules, barrel index, and RLS SQL migration ready for Supabase push**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-23T09:00:06Z
- **Completed:** 2026-05-23T09:04:05Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments

- All 11 core domain tables defined as TypeScript Drizzle schema files under lib/db/schema/
- lib/db/schema/index.ts barrel re-exports all 11 tables for clean downstream imports
- lib/db/index.ts updated with `import * as schema` for full Drizzle query type awareness
- lib/db/migrations/0001_rls.sql created with ENABLE ROW LEVEL SECURITY + 17 CREATE POLICY statements across all 11 tables

## Task Commits

Each task was committed atomically:

1. **Task 1: Define all 11 domain table schema files** - `6e3398f` (feat)
2. **Task 2: Schema barrel index + update db singleton** - `ae6d695` (feat)
3. **Task 3: RLS SQL migration for all 11 tables** - `b74a33c` (feat)

## Files Created/Modified

- `lib/db/schema/users.ts` - User table with plan, stripe fields, onboarding flag
- `lib/db/schema/teams.ts` - Team table with slug
- `lib/db/schema/team-members.ts` - Join table with role (owner/admin/member)
- `lib/db/schema/team-invites.ts` - Invite with token + expiry
- `lib/db/schema/stacks.ts` - Stack with JSONB tools array, isLocked flag, user + team FKs
- `lib/db/schema/templates.ts` - Template with tags/stackCompat JSONB, isPublic/isStale flags
- `lib/db/schema/playbooks.ts` - Playbook with shareToken, forkedFromId, isBuiltIn
- `lib/db/schema/playbook-steps.ts` - Step with order, autoCompleteFor JSONB, isRequired
- `lib/db/schema/playbook-runs.ts` - Run tracking with status and dueDate
- `lib/db/schema/run-steps.ts` - Per-step completion state with autoCompleted flag
- `lib/db/schema/decisions.ts` - Decision log with context, rationale, alternatives
- `lib/db/schema/index.ts` - Barrel re-export of all 11 tables
- `lib/db/migrations/0001_rls.sql` - RLS enable + policies for all 11 tables
- `lib/db/index.ts` - Updated: schema import + RLS comment
- `.env.example` - Added note to apply RLS migration after db:push

## Decisions Made

- **timestamp({ withTimezone: true }) not timestamptz**: drizzle-orm 0.45.2 does not export `timestamptz`; the correct API is `timestamp('col', { withTimezone: true })`. Auto-fixed during Task 1.
- **Sibling imports throughout**: cross-table schemas import directly from sibling files (e.g., `from './users'`) not via `./index` to prevent circular dependency chains.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `timestamptz` not a valid drizzle-orm/pg-core export in version 0.45.2**
- **Found during:** Task 1 (Define all 11 domain table schema files)
- **Issue:** Plan specified `timestamptz` as the import name but drizzle-orm 0.45.2 exports `timestamp` only; all 11 files failed typecheck
- **Fix:** Replaced `timestamptz(...)` with `timestamp('col', { withTimezone: true })` across all 11 schema files
- **Files modified:** All 11 schema files
- **Verification:** `npm run typecheck` exits 0, `npm run build` completes successfully
- **Committed in:** `6e3398f` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - wrong API name for installed drizzle-orm version)
**Impact on plan:** Essential correctness fix. No schema logic or structure changed.

## Issues Encountered

None beyond the auto-fixed timestamptz API mismatch.

## User Setup Required

After running `pnpm db:push` to create tables in Supabase, apply RLS policies manually:

```bash
psql $DATABASE_URL -f lib/db/migrations/0001_rls.sql
```

Or paste the file contents into Supabase Dashboard → SQL Editor.

## Next Phase Readiness

- All 11 domain tables defined and ready for `pnpm db:push`
- Drizzle db singleton has full schema type awareness for typed queries
- RLS policies prepared — require one manual apply step after db:push
- All subsequent modules (M1–M6) can now import from `@/lib/db` and `@/lib/db/schema`

---
*Phase: 01-foundation*
*Completed: 2026-05-23*
