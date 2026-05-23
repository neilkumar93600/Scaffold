# Roadmap: Scaffold v1.0

## Overview

Scaffold is built from the ground up in 11 phases. The dependency chain flows from foundation through auth and core modules, then to the product's day-one value driver (template library + content), then async infrastructure (project init), then gated features (decision log, team library), and finally billing enforcement, observability, and E2E quality gates. Each phase delivers a coherent, independently verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Database schema, Drizzle setup, Supabase project, CI/CD pipeline, plan limits config
- [ ] **Phase 2: Auth & Onboarding** - GitHub + Google OAuth, 3-step onboarding, session persistence, CLI tokens
- [ ] **Phase 3: Stack Module** - Stack CRUD, tool picker, manifest import, stack detail view
- [ ] **Phase 4: Playbook System** - Built-in playbooks, run/step-toggle, fork, custom steps, sharing
- [ ] **Phase 5: Template Library UI** - Browse, filter, search, copy, personal library, staleness badge
- [ ] **Phase 6: Template Content** - 120+ templates seeded across all 12 categories, staleness cron
- [ ] **Phase 7: Project Init** - Inngest async ZIP generation, .env.example, README, download, polling
- [ ] **Phase 8: Decision Log** - CRUD, full-text search, stack linking, plan gate
- [ ] **Phase 9: Team Library** - Team CRUD, invite flow, roles, shared library, stack locking, Slack
- [ ] **Phase 10: Billing & Plan Enforcement** - Stripe checkout, portal, webhooks, plan enforcement, upgrade prompts
- [ ] **Phase 11: Observability & Quality** - Sentry, PostHog, rate limiting, Playwright E2E, Vitest, RLS tests, CI

## Phase Details

### Phase 1: Foundation
**Goal**: A deployable, tested project skeleton exists with all infrastructure wired and plan limits enforced at configuration level
**Depends on**: Nothing (first phase)
**Requirements**: OPS-07
**Success Criteria** (what must be TRUE):
  1. `pnpm dev` starts without errors and the app loads a placeholder page
  2. `pnpm build` completes successfully and CI pipeline runs lint, typecheck, and build on push
  3. Drizzle schema compiles and `pnpm db:push` applies migrations to Supabase without errors
  4. planLimits config exists and exports correct per-plan resource caps (Free: 3 projects, 15 templates)
  5. All environment variable slots are documented in `.env.example` with placeholder values
**Plans**: 5 plans

Plans:
- [ ] 01-01-PLAN.md — Package installs, Drizzle + Vitest config, branded placeholder page, route stubs, /api/health, Inngest handler, .env.example
- [ ] 01-02-PLAN.md — All 11 domain table schema files (users, teams, stacks, templates, playbooks, runs, decisions), barrel index, db singleton
- [x] 01-03-PLAN.md — planLimits static config, enforcePlanLimit function, PlanSchema Zod type, checkFeatureAccess helper
- [ ] 01-04-PLAN.md — GitHub Actions CI workflow: lint → typecheck → vitest → next build (OPS-07)
- [ ] 01-05-PLAN.md — Sentry (server + edge + client), PostHog (client + server), Resend, withSentryConfig in next.config.mjs

### Phase 2: Auth & Onboarding
**Goal**: Users can sign in with GitHub or Google, complete onboarding, and stay logged in across sessions
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can click "Sign in with GitHub" and land on the dashboard after OAuth completes
  2. User can click "Sign in with Google" and land on the dashboard after OAuth completes
  3. New user who has never signed in is routed through the 3-step onboarding flow before reaching the dashboard
  4. User remains logged in after closing and reopening the browser (session persists via JWT + refresh token)
  5. User can generate a CLI API token from the dashboard; the raw token is shown once and never again
  6. User can see their list of CLI tokens and revoke any token; revoked token is immediately invalid
**Plans**: TBD

Plans:
- [ ] 02-01: Supabase Auth config — GitHub + Google OAuth providers, callback route, session middleware
- [ ] 02-02: Auth module (M1) — requireAuth helper, auth.ts module, user row sync on first login
- [ ] 02-03: Onboarding flow — 3-step UI (project type → stack builder → ready), onboarding_complete flag
- [ ] 02-04: CLI token management — token generation, SHA-256 storage, list + revoke API + UI
- [ ] 02-05: Auth UI — login page, callback page, protected route middleware, redirect logic

### Phase 3: Stack Module
**Goal**: Users can create, import, browse, and manage their named stacks, and see which templates are compatible with each stack
**Depends on**: Phase 2
**Requirements**: STACK-01, STACK-02, STACK-03, STACK-04, STACK-05, STACK-06
**Success Criteria** (what must be TRUE):
  1. User can create a named stack by picking tools from a searchable, categorized chip picker and save it
  2. User can upload or paste a package.json (or requirements.txt, Gemfile) and have the stack auto-populated from detected tools
  3. User can edit a stack's name and tools, or delete a stack they own
  4. User can see all their stacks listed, sorted by most recently updated
  5. Clicking a stack shows its detail view with a count of compatible templates that links to the filtered template browse page
  6. A team admin/owner can lock a team stack so members cannot edit it (lock icon visible, edit blocked)
**Plans**: TBD

Plans:
- [ ] 03-01: Stack module (M2) — createStack, updateStack, deleteStack, listStacks, getStack functions
- [ ] 03-02: Stack API routes — GET/POST /api/v1/stacks, GET/PATCH/DELETE /api/v1/stacks/[id]
- [ ] 03-03: Manifest detection — POST /api/v1/stacks/detect, parser for package.json/requirements.txt/Gemfile
- [ ] 03-04: Stack UI — stack list page, stack detail page, create/edit form, tool picker component
- [ ] 03-05: Stack locking — lock/unlock endpoint, team-admin gate, locked state in UI

### Phase 4: Playbook System
**Goal**: Users can browse built-in playbooks, run them with step tracking, fork and customize them, and share them publicly
**Depends on**: Phase 3
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, PLAY-07, PLAY-08, PLAY-09
**Success Criteria** (what must be TRUE):
  1. User can see all 5 built-in playbooks listed and open any one to view its steps
  2. User can start a run of a playbook by providing a project name and optionally selecting a stack, and steps auto-complete for tools present in that stack
  3. User can check and uncheck steps in an active run, and a progress bar updates in real time to reflect completion
  4. User can fork a built-in playbook to create a personal copy, then add custom steps to it
  5. User can set a due date on a run, visible on the run detail page
  6. User can generate a public read-only share link for a playbook; a visitor with the link can view it without signing in
  7. Team admin on Team+ plan can publish a personal playbook to the team's shared library
**Plans**: TBD

Plans:
- [ ] 04-01: Playbook module (M3) — playbook schema, built-in seed data (5 playbooks), fork logic
- [ ] 04-02: Playbook run logic — createRun, updateStep, autoComplete logic vs stack tools, progress calculation
- [ ] 04-03: Playbook API routes — CRUD for playbooks + runs + steps, fork endpoint, share endpoint
- [ ] 04-04: Playbook browse + run UI — list page, run detail page, step checklist, progress bar, due date picker
- [ ] 04-05: Playbook custom steps + team publish — add-step UI, team publish gate (Team+ plan check)

### Phase 5: Template Library UI
**Goal**: Users can discover, filter, search, copy, and personally save templates; stale templates are visually flagged
**Depends on**: Phase 3
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, TMPL-08
**Success Criteria** (what must be TRUE):
  1. User can browse templates organized by 12 categories and filter to show only one category at a time
  2. User can type a keyword into search and see matching templates by title or tag in real time (or on submit)
  3. User can filter templates by stack compatibility — selecting a saved stack shows only templates tagged for its tools
  4. User can click "Copy" on any template and the content is copied to clipboard in one action
  5. A template with an outdated dependency shows a visible staleness badge on its card
  6. Solo+ user can create a custom template with title, category, tags, stack compatibility labels, and plain-text content, and it appears in their personal library
  7. Paid user receives an in-app notification when a template they previously copied has a dependency major release
**Plans**: TBD

Plans:
- [ ] 05-01: Template module (M4) — template schema, personal template CRUD, copy tracking, notification logic
- [ ] 05-02: Template API routes — GET/POST /api/v1/templates, [id] CRUD, copy endpoint
- [ ] 05-03: Template browse UI — grid layout, category filter tabs, keyword search, stack-compat filter
- [ ] 05-04: Template card + copy — card component, one-click copy, staleness badge, plan-gate for create
- [ ] 05-05: Personal library + notifications — personal library view, notification list, in-app notification delivery

### Phase 6: Template Content
**Goal**: All 120+ templates exist in the database, are reviewed for correctness, and the staleness cron is running
**Depends on**: Phase 5
**Requirements**: CONT-01, CONT-02, CONT-03
**Success Criteria** (what must be TRUE):
  1. The template browse page shows at least 10 templates in each of the 12 categories (120+ total)
  2. Every seeded template has: title, category, at least one tag, stack_compat array, plain-text content, and version
  3. All seeded templates have is_public=true and appear to unauthenticated users browsing the library
  4. The staleness cron (Inngest weekly job) runs without error and correctly sets is_stale=true on templates whose dependency has a newer major version
**Plans**: TBD

Plans:
- [ ] 06-01: Template content creation — AI-generate + review 120+ templates across all 12 categories
- [ ] 06-02: Seed script + migration — seed.ts populates templates table; idempotent re-run safe
- [ ] 06-03: Staleness cron — Inngest weekly job, version check logic, is_stale flag update

### Phase 7: Project Init
**Goal**: Users can generate a scaffold ZIP for any saved stack, download it, and track generation progress in the UI
**Depends on**: Phase 3
**Requirements**: INIT-01, INIT-02, INIT-03, INIT-04, INIT-05
**Success Criteria** (what must be TRUE):
  1. User can select a stack and project name, click "Generate", and see the job move from "queued" to "complete" in the UI without a page refresh
  2. The generated ZIP contains a .env.example file with all environment variable keys grouped by tool for the selected stack, with placeholder values
  3. The generated ZIP contains a README.md with the project name, stack list, and a Scaffold attribution footer
  4. User can click "Download ZIP" on a completed job and receive a file download (48-hour presigned URL)
  5. If the user navigates away and returns, the job status is still visible and the download link is still valid within 48 hours
**Plans**: TBD

Plans:
- [ ] 07-01: Init module (M5) — ZIP assembly logic, .env.example generator, README generator
- [ ] 07-02: Inngest job — scaffold-generate event, job handler, status updates, Supabase Storage upload
- [ ] 07-03: Init API routes — POST /api/v1/init (trigger job), GET /api/v1/init/[jobId] (poll status)
- [ ] 07-04: Init UI — project init form, job status polling component, download button

### Phase 8: Decision Log
**Goal**: Solo+ users can maintain a searchable decision log linked to their stacks; team members can view the team's shared log
**Depends on**: Phase 3
**Requirements**: DECL-01, DECL-02, DECL-03, DECL-04
**Success Criteria** (what must be TRUE):
  1. A Solo+ user can create a decision entry with all fields (title, context, chosen option, alternatives, rationale, date) and see it in their log
  2. Free user who attempts to access the decision log sees an upgrade prompt instead of the log
  3. User can type a keyword into search and see matching decisions returned via full-text search (pg_trgm)
  4. User can link a decision entry to one of their saved stacks, and the link is visible on both the decision entry and the stack detail page
  5. A team member on Team+ plan can view the team's shared decision log entries from all team members
**Plans**: TBD

Plans:
- [ ] 08-01: Decision module (M6) — decision schema, CRUD, pg_trgm full-text search, stack link
- [ ] 08-02: Decision API routes — GET/POST /api/v1/decisions, [id] CRUD, plan gate (Solo+ check)
- [ ] 08-03: Decision log UI — list + search page, create/edit form, stack link picker, plan-gate prompt

### Phase 9: Team Library
**Goal**: Team+ users can create a team, invite members, manage roles, and access a shared stack/template/playbook library with optional Slack notifications
**Depends on**: Phase 4
**Requirements**: TEAM-01, TEAM-02, TEAM-03, TEAM-04, TEAM-05, TEAM-06
**Success Criteria** (what must be TRUE):
  1. A Team+ user can create a new team and automatically become its owner
  2. A team admin can invite a new member by email; the invitee receives an email with an accept link valid for 7 days
  3. A newly accepted member immediately sees the team's stacks, templates, and playbooks without any extra configuration step
  4. A team admin can promote a member to admin, demote an admin to member, and remove a member from the team
  5. A Studio plan team has no member cap; a Team plan team enforces a maximum of 8 seats and shows an error if exceeded
  6. Team admin can connect a Slack workspace; the team receives a Slack message when a playbook run completes and when a template goes stale
**Plans**: TBD

Plans:
- [ ] 09-01: Team module — team schema, createTeam, member CRUD, role logic, seat limit enforcement
- [ ] 09-02: Team invite flow — invite by email, Resend email template, accept link, 7-day expiry, token validation
- [ ] 09-03: Team API routes — /api/v1/teams CRUD, invites, members/[userId] role management
- [ ] 09-04: Team UI — create team page, member management page, invite form, role badges
- [ ] 09-05: Slack integration — Slack OAuth connect, webhook delivery for playbook complete + staleness events

### Phase 10: Billing & Plan Enforcement
**Goal**: Users can upgrade, downgrade, and manage their Stripe subscription; plan limits are enforced server-side across all resource creation endpoints
**Depends on**: Phase 1
**Requirements**: BILL-01, BILL-02, BILL-03, BILL-04, BILL-05, BILL-06, BILL-07, BILL-08
**Success Criteria** (what must be TRUE):
  1. A Free user can view a plan comparison page and click "Upgrade" to complete a Stripe Checkout session and land back in the app on the paid plan
  2. A Free user who has used all 3 project slots sees an inline upgrade prompt when trying to create a fourth project, not a generic error
  3. A paid user can open the Stripe Billing Portal from their account settings to view invoices, change payment method, or cancel
  4. A user can switch between monthly and annual billing from the plan comparison page; annual shows the 17% discount
  5. When a Stripe webhook fires for a successful payment, the user's plan is upgraded immediately — no manual action required
  6. When a subscription is cancelled or lapses, the user's plan reverts to Free and all their data is preserved
  7. The stripe_events table prevents any Stripe webhook event from being processed more than once
**Plans**: TBD

Plans:
- [ ] 10-01: Stripe product/price setup — products for Free/Solo/Team/Studio, monthly + annual price IDs
- [ ] 10-02: Billing API routes — checkout session, billing portal, webhook handler with idempotency check
- [ ] 10-03: Plan enforcement middleware — enforcePlanLimit wired to all resource-creation routes
- [ ] 10-04: Billing UI — plan comparison page, upgrade prompts (inline + modal), billing settings page
- [ ] 10-05: Downgrade + data preservation — subscription lapse handler, plan revert logic, data retention verification

### Phase 11: Observability & Quality
**Goal**: All API routes have error tracking and analytics; rate limiting is enforced; the E2E test suite and CI pipeline are green
**Depends on**: Phase 10
**Requirements**: OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06
**Success Criteria** (what must be TRUE):
  1. Every API route is wrapped in withSentry; any unhandled error appears in the Sentry dashboard with a trace
  2. Every key user action (stack created, playbook started, template copied, plan upgraded) fires a PostHog event visible in the PostHog dashboard
  3. A Free user making more than 100 requests per minute receives a 429 response; a paid user's limit is 500 req/min
  4. The Playwright E2E suite passes end-to-end: sign up → create stack → start playbook → complete step → upgrade plan
  5. Vitest unit tests pass for manifest detection, plan limit enforcement, and ZIP assembly logic
  6. RLS policy tests confirm that a user cannot read, update, or delete another user's stacks, templates, or decisions
**Plans**: TBD

Plans:
- [ ] 11-01: Sentry integration — withSentry wrapper on all route handlers, error boundary for client components
- [ ] 11-02: PostHog instrumentation — captureEvent calls on all key actions across all modules
- [ ] 11-03: Rate limiting — Upstash Redis ratelimit in Edge middleware, per-plan limits, 429 response
- [ ] 11-04: Vitest unit tests — manifest detection, plan limit enforcement, ZIP assembly
- [ ] 11-05: RLS tests — per-table RLS policy tests confirming cross-user data isolation
- [ ] 11-06: Playwright E2E — signup → stack → playbook → step complete → upgrade flow

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/5 | In Progress|  |
| 2. Auth & Onboarding | 0/5 | Not started | - |
| 3. Stack Module | 0/5 | Not started | - |
| 4. Playbook System | 0/5 | Not started | - |
| 5. Template Library UI | 0/5 | Not started | - |
| 6. Template Content | 0/3 | Not started | - |
| 7. Project Init | 0/4 | Not started | - |
| 8. Decision Log | 0/3 | Not started | - |
| 9. Team Library | 0/5 | Not started | - |
| 10. Billing & Plan Enforcement | 0/5 | Not started | - |
| 11. Observability & Quality | 0/6 | Not started | - |
