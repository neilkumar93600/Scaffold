# Scaffold

## What This Is

Scaffold is a Launch OS for developers, solo founders, and small startups. It eliminates repetitive project setup by persisting your stack, playbooks, templates, and architectural decisions — so every new project starts from your personal best practices instead of zero. The core product is a web app with six interconnected modules: template library, stack memory, playbooks, project init, decision log, and team library.

## Core Value

A curated library of 120+ code templates, configs, and legal documents that any developer can copy in one click — the fastest way to demonstrate value on day one before deeper features (stack memory, playbooks) earn their trust.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] GitHub + Google OAuth sign-in, onboarding flow (3-step stack setup)
- [ ] Stack CRUD: named stacks, tool picker, manifest import (package.json detection)
- [ ] Playbook library: 5 built-in playbooks, fork, run, step-toggle, auto-complete
- [ ] Template library: 120+ curated templates, browse/filter/search/copy, personal library
- [ ] Template content: AI-generated + reviewed, covering all 12 categories
- [ ] Project init: async ZIP generation via Inngest, download, .env.example + README
- [ ] Decision log: CRUD + full-text search (pg_trgm), Solo+ plan gate
- [ ] Team library: invite flow, roles (owner/admin/member), shared library, stack locking
- [ ] Billing: Stripe Free/Solo/Team/Studio tiers, checkout, portal, webhook, plan enforcement
- [ ] Observability: Sentry + PostHog on all routes and key events
- [ ] E2E tests: Playwright covering signup → stack → playbook → upgrade flow

### Out of Scope

- scaffold-cli npm package — post-launch (v1.1); web app ships first
- AI-generated stack recommendations — needs user data first (v1.1)
- Native IDE plugin — CLI covers init workflow (v1.2)
- GitHub/GitLab auto-repo creation — scope creep (v1.2)
- Mobile apps — responsive web sufficient for v1 (v2.0)
- Community template marketplace — moderation overhead (v2.0)
- Real-time collaborative playbook editing — WebSocket complexity (v2.0)

## Context

- Existing setup: Next.js 16 app router scaffolded, all shadcn/ui components installed in `components/ui/`, `hooks/use-mobile.ts`, full documentation in `doc/` (PRD, TRD, FEATURES, ARCHITECTURE, DATABASE, API, etc.)
- No application code exists yet — `app/`, `lib/modules/`, API routes all to be built
- Stack fully locked per TRD: Next.js 16, TypeScript 5, Tailwind CSS 4, Supabase Auth + PostgreSQL 15, Drizzle ORM, Zod, Inngest, Resend + React Email, Stripe, Sentry, PostHog, Upstash Redis, Vercel
- Template content (120+ items) to be AI-generated + reviewed as dedicated build phase
- Builder: solo developer + Claude agents; parallel execution where possible
- Timeline: a few months, quality over speed, full v1 as specced

## Constraints

- **Tech stack**: Fully locked — Next.js 16, Supabase, Drizzle, Stripe, Inngest, Upstash as per TRD. No substitutions.
- **Security**: RLS on all user-facing tables; plan limits always server-side; no client plan trust
- **Migrations**: Additive-only in v1 — no column drops or renames
- **Template content**: Plain text only — never rendered as HTML (XSS prevention)
- **CLI**: Out of scope for v1 — API routes must be REST-compatible for future CLI consumption

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Template library as top-priority module | Immediate copy-paste value on day one; fastest user activation path | — Pending |
| CLI deferred to post-launch | Web app validates core value first; avoids parallel maintenance overhead | — Pending |
| Full 120+ templates at v1 launch | PRD number; AI-generated + reviewed makes this feasible | — Pending |
| Modular monolith over microservices | Reduces operational overhead at early scale; module boundaries ready for extraction | — Pending |
| Supabase RLS as security layer | Enforced at DB layer; never bypassed in application code | — Pending |

---
*Last updated: 2026-05-23 after initialization*
