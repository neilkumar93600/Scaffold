# CLAUDE.md — Scaffold

## Project Overview

**Scaffold** is a Launch OS for developers, solo founders, and small startups. It eliminates repetitive project setup by persisting your stack, playbooks, templates, and architectural decisions — so every new project starts from your personal best practices instead of zero.

**Landing page:** `doc/scaffold-landing.html`
**PRD:** `doc/PRD.md`
**TRD:** `doc/TRD.md`

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, RSC + Client Components) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui (Radix UI primitives) |
| Database | PostgreSQL 15 via Supabase |
| Auth | Supabase Auth (GitHub + Google OAuth) |
| ORM | Drizzle ORM |
| Validation | Zod |
| Background jobs | Inngest |
| Email | Resend + React Email |
| Payments | Stripe Subscriptions |
| Error tracking | Sentry |
| Analytics | PostHog |
| Cache | Upstash Redis |
| Deployment | Vercel |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Project Structure

```
app/                   Next.js App Router pages and layouts
  (auth)/              Auth routes (login, callback)
  (dashboard)/         Protected dashboard routes
  api/v1/              API routes
    auth/              Auth endpoints
    stacks/            Stack CRUD
    templates/         Template library
    playbooks/         Playbook CRUD
    runs/              Playbook run tracking
    init/              Project scaffold generation
    decisions/         Decision log
    teams/             Team management
    billing/           Stripe checkout + portal
    webhooks/stripe/   Stripe webhook handler
components/
  ui/                  shadcn/ui primitives (auto-generated, don't hand-edit)
  [feature]/           Feature-specific components
lib/
  modules/             Bounded domain modules
    auth/              M1 — Identity & Auth
    stacks/            M2 — Stack
    playbooks/         M3 — Playbook
    templates/         M4 — Template
    init/              M5 — Project Init
    decisions/         M6 — Decision Log
  db/                  Drizzle schema + migrations
  validations/         Zod schemas (one per module)
  utils/               Pure helpers
hooks/                 React custom hooks
.claude/               Claude Code configuration
  agents/              Specialized sub-agent prompts
  commands/            Slash command definitions
  hooks/               Shell hooks (pre-commit, lint)
  rules/               Domain coding rules
  skills/              Feature skill definitions
doc/                   Documentation (PRD, TRD, etc.)
```

---

## Commands

```bash
# Development
pnpm dev          # Next.js dev server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server

# Quality
pnpm lint         # ESLint
pnpm format       # Prettier write
pnpm typecheck    # tsc --noEmit

# Database
pnpm db:generate  # drizzle-kit generate (create migration)
pnpm db:push      # drizzle-kit push (apply migration)
pnpm db:studio    # Drizzle Studio GUI

# Testing
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E tests
pnpm test:coverage  # Vitest with coverage
```

---

## Architecture Principles

1. **Modular monolith** — six bounded modules in `lib/modules/`. Modules communicate via exported interfaces only. No cross-module direct DB queries.

2. **Server-first** — use React Server Components by default. Add `'use client'` only when needed for interactivity or browser APIs.

3. **Schema-first validation** — every API request body has a Zod schema in `lib/validations/`. Never trust input without parsing.

4. **RLS is the security layer** — all data access goes through Supabase with Row Level Security. Never bypass RLS in application code.

5. **Plan enforcement server-side** — check `planLimits` config in middleware before every resource-creation endpoint. Never trust client-sent plan claims.

---

## Coding Conventions

### TypeScript
- Strict mode enabled
- No `any` — use `unknown` and narrow
- Prefer `type` over `interface` for shapes; `interface` for extension points
- Zod schemas generate types via `z.infer<>`

### Components
- `components/ui/` — shadcn primitives, never manually edited
- Feature components in `components/[feature]/`
- Server components fetch their own data; no prop-drilling of server data
- Client components handle state and interactivity only

### API Routes
- File: `app/api/v1/[resource]/route.ts`
- Parse body with Zod schema first
- Check plan limits before writes
- Return typed responses with correct HTTP status codes
- Instrument with Sentry and PostHog

### Database
- ORM: Drizzle — no raw SQL except for complex pg_trgm queries
- Migrations: additive-only in v1 (no drops, no renames)
- Every write checks RLS policies hold in tests

### Error handling
- API errors: `{ error: string, code: string }` shape
- Plan limit errors: HTTP 402 `{ code: 'PLAN_LIMIT', resource, current, max }`
- Server errors: logged to Sentry, generic 500 to client

---

## Agent Configuration

This project uses Claude sub-agents defined in `.claude/agents/`. Each agent has a specific role:

| Agent | Role |
|---|---|
| `code-reviewer` | Review PRs for correctness, security, conventions |
| `debugger` | Diagnose bugs systematically using scientific method |
| `test-writer` | Write unit, integration, and E2E tests |
| `refactorer` | Improve code structure without changing behaviour |
| `doc-writer` | Write and maintain technical documentation |
| `security-auditor` | Audit code for vulnerabilities and policy violations |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Stripe Price IDs
STRIPE_SOLO_MONTHLY_PRICE_ID=
STRIPE_SOLO_ANNUAL_PRICE_ID=
STRIPE_TEAM_MONTHLY_PRICE_ID=
STRIPE_TEAM_ANNUAL_PRICE_ID=
STRIPE_STUDIO_MONTHLY_PRICE_ID=
STRIPE_STUDIO_ANNUAL_PRICE_ID=

# Resend
RESEND_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Key Business Rules

- **Free plan:** max 3 projects, 15 templates, no decision log, no team
- **Plan enforcement is always server-side** — middleware layer, not client
- **Template content** is plain text only — never render as HTML
- **ZIPs** have 48-hour presigned URLs via Supabase Storage
- **Stripe events** must be idempotent — check `stripe_events` table before processing
- **Stacks** cannot be deleted if they have active playbook runs
- **Team stacks** can be locked by admin/owner to prevent member edits
- **CLI tokens** stored as SHA-256 hash — shown plaintext once, revocable