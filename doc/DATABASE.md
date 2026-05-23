# Scaffold — Database

> Full schema, ERD, indexes, RLS policies, constraints, and migration strategy

---

## 1. Design Principles

- **UUID primary keys** everywhere — non-enumerable, safe to expose in URLs
- **`created_at` / `updated_at`** on all tables — managed by DB trigger, never app code
- **RLS on every user-facing table** — Supabase enforces at DB layer; app cannot bypass
- **Additive-only migrations in v1** — no column drops, renames, or type changes
- **JSONB for variable-shape data** (stack tools, playbook steps) with Zod validation at app layer
- **No soft deletes for v1** — delete is delete; data export covers user data needs

---

## 2. Entity Relationship Diagram

```
users ──────────────────────────────────────────────────────────────────────┐
  │ id                                                                       │
  │                                                                          │
  ├──< stacks (user_id)                                                      │
  │     │                                                                    │
  │     └──< playbook_runs (stack_id)                                        │
  │                                                                          │
  ├──< playbooks (owner_id)                                                  │
  │                                                                          │
  ├──< templates (owner_id)                                                  │
  │                                                                          │
  ├──< playbook_runs (user_id)                                               │
  │     └── playbooks (playbook_id) ─────────────────────────── playbooks   │
  │                                                                          │
  ├──< decisions (user_id)                                                   │
  │                                                                          │
  └──< team_members (user_id)                                                │
        └── teams (team_id) ──< team_members                                │
              │                                                              │
              ├──< stacks (team_id)                                          │
              ├──< playbooks (team_id)                                       │
              ├──< templates (team_id)                                       │
              └──< decisions (team_id)                                       │
                                                                             │
stripe_events (standalone — no FK, idempotency store) ──────────────────────┘
```

---

## 3. Full Schema

### 3.1 Triggers (shared)

```sql
-- Trigger function: auto-update updated_at on any mutable table
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to each mutable table:
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (Repeat for stacks, templates, playbooks, playbook_runs)
```

---

### 3.2 users

```sql
CREATE TABLE users (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text        UNIQUE NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name                text        CHECK (char_length(name) <= 100),
  avatar_url          text,
  plan                text        NOT NULL DEFAULT 'free'
                                  CHECK (plan IN ('free', 'solo', 'team', 'studio')),
  plan_expires_at     timestamptz,
  stripe_customer_id  text        UNIQUE,
  onboarding_done     bool        NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Notes:**
- `plan` is source of truth for feature access — set only via Stripe webhook
- `onboarding_done` flags whether guided onboarding flow has been completed
- `stripe_customer_id` is null for Free users who have never started checkout

---

### 3.3 teams

```sql
CREATE TABLE teams (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL CHECK (char_length(name) <= 100),
  owner_id            uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                text        NOT NULL DEFAULT 'team'
                                  CHECK (plan IN ('team', 'studio')),
  stripe_customer_id  text        UNIQUE,
  max_members         int         NOT NULL DEFAULT 8 CHECK (max_members > 0),
  slack_config        jsonb,
  -- slack_config: { botToken: string (encrypted), channelId: string, webhookUrl: string }
  created_at          timestamptz NOT NULL DEFAULT now()
);
```

**Notes:**
- Studio plan: `max_members` set to `2147483647` (effectively unlimited)
- `slack_config.botToken` encrypted at rest via Supabase Vault or app-layer AES-256

---

### 3.4 team_members

```sql
CREATE TABLE team_members (
  id         uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid  NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    uuid  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       text  NOT NULL DEFAULT 'member'
                   CHECK (role IN ('owner', 'admin', 'member')),
  joined_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE(team_id, user_id)
);
```

**Notes:**
- Owner is always added to `team_members` at team creation
- Owner cannot be removed without transferring ownership
- Role changes allowed by `owner` only (owner → admin, admin → member, etc.)

---

### 3.5 stacks

```sql
CREATE TABLE stacks (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id     uuid    REFERENCES teams(id) ON DELETE SET NULL,
  name        text    NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text    CHECK (char_length(description) <= 500),
  is_locked   bool    NOT NULL DEFAULT false,
  tools       jsonb   NOT NULL DEFAULT '[]',
  /*
    tools schema:
    [
      {
        "category": "framework | database | auth | payments | email | monitoring | analytics | devops | other",
        "toolId": "nextjs | supabase | stripe | resend | ...",
        "version": "16.x",
        "config": {}   // optional tool-specific config (e.g., Stripe mode)
      }
    ]
  */
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON stacks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Business constraint (app-layer):** Stack cannot be deleted if `playbook_runs` references it with `is_complete = false`.

---

### 3.6 templates

```sql
CREATE TABLE templates (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid    REFERENCES users(id) ON DELETE CASCADE,
  -- owner_id NULL = Scaffold built-in template
  team_id       uuid    REFERENCES teams(id) ON DELETE CASCADE,
  title         text    NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description   text    CHECK (char_length(description) <= 500),
  category      text    NOT NULL
                        CHECK (category IN (
                          'auth', 'payments', 'email', 'ci-cd', 'monitoring',
                          'legal', 'database', 'api', 'frontend', 'devops',
                          'analytics', 'documentation', 'other'
                        )),
  tags          text[]  NOT NULL DEFAULT '{}',
  stack_compat  text[]  NOT NULL DEFAULT '{}',
  -- stack_compat: array of toolIds this template is relevant for
  content       text    NOT NULL,
  -- ALWAYS plain text — never HTML
  version       text    NOT NULL DEFAULT '1.0.0',
  is_stale      bool    NOT NULL DEFAULT false,
  is_public     bool    NOT NULL DEFAULT false,
  copy_count    int     NOT NULL DEFAULT 0 CHECK (copy_count >= 0),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 3.7 playbooks

```sql
CREATE TABLE playbooks (
  id           uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid   REFERENCES users(id) ON DELETE CASCADE,
  -- owner_id NULL = Scaffold built-in playbook
  team_id      uuid   REFERENCES teams(id) ON DELETE CASCADE,
  title        text   NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description  text   CHECK (char_length(description) <= 1000),
  category     text   NOT NULL
                      CHECK (category IN (
                        'mvp', 'feature', 'production-deploy',
                        'startup', 'client-project', 'other'
                      )),
  is_built_in  bool   NOT NULL DEFAULT false,
  is_public    bool   NOT NULL DEFAULT false,
  steps        jsonb  NOT NULL DEFAULT '[]',
  /*
    steps schema:
    [
      {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "auto_complete_tool_id": "stripe | supabase | ...",  // optional
        "category": "string",   // optional grouping
        "required": true        // optional — if false, step is advisory only
      }
    ]
  */
  forked_from  uuid   REFERENCES playbooks(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### 3.8 playbook_runs

```sql
CREATE TABLE playbook_runs (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id      uuid    NOT NULL REFERENCES playbooks(id),
  user_id          uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name     text    NOT NULL CHECK (char_length(project_name) BETWEEN 1 AND 200),
  stack_id         uuid    REFERENCES stacks(id) ON DELETE SET NULL,
  completed_steps  text[]  NOT NULL DEFAULT '{}',
  -- Array of step IDs from playbook.steps[].id
  due_date         date,
  is_complete      bool    NOT NULL DEFAULT false,
  completed_at     timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON playbook_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Computed fields (app-layer):**
- `progress` = `completed_steps.length / playbook.steps.length × 100`
- Auto-completed steps = steps where `auto_complete_tool_id` matches a `toolId` in linked `stack.tools`

---

### 3.9 decisions

```sql
CREATE TABLE decisions (
  id              uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id         uuid   REFERENCES teams(id) ON DELETE CASCADE,
  title           text   NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  context         text   CHECK (char_length(context) <= 5000),
  chosen          text   NOT NULL CHECK (char_length(chosen) <= 2000),
  alternatives    text   CHECK (char_length(alternatives) <= 5000),
  rationale       text   CHECK (char_length(rationale) <= 5000),
  stack_id        uuid   REFERENCES stacks(id) ON DELETE SET NULL,
  tags            text[] NOT NULL DEFAULT '{}',

  -- Full-text search vector (auto-maintained by PostgreSQL)
  search_vector   tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(context, '') || ' ' ||
      coalesce(chosen, '') || ' ' ||
      coalesce(rationale, '')
    )
  ) STORED,

  created_at      timestamptz NOT NULL DEFAULT now()
  -- No updated_at — decisions are immutable after creation (append-only log)
);
```

---

### 3.10 stripe_events

```sql
CREATE TABLE stripe_events (
  id          text        PRIMARY KEY,        -- Stripe event ID (evt_...)
  type        text        NOT NULL,           -- customer.subscription.updated, etc.
  processed   bool        NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**Purpose:** Idempotency guard. Before processing any Stripe webhook, check `SELECT id FROM stripe_events WHERE id = $1`. If row exists, return 200 immediately without processing.

---

### 3.11 pending_invites

```sql
CREATE TABLE pending_invites (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  role        text        NOT NULL DEFAULT 'member',
  token       text        NOT NULL UNIQUE,   -- secure random token for invite link
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted    bool        NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. Indexes

```sql
-- decisions: full-text search
CREATE INDEX idx_decisions_fts     ON decisions USING GIN(search_vector);
CREATE INDEX idx_decisions_user    ON decisions(user_id);
CREATE INDEX idx_decisions_team    ON decisions(team_id);

-- templates: array filtering + browse
CREATE INDEX idx_templates_tags    ON templates USING GIN(tags);
CREATE INDEX idx_templates_compat  ON templates USING GIN(stack_compat);
CREATE INDEX idx_templates_public  ON templates(is_public) WHERE is_public = true;
CREATE INDEX idx_templates_stale   ON templates(is_stale)  WHERE is_stale = true;
CREATE INDEX idx_templates_owner   ON templates(owner_id);
CREATE INDEX idx_templates_team    ON templates(team_id);
CREATE INDEX idx_templates_cat     ON templates(category);

-- stacks
CREATE INDEX idx_stacks_user       ON stacks(user_id);
CREATE INDEX idx_stacks_team       ON stacks(team_id);

-- playbooks
CREATE INDEX idx_playbooks_owner   ON playbooks(owner_id);
CREATE INDEX idx_playbooks_team    ON playbooks(team_id);
CREATE INDEX idx_playbooks_builtin ON playbooks(is_built_in) WHERE is_built_in = true;

-- playbook_runs: active runs dashboard
CREATE INDEX idx_runs_user_active  ON playbook_runs(user_id, is_complete);
CREATE INDEX idx_runs_playbook     ON playbook_runs(playbook_id);

-- team_members
CREATE INDEX idx_members_team      ON team_members(team_id);
CREATE INDEX idx_members_user      ON team_members(user_id);

-- pending_invites
CREATE INDEX idx_invites_token     ON pending_invites(token);
CREATE INDEX idx_invites_team      ON pending_invites(team_id);
```

---

## 5. Row Level Security (RLS)

All policies use `auth.uid()` from Supabase Auth JWT.

### users

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_self_read ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY users_self_update ON users
  FOR UPDATE USING (id = auth.uid());
```

### stacks

```sql
ALTER TABLE stacks ENABLE ROW LEVEL SECURITY;

-- Personal stacks
CREATE POLICY stacks_owner ON stacks
  FOR ALL USING (user_id = auth.uid() AND team_id IS NULL);

-- Team stacks — any member can read
CREATE POLICY stacks_team_read ON stacks
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- Team stacks — only non-locked; only admin/owner can write
CREATE POLICY stacks_team_write ON stacks
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY stacks_team_update ON stacks
  FOR UPDATE USING (
    is_locked = false AND
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
```

### templates

```sql
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Built-in (public) templates — anyone can read
CREATE POLICY templates_builtin_read ON templates
  FOR SELECT USING (owner_id IS NULL);

-- Public user-created templates
CREATE POLICY templates_public_read ON templates
  FOR SELECT USING (is_public = true);

-- Personal templates
CREATE POLICY templates_owner ON templates
  FOR ALL USING (owner_id = auth.uid());

-- Team templates — members can read, admin/owner can write
CREATE POLICY templates_team_read ON templates
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

CREATE POLICY templates_team_write ON templates
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
```

### playbooks

```sql
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY playbooks_builtin   ON playbooks FOR SELECT USING (is_built_in = true);
CREATE POLICY playbooks_public    ON playbooks FOR SELECT USING (is_public = true);
CREATE POLICY playbooks_owner     ON playbooks FOR ALL USING (owner_id = auth.uid());
CREATE POLICY playbooks_team_read ON playbooks
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
```

### playbook_runs

```sql
ALTER TABLE playbook_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY runs_owner ON playbook_runs
  FOR ALL USING (user_id = auth.uid());
```

### decisions

```sql
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY decisions_owner ON decisions
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY decisions_team ON decisions
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );
```

---

## 6. Migration Strategy

### 6.1 Naming Convention

```
db/migrations/
  0001_initial_schema.sql
  0002_add_onboarding_done_to_users.sql
  0003_add_decisions_tags.sql
  0004_add_pending_invites.sql
```

### 6.2 Safe Migration Patterns

```sql
-- ✅ ADD column with default (safe, instant)
ALTER TABLE users ADD COLUMN onboarding_done bool NOT NULL DEFAULT false;

-- ✅ ADD new table (safe)
CREATE TABLE pending_invites (...);

-- ✅ ADD index concurrently (safe, non-blocking)
CREATE INDEX CONCURRENTLY idx_new ON table(col);

-- ✅ ADD constraint (safe if existing data already satisfies it)
ALTER TABLE stacks ADD CONSTRAINT name_not_empty CHECK (char_length(name) > 0);

-- ❌ DROP column (forbidden in v1)
-- ❌ RENAME column (forbidden in v1)
-- ❌ CHANGE column type (forbidden in v1)
-- ❌ DROP table (forbidden in v1)
```

### 6.3 Migration Workflow

```bash
# 1. Update Drizzle schema in db/schema/
# 2. Generate migration SQL
pnpm db:generate

# 3. Review generated SQL — confirm additive-only
# 4. Apply to staging
SUPABASE_URL=staging pnpm db:push

# 5. Run integration tests against staging
pnpm test:integration

# 6. Apply to production (before code deploy)
pnpm db:push

# 7. Deploy code
```

---

## 7. Seed Data (Development)

```sql
-- Scaffold built-in playbooks (is_built_in = true, owner_id = null)
INSERT INTO playbooks (title, category, is_built_in, steps) VALUES
  ('New SaaS MVP', 'mvp', true, '[
    {"id":"p1","title":"Set up auth","auto_complete_tool_id":"supabase"},
    {"id":"p2","title":"Configure Stripe","auto_complete_tool_id":"stripe"},
    {"id":"p3","title":"Set up email","auto_complete_tool_id":"resend"},
    {"id":"p4","title":"Add error monitoring","auto_complete_tool_id":"sentry"},
    {"id":"p5","title":"Add analytics","auto_complete_tool_id":"posthog"},
    {"id":"p6","title":"Write Privacy Policy"},
    {"id":"p7","title":"Write Terms of Service"},
    {"id":"p8","title":"Set up CI/CD"}
  ]'),
  ('Production Deploy', 'production-deploy', true, '[...]'),
  ('New Feature Launch', 'feature', true, '[...]');
```

---

## 8. Performance Notes

- Supabase connection pooling: PgBouncer in **transaction mode** — each serverless function gets a pooled connection, released immediately after query
- Max pool size: 25 per Vercel function instance
- Long queries (>5s) are killed by Supabase statement timeout
- `pg_trgm` extension required for GIN full-text search on `decisions.search_vector`
- `uuid-ossp` or `pgcrypto` required for `gen_random_uuid()` (enabled by default in Supabase)