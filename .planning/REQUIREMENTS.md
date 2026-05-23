# Requirements: Scaffold

**Defined:** 2026-05-23
**Core Value:** A curated library of 120+ code templates, configs, and legal documents that any developer can copy in one click — the fastest way to demonstrate value on day one before deeper features earn trust.

## v1 Requirements

### Authentication & Onboarding

- [ ] **AUTH-01**: User can sign up and log in with GitHub OAuth (no password creation)
- [ ] **AUTH-02**: User can sign up and log in with Google OAuth
- [ ] **AUTH-03**: New user completes 3-step onboarding: project type → stack builder → ready screen
- [ ] **AUTH-04**: User session persists across browser refresh (Supabase JWT + refresh token)
- [ ] **AUTH-05**: User can generate a CLI API token (shown plaintext once, stored as SHA-256 hash)
- [ ] **AUTH-06**: User can revoke CLI API tokens from dashboard

### Stack Management

- [ ] **STACK-01**: User can create a named stack with categorized tool picker (searchable, chip selection)
- [ ] **STACK-02**: User can import stack from package.json / requirements.txt / Gemfile (auto-detection)
- [ ] **STACK-03**: User can edit and delete saved stacks
- [ ] **STACK-04**: Stack detail shows compatible template count linking to filtered template browse
- [ ] **STACK-05**: User can see all their stacks listed sorted by updated_at DESC
- [ ] **STACK-06**: Team admin/owner can lock team stack to prevent member edits

### Playbooks

- [ ] **PLAY-01**: User can browse 5 built-in playbooks (New SaaS MVP, Production Deploy, New Feature Launch, Client MVP, Startup Launch)
- [ ] **PLAY-02**: User can start a playbook run with project name and optional stack selection
- [ ] **PLAY-03**: User can check/uncheck steps in an active playbook run with progress bar
- [ ] **PLAY-04**: User can fork a built-in playbook to create an owned personal version
- [ ] **PLAY-05**: Steps matching the attached stack's tools are auto-completed with "Handled by [tool]" label
- [ ] **PLAY-06**: User can add custom steps to a forked/personal playbook
- [ ] **PLAY-07**: User can set a due date on a playbook run
- [ ] **PLAY-08**: User can share a playbook via public read-only link (no auth required to view)
- [ ] **PLAY-09**: Team admin can publish a playbook to the team shared library (Team+ plan)

### Template Library

- [ ] **TMPL-01**: User can browse 120+ templates filtered by category (12 categories: Auth, Payments, Email, CI/CD, Monitoring, Legal, Database, API, Frontend, DevOps, Analytics, Documentation)
- [ ] **TMPL-02**: User can search templates by keyword (title + tags)
- [ ] **TMPL-03**: User can copy any template to clipboard with one click
- [ ] **TMPL-04**: User can filter templates by compatibility with their saved stack
- [ ] **TMPL-05**: Stale templates display a staleness warning badge when their dependency has a major version release
- [ ] **TMPL-06**: Solo+ user can create and save custom templates to personal library
- [ ] **TMPL-07**: User can tag custom templates with stack compatibility and category labels
- [ ] **TMPL-08**: Paid user receives in-app notification when a copied template's dependency has a major release

### Template Content

- [ ] **CONT-01**: 120+ templates seeded across all 12 categories (AI-generated + human reviewed)
- [ ] **CONT-02**: Each template has: title, category, tags[], stack_compat[], content (plain text), version, is_public=true
- [ ] **CONT-03**: Built-in templates have staleness tracking (is_stale flag, weekly cron via Inngest)

### Project Init

- [ ] **INIT-01**: User can select a saved stack and project name, then trigger async scaffold generation
- [ ] **INIT-02**: Generated scaffold includes pre-filled .env.example (all env vars for stack tools, grouped by tool)
- [ ] **INIT-03**: User can download the generated scaffold as a ZIP file (48h presigned URL)
- [ ] **INIT-04**: Generated README includes project name, stack details, and Scaffold attribution footer
- [ ] **INIT-05**: User can poll generation status; progress shown in UI while Inngest job runs

### Decision Log

- [ ] **DECL-01**: Solo+ user can create a decision entry (title, context, chosen option, alternatives, rationale, date)
- [ ] **DECL-02**: User can search their decision log by keyword (full-text via pg_trgm)
- [ ] **DECL-03**: Team member can view the team's shared decision log (Team+ plan)
- [ ] **DECL-04**: User can link a decision entry to a specific saved stack

### Team Library

- [ ] **TEAM-01**: Team+ user can create a team and become owner
- [ ] **TEAM-02**: Team admin can invite members by email (Resend invitation with accept link, 7-day expiry)
- [ ] **TEAM-03**: New team member gets immediate access to team stacks, templates, and playbooks on day one
- [ ] **TEAM-04**: Team admin can manage member roles (promote/demote, remove)
- [ ] **TEAM-05**: Studio plan supports unlimited team members; Team plan enforces max 8 seat limit
- [ ] **TEAM-06**: Team can connect Slack for playbook completion and staleness notifications

### Billing & Plan Enforcement

- [ ] **BILL-01**: User can view plan comparison and upgrade from within the app (Stripe Checkout)
- [ ] **BILL-02**: Free tier plan limits show inline upgrade prompts (3/3 projects used, locked features)
- [ ] **BILL-03**: User can manage billing, cancel, and view invoices via Stripe Billing Portal
- [ ] **BILL-04**: User can switch between monthly and annual billing (17% annual discount)
- [ ] **BILL-05**: Plan upgrade takes effect immediately upon Stripe webhook receipt
- [ ] **BILL-06**: On plan downgrade/cancellation, user reverts to Free; all data preserved
- [ ] **BILL-07**: Plan limits enforced server-side only (never trust client-sent plan claims)
- [ ] **BILL-08**: Stripe webhook events are idempotent (stripe_events table check before processing)

### Operations & Quality

- [ ] **OPS-01**: All API routes wrapped in Sentry for automatic error capture and performance tracing
- [ ] **OPS-02**: Every key user action fires a PostHog analytics event
- [ ] **OPS-03**: Rate limiting enforced at Edge: 100 req/min (Free), 500 req/min (paid) via Upstash Redis
- [ ] **OPS-04**: Playwright E2E tests cover: signup → create stack → start playbook → complete step → upgrade plan
- [ ] **OPS-05**: Vitest unit tests cover: manifest detection, plan limit enforcement, ZIP assembly logic
- [ ] **OPS-06**: RLS policies tested per table (user cannot read another user's data)
- [ ] **OPS-07**: CI pipeline: lint → typecheck → vitest → next build on every PR

## v2 Requirements

### CLI

- **CLI-01**: scaffold-cli npm package with `init`, `stack`, `template`, `auth` commands
- **CLI-02**: `scaffold init --stack <name> --name <project>` downloads and extracts ZIP locally
- **CLI-03**: `scaffold auth login` opens browser OAuth flow, stores token in ~/.scaffold/config.json

### AI Features

- **AI-01**: AI-generated stack recommendations based on user's project type and history
- **AI-02**: AI suggests missing playbook steps based on project description

### Advanced

- **ADV-01**: Native IDE plugin (VS Code, JetBrains) for init workflow
- **ADV-02**: GitHub/GitLab auto-repo creation from scaffold output
- **ADV-03**: White-label playbooks (Studio custom domain)
- **ADV-04**: Usage analytics dashboard (Studio plan)

## Out of Scope

| Feature | Reason |
|---------|--------|
| scaffold-cli v1 | Post-launch — web app validates core value first |
| Mobile apps (iOS/Android) | Responsive web sufficient for v1 |
| Community template marketplace | Moderation overhead; trust issues with 3rd-party content |
| Real-time collaborative playbook editing | WebSocket complexity; not core to v1 value |
| Zapier/n8n integrations | Studio API access covers power users in v2 |
| SSO (enterprise) | Studio plan feature, post-revenue validation |
| Password-based auth | OAuth-only by design; reduces attack surface |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 — Auth & Onboarding | Pending |
| AUTH-02 | Phase 2 — Auth & Onboarding | Pending |
| AUTH-03 | Phase 2 — Auth & Onboarding | Pending |
| AUTH-04 | Phase 2 — Auth & Onboarding | Pending |
| AUTH-05 | Phase 2 — Auth & Onboarding | Pending |
| AUTH-06 | Phase 2 — Auth & Onboarding | Pending |
| STACK-01 | Phase 3 — Stack Module | Pending |
| STACK-02 | Phase 3 — Stack Module | Pending |
| STACK-03 | Phase 3 — Stack Module | Pending |
| STACK-04 | Phase 3 — Stack Module | Pending |
| STACK-05 | Phase 3 — Stack Module | Pending |
| STACK-06 | Phase 3 — Stack Module | Pending |
| PLAY-01 | Phase 4 — Playbook System | Pending |
| PLAY-02 | Phase 4 — Playbook System | Pending |
| PLAY-03 | Phase 4 — Playbook System | Pending |
| PLAY-04 | Phase 4 — Playbook System | Pending |
| PLAY-05 | Phase 4 — Playbook System | Pending |
| PLAY-06 | Phase 4 — Playbook System | Pending |
| PLAY-07 | Phase 4 — Playbook System | Pending |
| PLAY-08 | Phase 4 — Playbook System | Pending |
| PLAY-09 | Phase 4 — Playbook System | Pending |
| TMPL-01 | Phase 5 — Template Library UI | Pending |
| TMPL-02 | Phase 5 — Template Library UI | Pending |
| TMPL-03 | Phase 5 — Template Library UI | Pending |
| TMPL-04 | Phase 5 — Template Library UI | Pending |
| TMPL-05 | Phase 5 — Template Library UI | Pending |
| TMPL-06 | Phase 5 — Template Library UI | Pending |
| TMPL-07 | Phase 5 — Template Library UI | Pending |
| TMPL-08 | Phase 5 — Template Library UI | Pending |
| CONT-01 | Phase 6 — Template Content | Pending |
| CONT-02 | Phase 6 — Template Content | Pending |
| CONT-03 | Phase 6 — Template Content | Pending |
| INIT-01 | Phase 7 — Project Init | Pending |
| INIT-02 | Phase 7 — Project Init | Pending |
| INIT-03 | Phase 7 — Project Init | Pending |
| INIT-04 | Phase 7 — Project Init | Pending |
| INIT-05 | Phase 7 — Project Init | Pending |
| DECL-01 | Phase 8 — Decision Log | Pending |
| DECL-02 | Phase 8 — Decision Log | Pending |
| DECL-03 | Phase 8 — Decision Log | Pending |
| DECL-04 | Phase 8 — Decision Log | Pending |
| TEAM-01 | Phase 9 — Team Library | Pending |
| TEAM-02 | Phase 9 — Team Library | Pending |
| TEAM-03 | Phase 9 — Team Library | Pending |
| TEAM-04 | Phase 9 — Team Library | Pending |
| TEAM-05 | Phase 9 — Team Library | Pending |
| TEAM-06 | Phase 9 — Team Library | Pending |
| BILL-01 | Phase 10 — Billing & Plan Enforcement | Pending |
| BILL-02 | Phase 10 — Billing & Plan Enforcement | Pending |
| BILL-03 | Phase 10 — Billing & Plan Enforcement | Pending |
| BILL-04 | Phase 10 — Billing & Plan Enforcement | Pending |
| BILL-05 | Phase 10 — Billing & Plan Enforcement | Pending |
| BILL-06 | Phase 10 — Billing & Plan Enforcement | Pending |
| BILL-07 | Phase 10 — Billing & Plan Enforcement | Pending |
| BILL-08 | Phase 10 — Billing & Plan Enforcement | Pending |
| OPS-01 | Phase 11 — Observability & Quality | Pending |
| OPS-02 | Phase 11 — Observability & Quality | Pending |
| OPS-03 | Phase 11 — Observability & Quality | Pending |
| OPS-04 | Phase 11 — Observability & Quality | Pending |
| OPS-05 | Phase 11 — Observability & Quality | Pending |
| OPS-06 | Phase 11 — Observability & Quality | Pending |
| OPS-07 | Phase 1 — Foundation | Pending |

**Coverage:**
- v1 requirements: 62 total
- Mapped to phases: 62
- Unmapped: 0

---
*Requirements defined: 2026-05-23*
*Last updated: 2026-05-23 — traceability populated after roadmap creation*
