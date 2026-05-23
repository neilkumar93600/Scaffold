# Scaffold — Technical Requirements Document
> Architecture, API contracts, database schema, and engineering decisions for v1.0
> Version: 1.0 | Status: Active

---

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [API Contracts](#4-api-contracts)
5. [Security & Authentication](#5-security--authentication)
6. [Infrastructure & Deployment](#6-infrastructure--deployment)
7. [Performance Requirements](#7-performance-requirements)
8. [Integration Points](#8-integration-points)
9. [Risk Register](#9-risk-register)
10. [Definition of Done](#10-definition-of-done)

---

## 1. System Architecture

Scaffold uses a **modular monolith** for v1.0 — one Next.js deployment, clean bounded modules, PostgreSQL via Supabase. This reduces operational overhead at early scale while keeping module boundaries ready for service extraction if needed.

### 1.1 Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser / CLI                                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────────┐
│  Vercel Edge Network                                            │
│  • Rate limiting (Upstash Redis)                               │
│  • Auth middleware (JWT validation)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│  Next.js 16 App Router (Vercel)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  RSC Pages   │  │  API Routes  │  │  Middleware            │ │
│  │  /app/...    │  │  /api/v1/*   │  │  auth + plan enforce  │ │
│  └──────────────┘  └──────┬───────┘  └───────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
              ┌───────────────┼───────────────────────┐
              │               │                       │
┌─────────────▼──┐  ┌─────────▼──────┐  ┌────────────▼──────────┐
│  Supabase      │  │  Upstash Redis  │  │  Inngest Workers      │
│  • PostgreSQL  │  │  • Rate limits  │  │  • Scaffold ZIP gen   │
│  • Auth        │  │  • Template TTL │  │  • Staleness check    │
│  • Storage     │  └────────────────┘  │  • Email dispatch     │
└────────────────┘                      └───────────┬───────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  Resend Email        │
                                         └──────────────────────┘
                                         ┌──────────────────────┐
                                         │  Stripe Webhooks     │
                                         └──────────────────────┘
```

### 1.2 Request Flow

```
1. Browser / CLI
   → Vercel Edge: rate-limit check (Upstash), JWT validation
   → Next.js App Router: RSC or API route
   → Middleware: plan enforcement check
   → Module handler: business logic
   → Supabase PostgreSQL: RLS-enforced query

2. Background (async):
   Inngest worker
   → Template staleness service (npm/PyPI registry)
   → Resend email dispatch (batched, max 100/batch)

3. Payments:
   Stripe webhook POST /api/v1/webhooks/stripe
   → Idempotency check (stripe_events table)
   → Plan enforcement service
   → user.plan update in PostgreSQL
```

---

## 2. Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js | 16.x | App Router RSC + API routes; one deployment for web + API |
| Language | TypeScript | 5.x | Type safety; Zod integration |
| Styling | Tailwind CSS | 4.x | Utility-first; no runtime |
| Components | shadcn/ui + Radix UI | Latest | Accessible, unstyled primitives; owned code |
| Database | PostgreSQL via Supabase | 15 | Relational model; RLS; pg_trgm for FTS |
| Auth | Supabase Auth | v2 | GitHub + Google OAuth; JWT sessions |
| ORM | Drizzle ORM | Latest | Type-safe SQL; migration via drizzle-kit |
| Validation | Zod | 3.x | Schema-first; composable; tRPC-compatible |
| File Storage | Supabase Storage | v2 | ZIP storage; 48h presigned URLs |
| Cache | Upstash Redis | Latest | Serverless-native; rate limiting + template TTL |
| Background Jobs | Inngest | Latest | Typed events; retries; observability |
| Email | Resend + React Email | Latest | Deliverability; JSX templates |
| Payments | Stripe | Latest | Subscriptions; Billing Portal; webhooks |
| Error Monitoring | Sentry | Latest | Server + client; performance traces |
| Analytics | PostHog | Latest | Event-based; self-hostable migration path |
| Deployment | Vercel | Latest | Next.js-native; instant rollback |
| Unit Tests | Vitest | Latest | Fast; native ESM; same config as app |
| E2E Tests | Playwright | Latest | Cross-browser; CI-friendly |
| Linting | ESLint + Prettier | Latest | Enforced in CI |
| CLI | npm package `scaffold-cli` | — | Calls Scaffold API via stored API token |

---

## 3. Database Schema

All tables use `UUID` primary keys (`gen_random_uuid()`). `created_at` and `updated_at` are managed by database triggers. **Row Level Security (RLS) is enabled on every user-facing table** — no row is accessible unless the authenticated user has explicit permission.

### 3.1 users

```sql
CREATE TABLE users (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text        UNIQUE NOT NULL,
  name                text,
  avatar_url          text,
  plan                text        NOT NULL DEFAULT 'free'
                                  CHECK (plan IN ('free', 'solo', 'team', 'studio')),
  plan_expires_at     timestamptz,
  stripe_customer_id  text        UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

### 3.2 teams

```sql
CREATE TABLE teams (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text        NOT NULL,
  owner_id            uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                text        NOT NULL DEFAULT 'team'
                                  CHECK (plan IN ('team', 'studio')),
  stripe_customer_id  text        UNIQUE,
  max_members         int         NOT NULL DEFAULT 8,
  slack_config        jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);
```

### 3.3 team_members

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

### 3.4 stacks

```sql
CREATE TABLE stacks (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id     uuid    REFERENCES teams(id) ON DELETE SET NULL,
  name        text    NOT NULL,
  is_locked   bool    NOT NULL DEFAULT false,
  tools       jsonb   NOT NULL DEFAULT '[]',
  -- tools: [{ category: string, toolId: string, version: string, config: object }]
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

### 3.5 templates

```sql
CREATE TABLE templates (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid    REFERENCES users(id),     -- null = Scaffold built-in
  team_id       uuid    REFERENCES teams(id),
  title         text    NOT NULL,
  category      text    NOT NULL,
  tags          text[]  NOT NULL DEFAULT '{}',
  stack_compat  text[]  NOT NULL DEFAULT '{}',   -- tool IDs this template requires
  content       text    NOT NULL,
  version       text    NOT NULL DEFAULT '1.0.0',
  is_stale      bool    NOT NULL DEFAULT false,
  is_public     bool    NOT NULL DEFAULT false,
  copy_count    int     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

### 3.6 playbooks

```sql
CREATE TABLE playbooks (
  id           uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid   REFERENCES users(id),
  team_id      uuid   REFERENCES teams(id),
  title        text   NOT NULL,
  category     text   NOT NULL,
  is_built_in  bool   NOT NULL DEFAULT false,
  steps        jsonb  NOT NULL DEFAULT '[]',
  -- steps: [{ id: uuid, title: string, description: string, auto_complete_tool_id?: string }]
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

### 3.7 playbook_runs

```sql
CREATE TABLE playbook_runs (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id      uuid    NOT NULL REFERENCES playbooks(id),
  user_id          uuid    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_name     text    NOT NULL,
  stack_id         uuid    REFERENCES stacks(id) ON DELETE SET NULL,
  completed_steps  text[]  NOT NULL DEFAULT '{}',
  due_date         date,
  is_complete      bool    NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
```

### 3.8 decisions

```sql
CREATE TABLE decisions (
  id              uuid   PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id         uuid   REFERENCES teams(id) ON DELETE CASCADE,
  title           text   NOT NULL,
  context         text,
  chosen          text   NOT NULL,
  alternatives    text,
  rationale       text,
  stack_id        uuid   REFERENCES stacks(id) ON DELETE SET NULL,
  search_vector   tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(context,'') || ' ' ||
      coalesce(rationale,'')
    )
  ) STORED,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### 3.9 stripe_events (idempotency)

```sql
CREATE TABLE stripe_events (
  id          text        PRIMARY KEY,   -- Stripe event ID
  type        text        NOT NULL,
  processed   bool        NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

### 3.10 Indexes

```sql
-- Full-text search on decisions
CREATE INDEX idx_decisions_search ON decisions USING GIN(search_vector);

-- Array filtering on templates
CREATE INDEX idx_templates_tags       ON templates USING GIN(tags);
CREATE INDEX idx_templates_compat     ON templates USING GIN(stack_compat);
CREATE INDEX idx_templates_public     ON templates(is_public) WHERE is_public = true;

-- Ownership queries (all tables)
CREATE INDEX idx_stacks_user_id       ON stacks(user_id);
CREATE INDEX idx_stacks_team_id       ON stacks(team_id);
CREATE INDEX idx_templates_owner_id   ON templates(owner_id);
CREATE INDEX idx_templates_team_id    ON templates(team_id);
CREATE INDEX idx_playbooks_owner_id   ON playbooks(owner_id);
CREATE INDEX idx_playbooks_team_id    ON playbooks(team_id);
CREATE INDEX idx_decisions_user_id    ON decisions(user_id);
CREATE INDEX idx_decisions_team_id    ON decisions(team_id);

-- Active runs dashboard
CREATE INDEX idx_runs_active ON playbook_runs(user_id, is_complete) WHERE is_complete = false;
```

### 3.11 RLS Policies

```sql
-- Personal resources (stacks, decisions, runs)
CREATE POLICY user_own ON stacks
  FOR ALL USING (user_id = auth.uid());

-- Team resources
CREATE POLICY team_member ON templates
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  );

-- Public templates (read-only, no auth)
CREATE POLICY public_read ON templates
  FOR SELECT USING (is_public = true);

-- Admin actions
CREATE POLICY team_admin ON stacks
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
```

---

## 4. API Contracts

**Base path:** `/api/v1/`
**Auth:** `Authorization: Bearer <token>`
**Content-Type:** `application/json`
**Error shape:** `{ error: string, code: string }`
**Plan limit error:** HTTP 402 `{ code: 'PLAN_LIMIT', resource: string, current: number, max: number }`

### 4.1 Auth

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| GET | `/auth/me` | Required | 200 user object | Returns current user + plan |
| DELETE | `/auth/session` | Required | 204 | Logout / invalidate session |
| POST | `/auth/tokens` | Required | 201 `{ token }` | Generate CLI API token (shown once) |
| DELETE | `/auth/tokens/:id` | Required | 204 | Revoke CLI token |

### 4.2 Stacks

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| GET | `/stacks` | Required | 200 array | List user's stacks |
| POST | `/stacks` | Required | 201 stack | Create stack; plan-limit check |
| GET | `/stacks/:id` | Required | 200 stack | Get single stack |
| PATCH | `/stacks/:id` | Required | 200 stack | Update stack; RLS enforced |
| DELETE | `/stacks/:id` | Required | 204 | Soft-delete; active runs unaffected |
| POST | `/stacks/detect` | Required | 200 `{ tools[] }` | Import from `package.json` |

### 4.3 Templates

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| GET | `/templates` | Optional | 200 array | Public browse; filter by category, tags, stack |
| GET | `/templates/:id` | Optional | 200 template | Get single template |
| POST | `/templates` | Required | 201 template | Create personal template |
| PATCH | `/templates/:id` | Required | 200 template | Update; owner_id check |
| DELETE | `/templates/:id` | Required | 204 | Owner only |
| POST | `/templates/:id/copy` | Required | 200 `{ copied: true }` | Increment copy_count |

### 4.4 Playbooks

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| GET | `/playbooks` | Optional | 200 array | Built-in + user-owned |
| GET | `/playbooks/:id` | Optional | 200 playbook | |
| POST | `/playbooks` | Required | 201 playbook | Create or fork |
| POST | `/playbooks/:id/fork` | Required | 201 playbook | Deep copy, new owner_id |
| PATCH | `/playbooks/:id` | Required | 200 playbook | Update steps |
| DELETE | `/playbooks/:id` | Required | 204 | Cannot delete built-in |

### 4.5 Playbook Runs

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| GET | `/runs` | Required | 200 array | Active runs for current user |
| POST | `/runs` | Required | 201 run | Start new run; auto-complete stack steps |
| GET | `/runs/:id` | Required | 200 run | Get run with progress |
| PATCH | `/runs/:id/steps/:stepId` | Required | 200 run | Toggle step complete |
| PATCH | `/runs/:id` | Required | 200 run | Update due_date, project_name |
| DELETE | `/runs/:id` | Required | 204 | |

### 4.6 Project Init

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| POST | `/init` | Required | 202 `{ jobId }` | Trigger async ZIP generation |
| GET | `/init/:jobId` | Required | 200 `{ status, downloadUrl? }` | Poll until status=complete |

### 4.7 Decisions

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| GET | `/decisions` | Required | 200 array | User + team decisions; search via `?q=` |
| POST | `/decisions` | Required | 201 decision | Solo+ plan required |
| GET | `/decisions/:id` | Required | 200 decision | |
| PATCH | `/decisions/:id` | Required | 200 decision | |
| DELETE | `/decisions/:id` | Required | 204 | |

### 4.8 Teams

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| POST | `/teams` | Required | 201 team | Creates team + sets owner |
| GET | `/teams/:id` | Required | 200 team | Members visible to any member |
| POST | `/teams/:id/invites` | Required | 201 invite | Sends Resend email |
| DELETE | `/teams/:id/members/:userId` | Required | 204 | Admin/owner only |
| PATCH | `/teams/:id/members/:userId` | Required | 200 | Change role; admin/owner only |

### 4.9 Billing

| Method | Path | Auth | Success | Notes |
|---|---|---|---|---|
| POST | `/billing/checkout` | Required | 200 `{ url }` | Stripe Checkout redirect |
| POST | `/billing/portal` | Required | 200 `{ url }` | Stripe Billing Portal redirect |
| POST | `/webhooks/stripe` | None | 200 | Stripe signature verified |

---

## 5. Security & Authentication

### 5.1 Authentication

| Concern | Implementation |
|---|---|
| Session type | Supabase Auth JWT (1h access / 30d refresh) |
| OAuth providers | GitHub, Google — no passwords stored in Scaffold DB |
| CLI API token | User generates in dashboard. Stored as SHA-256 hash. Shown plaintext once. Revocable. |
| Token rotation | Revoke + regenerate without re-authentication |

### 5.2 Row Level Security (RLS)

RLS enabled on **all** user-facing tables. Enforced at database layer by Supabase.

| Resource | Policy |
|---|---|
| Personal (stacks, decisions, runs) | `WHERE user_id = auth.uid()` |
| Team resources | JOIN `team_members` to verify membership |
| Admin actions | Check `role IN ('admin', 'owner')` in `team_members` |
| Public templates | No auth for SELECT; INSERT/UPDATE requires `owner_id = auth.uid()` |

**CI gate:** RLS policy tests run in GitHub Actions against seeded test DB on every PR.

### 5.3 Plan Enforcement

- All plan limits enforced **server-side** in `planLimits` config object — never trust client-sent plan claims
- Middleware layer checks `user.plan` against limits before every resource-creation endpoint
- Breach response: HTTP 402 `{ code: 'PLAN_LIMIT', resource, current, max }`
- Plan upgrades take effect immediately on Stripe webhook receipt

```ts
const planLimits = {
  free:   { projects: 3, templates: 15, teamMembers: 0, decisionLog: false },
  solo:   { projects: Infinity, templates: Infinity, teamMembers: 0, decisionLog: true },
  team:   { projects: Infinity, templates: Infinity, teamMembers: 8, decisionLog: true },
  studio: { projects: Infinity, templates: Infinity, teamMembers: Infinity, decisionLog: true },
} as const;
```

### 5.4 Input Validation & Sanitisation

| Concern | Mitigation |
|---|---|
| Request bodies | Zod schemas validate all bodies before business logic; 400 on schema failure |
| XSS | Template content stored as plain text; rendered as code blocks — no HTML rendering |
| Path traversal | ZIP generation sandboxed; only whitelisted template fragment files included |
| Stripe webhooks | `stripe.webhooks.constructEvent()` verifies every request signature |
| SQL injection | Drizzle ORM parameterised queries only; no raw string interpolation |
| CSRF | Same-origin JWT + SameSite cookies; no separate CSRF token needed |

---

## 6. Infrastructure & Deployment

### 6.1 Environments

| Environment | URL | Database | Purpose |
|---|---|---|---|
| Local | `localhost:3000` | Supabase local / Docker | Development |
| Preview | Auto per PR (`*.vercel.app`) | Supabase staging project | PR review |
| Staging | `staging.scaffold.app` | Supabase staging project | E2E tests before promote |
| Production | `scaffold.app` | Supabase production project | Live traffic |

### 6.2 CI/CD Pipeline

```
Every PR:
  GitHub Actions:
    1. pnpm install
    2. eslint (lint)
    3. tsc --noEmit (type-check)
    4. vitest run (unit + integration tests)
    5. next build

PR merge to main:
    6. Playwright E2E suite → staging environment

Promote to production (manual trigger):
    7. drizzle-kit generate → reviewed manually
    8. drizzle-kit push → apply migrations
    9. Vercel production deployment

Rollback:
    - Vercel: instant rollback to previous deployment
    - DB: pre-migration snapshot restore
```

### 6.3 Migration Strategy

- **Additive-only** for v1 (no column drops, no renames) — enables zero-downtime deploys
- Every migration reviewed in PR before `drizzle-kit push` runs
- Migration files committed to `db/migrations/` with timestamp prefix

### 6.4 Scaling Considerations

| Concern | Strategy |
|---|---|
| API layer | Vercel functions auto-scale; no manual capacity planning |
| Database connections | Supabase PgBouncer transaction mode; max 25 connections per function instance |
| ZIP generation | Offloaded to Inngest background function for payloads estimated >2s |
| Template list | Cached in Upstash Redis with 5-minute TTL |
| Supabase plan | Pro from day one — no pause on inactivity, PITR available |

---

## 7. Performance Requirements

| Metric | Target | Alert Threshold |
|---|---|---|
| API p50 response time | <150ms | >300ms for 5min |
| API p99 response time | <500ms | >1s for 5min |
| Time to First Byte (TTFB) | <200ms | >400ms |
| Largest Contentful Paint (LCP) | <2.5s | >4s |
| Template list page load | <800ms | >1.5s |
| ZIP generation (background) | <30s | >60s (alert user) |
| Playbook run toggle (step check) | <100ms | >250ms |
| Decision log search | <200ms | >500ms |
| Uptime | 99.9% | <99.5% in rolling 30d |

All metrics measured by Sentry performance traces (server) and Web Vitals (client).

---

## 8. Integration Points

### 8.1 Stripe — Billing

| Concern | Detail |
|---|---|
| Products | Solo, Team, Studio — each with monthly + annual Price (17% discount) |
| Checkout | Create Stripe Customer → create Subscription → store `stripe_customer_id` |
| Billing Portal | Stripe-hosted; handles plan changes, cancellation, invoice history |
| Webhooks consumed | `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `checkout.session.completed` |
| Idempotency | All webhook handlers check `stripe_events` table for duplicate event IDs |
| Downgrade | On `subscription.deleted`: revert `user.plan` to `'free'`; preserve all data; show upgrade prompt |

### 8.2 Supabase — Database, Auth, Storage

| Concern | Detail |
|---|---|
| Client | Supabase JS v2 — `createServerClient()` per request in RSC; `createBrowserClient()` once in client |
| Storage bucket | `'scaffolds'` — path: `{userId}/{projectId}/scaffold.zip` |
| Presigned URL TTL | 48 hours |
| Realtime | NOT used in v1 — no collaborative features in scope |

### 8.3 Inngest — Background Jobs

| Function | Trigger | Behaviour |
|---|---|---|
| `template-staleness-check` | Cron: Sunday 02:00 UTC | Query npm/PyPI for latest versions; update `is_stale` on affected templates |
| `send-stale-notifications` | After staleness check | Query paid users who copied stale templates; batch Resend dispatch (max 100/batch) |
| `generate-scaffold` | POST `/api/v1/init` | Assemble ZIP from template fragments; upload to Supabase Storage; update job status |

### 8.4 Slack Integration (Team Plan)

| Concern | Detail |
|---|---|
| Auth | OAuth install flow; bot token stored encrypted in `teams.slack_config` JSONB |
| Events posted | Playbook run completed, new team member joined, template staleness alert |
| Slash command | `/scaffold status [project-name]` → returns playbook run progress as Block Kit message |

### 8.5 Resend — Email

| Template | Trigger |
|---|---|
| Team invite | Admin invites member via `/teams/:id/invites` |
| Staleness alert | Weekly cron finds stale templates copied by paid users |
| Welcome email | User completes onboarding (creates first stack) |
| Billing receipt | On `invoice.payment_succeeded` Stripe webhook |
| Plan downgrade notice | On `customer.subscription.deleted` |

---

## 9. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Supabase outage | Low | High | Vercel functions queue requests; error pages explain status; status page on status.scaffold.app |
| R2 | Template content copyright claims | Medium | Medium | ToS prohibits copyrighted content; built-in templates are Scaffold-owned; DMCA takedown process documented |
| R3 | Stripe webhook missed / duplicate | Medium | High | Idempotency via `stripe_events` table; Stripe retry with exponential backoff; alerting on webhook failures |
| R4 | ZIP generation job failure | Low | Medium | Inngest retry (3x with backoff); job status API for user polling; fallback error message with manual retry |
| R5 | Free plan abuse (burner accounts) | High | Low | Email verification required; rate limiting on project creation; IP-based abuse detection via Vercel middleware |
| R6 | Template staleness alert spam | Medium | Low | Weekly batching; user opt-out in account settings; max 1 email/week per user |
| R7 | Plan limit bypass via API race | Low | Medium | Atomic DB transaction for project creation + count check; no optimistic client-side enforcement |
| R8 | CLI token leakage | Low | High | Tokens stored as SHA-256 hash; shown plaintext once; instant revoke; audit log per token use |

---

## 10. Definition of Done

A feature or module is **DONE** when every item below is satisfied without exception:

- [ ] Unit and integration tests written, covering all business logic branches
- [ ] E2E Playwright test covers the complete user-facing flow (where applicable)
- [ ] API endpoint documented in this TRD or a versioned addendum
- [ ] Zod validation schema written for all request bodies
- [ ] RLS policies written and verified with test queries for all new tables
- [ ] Plan limit enforcement tested with Free-tier edge case (e.g. 4th project blocked)
- [ ] All error states return correct HTTP status code and structured error body
- [ ] Sentry error tracking instrumented on all new server-side functions
- [ ] PostHog event fired for every key user action in the feature
- [ ] PR reviewed and approved by at least one other engineer
- [ ] Feature deployed to staging and manually smoke-tested
- [ ] No TypeScript errors (`tsc --noEmit` passes in CI)
- [ ] No ESLint errors or warnings introduced