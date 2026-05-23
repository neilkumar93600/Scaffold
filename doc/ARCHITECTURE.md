# Scaffold — Architecture

> System design, component map, module boundaries, and request flows for v1.0

---

## 1. Architectural Decision: Modular Monolith

**Choice:** Single Next.js deployment with six bounded modules sharing one PostgreSQL database.

**Why not microservices:**
- No operational justification at early scale
- Shared DB transactions needed (e.g., stack creation + plan limit check must be atomic)
- Single deployment = zero inter-service latency, one CI/CD pipeline, one observability surface

**Module extraction path:** Each module (`lib/modules/[name]/`) has a defined public interface. If a module needs independent scaling later, the interface becomes an internal HTTP API with minimal refactor.

---

## 2. Component Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                               │
│                                                                             │
│  Browser                     CLI (scaffold-cli npm package)                │
│  Next.js RSC + Client         → API token stored locally                   │
│  Components                   → Calls /api/v1/* with Bearer token          │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼─────────────────────────────────────────────┐
│  EDGE LAYER (Vercel Edge Runtime)                                           │
│                                                                             │
│  middleware.ts                                                              │
│  ├── JWT validation (Supabase Auth)                                         │
│  ├── Rate limiting (Upstash Redis — 100/min free, 500/min paid)             │
│  └── Plan enforcement shortcut (plan header injection)                      │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│  APPLICATION LAYER (Next.js 16 App Router — Vercel Serverless Functions)   │
│                                                                             │
│  app/                                                                       │
│  ├── (auth)/           Login, callback, OAuth redirect pages               │
│  ├── (dashboard)/      Protected RSC dashboard pages                       │
│  │   ├── stacks/       Stack management UI                                 │
│  │   ├── playbooks/    Playbook browser + run tracker                      │
│  │   ├── templates/    Template library browser                            │
│  │   ├── init/         Project scaffold generator                          │
│  │   ├── decisions/    Decision log                                        │
│  │   └── team/         Team management                                     │
│  └── api/v1/           REST API (same deployment, consumed by web + CLI)   │
│      ├── auth/                                                              │
│      ├── stacks/                                                            │
│      ├── templates/                                                         │
│      ├── playbooks/ + runs/                                                 │
│      ├── init/                                                              │
│      ├── decisions/                                                         │
│      ├── teams/                                                             │
│      ├── billing/                                                           │
│      └── webhooks/stripe/                                                   │
│                                                                             │
│  lib/modules/          Bounded domain modules (pure business logic)        │
│  ├── auth/             M1 — Identity & Auth                                │
│  ├── stacks/           M2 — Stack                                          │
│  ├── playbooks/        M3 — Playbook                                       │
│  ├── templates/        M4 — Template                                       │
│  ├── init/             M5 — Project Init                                   │
│  └── decisions/        M6 — Decision Log                                   │
└──────┬──────────────────────┬───────────────────┬───────────────────────────┘
       │                      │                   │
┌──────▼──────┐  ┌────────────▼──────┐  ┌─────────▼──────────────────────────┐
│  Supabase   │  │  Upstash Redis    │  │  Inngest Workers                   │
│             │  │                   │  │                                    │
│  PostgreSQL │  │  Rate limit keys  │  │  generate-scaffold                 │
│  Auth       │  │  Template cache   │  │  template-staleness-check          │
│  Storage    │  │  (5min TTL)       │  │  send-stale-notifications          │
└─────────────┘  └───────────────────┘  └──────────┬─────────────────────────┘
                                                    │
                                         ┌──────────▼──────────┐
                                         │  External Services  │
                                         │  Resend (email)     │
                                         │  Stripe (billing)   │
                                         │  npm/PyPI registry  │
                                         └─────────────────────┘
```

---

## 3. Module Architecture

### Module Contract

Every module exports:
```ts
// lib/modules/[name]/index.ts
export type { StackId, Stack, CreateStackInput }  // domain types
export { createStack, getStack, updateStack }      // public interface
// NO database access exported — only domain functions
```

Modules **do not** import from other modules directly. Cross-module data needs go through the API layer or shared service.

### M1 — Identity & Auth
```
Responsibility: User identity, sessions, OAuth, team membership
Owns tables:    users, teams, team_members
Interface:      getUser(req), getTeam(teamId), inviteMember(), updateRole()
Does NOT own:   Any resource beyond identity
```

### M2 — Stack
```
Responsibility: Named stacks of tool preferences + manifest detection
Owns tables:    stacks
Interface:      createStack(), getStack(), updateStack(), listStacks(), detectFromManifest()
Reads:          users (for plan check), teams (for team stacks)
Does NOT own:   Playbooks, templates — those reference stack by ID only
```

### M3 — Playbook
```
Responsibility: Playbook templates, run instances, step state
Owns tables:    playbooks, playbook_runs
Interface:      createPlaybook(), forkPlaybook(), startRun(), toggleStep(), getRunProgress()
Reads:          stacks (for auto-complete logic)
Does NOT own:   Templates, decisions
```

### M4 — Template
```
Responsibility: Template library (built-in + user-created), staleness
Owns tables:    templates
Interface:      getTemplate(), listTemplates(), createTemplate(), copyToClipboard()
Reads:          users (for plan check), teams (for team templates)
Does NOT own:   Playbooks, stacks
```

### M5 — Project Init
```
Responsibility: Scaffold generation from stack → ZIP output
Owns tables:    (none — uses Supabase Storage)
Interface:      generateScaffold(stackId, meta) → jobId
Reads:          stacks, templates (for fragment assembly)
Does NOT own:   Any persistent data — output is ephemeral (48h TTL)
```

### M6 — Decision Log
```
Responsibility: Searchable structured log of architectural decisions
Owns tables:    decisions
Interface:      createDecision(), searchDecisions(query), getTeamDecisions()
Reads:          stacks (for linking decisions to stacks)
Does NOT own:   Stacks, templates
```

---

## 4. Request Flows

### 4.1 Authenticated API Request

```
1. Client sends:
   POST /api/v1/stacks
   Authorization: Bearer <jwt>
   { name: "My Stack", tools: [...] }

2. Vercel Edge middleware:
   a. Validate JWT via Supabase Auth
   b. Check rate limit via Upstash Redis (key: userId)
   c. Inject user.plan into request context
   d. If rate limit exceeded → 429

3. Next.js API Route handler:
   a. Parse + validate request body with Zod schema
   b. If invalid → 400 VALIDATION_ERROR
   c. Check plan limits: planLimits[user.plan].stacks
   d. If at limit → 402 PLAN_LIMIT
   e. Call createStack() from lib/modules/stacks
   f. Fire PostHog event: 'stack_created'
   g. Return 201 + created stack JSON
```

### 4.2 Background Job — ZIP Generation

```
1. Client: POST /api/v1/init → { stackId, projectName }
2. API route:
   a. Validates auth + body
   b. Enqueues Inngest event: 'scaffold/generate' { stackId, projectName, userId }
   c. Returns 202 { jobId }

3. Inngest worker (async):
   a. Loads stack from DB (tools array)
   b. For each tool in stack: loads matching template fragments
   c. Assembles file tree in memory (sandboxed path whitelist)
   d. Generates ZIP buffer
   e. Uploads to Supabase Storage: {userId}/{projectId}/scaffold.zip
   f. Creates presigned URL (48h TTL)
   g. Updates job status: complete + downloadUrl

4. Client polls: GET /api/v1/init/{jobId}
   a. While status=pending → 200 { status: 'pending' }
   b. When complete → 200 { status: 'complete', downloadUrl }
```

### 4.3 Stripe Webhook Flow

```
1. Stripe → POST /api/v1/webhooks/stripe
   Headers: stripe-signature: t=...,v1=...
   Body: raw event JSON

2. Route handler:
   a. Read raw body (not parsed JSON — required for signature)
   b. stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)
   c. If signature invalid → 400

3. Idempotency check:
   a. SELECT FROM stripe_events WHERE id = event.id
   b. If exists → 200 (already processed)

4. Transaction:
   BEGIN
   a. Process event by type:
      - checkout.session.completed → update user.plan + stripe_customer_id
      - customer.subscription.updated → update user.plan + plan_expires_at
      - customer.subscription.deleted → revert user.plan = 'free'
      - invoice.payment_failed → flag user + send dunning email via Resend
   b. INSERT INTO stripe_events (id, type, processed=true)
   COMMIT

5. Return 200 { received: true }
```

### 4.4 Team Invite Flow

```
1. Admin: POST /api/v1/teams/{teamId}/invites { email }
2. API route:
   a. Verifies admin role in team_members
   b. Checks team max_members limit
   c. Creates pending invite record
   d. Enqueues Inngest event: 'team/invite-sent'
3. Inngest:
   a. Sends Resend email with invite link
   b. Invite link contains team context (pre-fills onboarding)
4. Invitee signs up → team_members row created → onboarding shows team library
```

---

## 5. Data Flow Diagram

```
User Action → API Route → Module → Supabase DB
                │                      │
                ├── Zod validate        ├── RLS enforced
                ├── Plan limit check    ├── Indexed queries
                ├── PostHog event       └── Triggers (updated_at)
                └── Sentry trace

Background:
Inngest ─────→ Module ─────→ Supabase Storage (ZIPs)
                │
                └──────→ Resend (emails)
                └──────→ npm registry (staleness checks)
```

---

## 6. Deployment Architecture

```
GitHub (main branch)
  │
  └── GitHub Actions CI
      ├── lint + typecheck + test
      └── next build
            │
            ├── PR → Vercel Preview (auto)
            ├── merge to main → Vercel Staging (auto)
            └── manual promote → Vercel Production
                                      │
                            ┌─────────┴──────────┐
                            │  Supabase (Prod)   │
                            │  Upstash (Prod)    │
                            │  Inngest (Prod)    │
                            └────────────────────┘
```

---

## 7. Technology Rationale Summary

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Deployment model | Modular monolith | Microservices | No operational justification at v1 scale |
| Database | PostgreSQL/Supabase | MongoDB, PlanetScale | Relational model fits bounded domains; RLS built-in |
| Auth | Supabase Auth | Auth0, Clerk | Tight Supabase integration; JWT matches RLS `auth.uid()` |
| Background jobs | Inngest | BullMQ, Temporal | Serverless-native; no Redis worker process needed |
| ORM | Drizzle | Prisma | Lightweight; type-safe SQL; no runtime bloat |
| Search | pg_trgm | Elasticsearch, Algolia | Avoids extra service; sufficient for v1 scale |
| Email | Resend | SendGrid, SES | Developer-friendly; React Email templates |
| Cache | Upstash Redis | Redis Cloud, local | Serverless-native; HTTP API; no persistent connection |