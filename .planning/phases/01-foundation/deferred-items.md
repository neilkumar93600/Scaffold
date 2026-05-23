# Deferred Items — Phase 01 Foundation

## Out-of-Scope Issues Found During Plan 01-05 Execution

### Pre-existing TypeScript error: `timestamptz` not exported from drizzle-orm/pg-core

**Found during:** Task 1 (typecheck verification)
**Status:** Pre-existing from plan 01-01 schema files
**Files affected:**
- lib/db/schema/stacks.ts
- lib/db/schema/team-invites.ts
- lib/db/schema/team-members.ts
- lib/db/schema/teams.ts
- lib/db/schema/templates.ts
- lib/db/schema/users.ts

**Issue:** `timestamptz` is not a valid export from `drizzle-orm/pg-core`. The correct function is `timestamp` with `.mode('date')` or using `timestamp('col', { withTimezone: true })`.

**Action needed:** Replace `timestamptz` imports and usages with `timestamp` in all schema files. Should be addressed in a future database migration plan.
