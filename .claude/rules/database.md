# Database Rules — Scaffold

## Schema Conventions

### Naming
- Tables: `snake_case`, plural (e.g., `users`, `team_members`, `playbook_runs`)
- Columns: `snake_case` (e.g., `user_id`, `created_at`, `is_complete`)
- Indexes: `idx_[table]_[column(s)]` (e.g., `idx_stacks_user_id`)
- Policies: `[verb]_[resource]` (e.g., `user_own`, `team_member`, `public_read`)

### Primary Keys
- Always UUID: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- Never sequential integers — exposable and enumerable

### Timestamps
- Every table: `created_at timestamptz NOT NULL DEFAULT now()`
- Mutable tables: also `updated_at timestamptz NOT NULL DEFAULT now()`
- Managed by DB trigger — not application code

### Foreign Keys
- Always reference `users(id) ON DELETE CASCADE` for user-owned data
- Team references: `teams(id) ON DELETE SET NULL` for data that survives team deletion
- Never use `ON DELETE NO ACTION` without explicit justification

## Drizzle ORM Usage

### Schema definition
```ts
// db/schema/stacks.ts
import { pgTable, uuid, text, jsonb, boolean, timestamptz } from 'drizzle-orm/pg-core'

export const stacks = pgTable('stacks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  isLocked: boolean('is_locked').notNull().default(false),
  tools: jsonb('tools').notNull().default([]),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
})
```

### Queries
```ts
// ✅ Parameterised — Drizzle handles this
const stack = await db.select().from(stacks).where(eq(stacks.id, id))

// ❌ Never raw string interpolation
await db.execute(sql`SELECT * FROM stacks WHERE id = '${id}'`)  // WRONG
```

### No N+1 Queries
```ts
// ❌ N+1
for (const run of runs) {
  run.playbook = await db.select().from(playbooks).where(eq(playbooks.id, run.playbookId))
}

// ✅ Join or batch
const runsWithPlaybooks = await db
  .select()
  .from(playbookRuns)
  .leftJoin(playbooks, eq(playbooks.id, playbookRuns.playbookId))
  .where(eq(playbookRuns.userId, userId))
```

## Row Level Security (RLS)

**Every user-facing table MUST have RLS enabled and policies defined.**

### Required Patterns

```sql
-- Personal resources
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own ON stacks
  FOR ALL USING (user_id = auth.uid());

-- Team resources
CREATE POLICY team_member ON templates
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Public read (no auth needed)
CREATE POLICY public_read ON templates
  FOR SELECT USING (is_public = true);

-- Admin-only mutations
CREATE POLICY team_admin_update ON stacks
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
```

### RLS Testing
Every new table's RLS policies must be tested in `__tests__/rls/[table].test.ts`:
```ts
it('blocks user from reading another user\'s stack', async () => {
  const res = await supabaseUser2.from('stacks').select().eq('id', user1StackId)
  expect(res.data).toHaveLength(0)
})
```

## Migrations

### Policy
- **Additive-only** in v1 (no column drops, no renames)
- Every migration reviewed in PR before `drizzle-kit push`
- Files in `db/migrations/` with timestamp prefix: `0001_initial_schema.sql`

### Safe Migration Patterns
```sql
-- ✅ Add column with default (safe)
ALTER TABLE users ADD COLUMN onboarding_complete bool NOT NULL DEFAULT false;

-- ✅ Add new table (safe)
CREATE TABLE new_feature (...);

-- ✅ Add index (safe, concurrent)
CREATE INDEX CONCURRENTLY idx_new ON table(column);

-- ❌ Never in v1:
ALTER TABLE users DROP COLUMN name;
ALTER TABLE users RENAME COLUMN old_name TO new_name;
DROP TABLE old_feature;
```

## JSONB Usage

JSONB columns (`tools`, `steps`) store structured data that varies per row.

Rules:
- Always provide a default (`DEFAULT '[]'` or `DEFAULT '{}'`)
- Document the expected shape in a SQL comment in the schema
- Do NOT store queryable fields in JSONB — use real columns
- Validate JSONB structure at the Zod layer before writing

## Performance

- Index all `user_id` and `team_id` columns (B-tree)
- Use `GIN` index for `text[]` and `tsvector` columns
- Use `CREATE INDEX CONCURRENTLY` for adding indexes to live tables
- Use Supabase PgBouncer (transaction mode) — avoid long-lived transactions
- Avoid `SELECT *` — always name columns in Drizzle select