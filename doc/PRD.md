# Scaffold — Product Requirements Document
> Stop rebuilding from scratch. Ship smarter, every time.
> Version: 1.0 | Status: Active

---

## Table of Contents
1. [Problem Statement](#1-problem-statement)
2. [Solution](#2-solution)
3. [User Personas](#3-user-personas)
4. [User Stories](#4-user-stories)
5. [Feature Specifications](#5-feature-specifications)
6. [Implementation Decisions](#6-implementation-decisions)
7. [Testing Decisions](#7-testing-decisions)
8. [Out of Scope — v1.0](#8-out-of-scope--v10)
9. [Success Metrics](#9-success-metrics)
10. [Further Notes](#10-further-notes)

---

## 1. Problem Statement

Every developer, solo founder, and small startup team faces the same invisible tax: **the setup loop**. Each new project, feature, or product launch requires rebuilding the exact same foundation from scratch — authentication, payments, email flows, CI/CD pipelines, privacy policies, monitoring, environment configuration, and dozens of other recurring concerns.

This problem is not about skill — experienced engineers repeat this work just as much as beginners. The root cause is that the knowledge, configurations, and decisions made in previous projects live in **disconnected places**: GitHub gists, Notion docs, browser bookmarks, and memory. There is no persistent, structured place where a founder's stack, playbooks, and decisions accumulate over time.

### 1.1 The Cost

| Cost Vector | Detail |
|---|---|
| Time | 4.2 hours lost per new project on average setup tasks (pre-Scaffold baseline) |
| Reliability | Critical launch items (error monitoring, analytics, legal pages) frequently forgotten until a user complaint surfaces them |
| Onboarding | Team onboarding takes days longer than necessary because setup knowledge lives in one person's head |
| Flow | Solo founders context-switch back to "setup mode" dozens of times per project, breaking flow |
| Knowledge loss | No record of why architectural decisions were made — leading to the same debates project after project |

### 1.2 Who Suffers Most

- **Indie hackers and solo founders** shipping multiple products per year
- **Small engineering teams (2–8 people)** starting new features or services
- **Freelancers and micro-agencies** building client MVPs repeatedly
- **First-time founders** who don't yet know what "good setup" looks like

---

## 2. Solution

Scaffold is a **Launch OS** — a single platform that eliminates repetitive setup work by giving developers and founders a persistent, personalized knowledge base of their stack, decisions, and launch playbooks.

Unlike static template repositories or generic checklists, Scaffold is **stateful**: it learns your preferred stack once and applies it automatically to every new project. It combines three interconnected capabilities:

1. **Memory** — remembers your stack, your decisions, your templates
2. **Guidance** — structured playbooks for every launch scenario
3. **Automation** — generates project skeletons from your saved stack

### 2.1 Core Pillars

#### Pillar 1 — Launch Playbooks
Structured, step-by-step checklists for every launch scenario: new MVP, new feature, production go-live, or full startup. Built-in playbooks cover the most common scenarios. Users can customize, fork, and version their own playbooks. Teams share a single master playbook library.

**Key behaviours:**
- Steps can be auto-completed when the user's stack includes the relevant tool
- Playbooks are forkable — users own their custom version
- Running playbook instances track progress per project
- Due dates and project names attach to each run

#### Pillar 2 — Code Boilerplates & Templates
120+ hand-curated, maintained starter templates for auth, payments, email, CI/CD, monitoring, legal documents, and more. Templates are versioned and receive update notifications when upstream dependencies change.

**Key behaviours:**
- One-click copy to clipboard
- Compatibility tags filter templates by user's saved stack
- Staleness detection via weekly cron against npm/PyPI registries
- User-created private templates stored in personal library
- Team-shared template libraries on Team+ plans

#### Pillar 3 — Personal Stack Memory
The user defines their preferred tools and configurations once (e.g., Next.js + Supabase + Stripe + Resend). Scaffold stores this as a named stack and uses it to pre-fill new projects, inject boilerplate, and check off relevant setup steps automatically. Multiple stacks can be saved for different project types.

**Key behaviours:**
- Import stack from `package.json`, `requirements.txt`, or `Gemfile`
- Named stacks (e.g., "Next.js SaaS", "Mobile React Native")
- Stack locked by team admin to enforce consistency
- Stack auto-fills compatible template filters

#### Pillar 4 — One-Click Project Init
Given a saved stack, Scaffold generates a fully-configured project scaffold: folder structure, environment variable templates, README, initial configs, and dependency lists — personalised to the user's exact stack.

**Key behaviours:**
- Server-side ZIP generation via Inngest background job
- Output: `.env.example`, `README.md`, `package.json`, config files, folder structure
- Download as ZIP or `scaffold init` CLI command
- Pre-filled README with project name and stack details

#### Pillar 5 — Decision Log
A searchable, structured log of architectural and tooling decisions. Each entry records what was decided, why, what alternatives were considered, and when. Prevents the same debates and Google searches across projects.

**Key behaviours:**
- Fields: title, context, chosen option, alternatives, rationale, date
- Full-text search via PostgreSQL `tsvector`
- Link decisions to specific stacks or templates
- Team decision log shared across members

#### Pillar 6 — Team Library
On Team and Studio plans, all playbooks, templates, and stacks are shared across the team. New team members are unblocked immediately. Admins can lock stack choices to enforce consistency.

**Key behaviours:**
- Invite by email with pre-filled team context
- Role model: `owner | admin | member`
- Admin can lock team stack
- Slack integration: playbook completions, new member joined, staleness alerts

---

## 3. User Personas

### P1 — Indie Hacker "Alex"
Ships 3–6 products per year solo. Repeats the same setup every time. Values speed and zero friction. Has strong tool opinions. Pays for tools that save more than 2 hours.

### P2 — Small Team CTO "Mia"
2–5 person startup. Responsible for onboarding devs quickly. Frustrated that knowledge lives in one senior dev's head. Wants standards enforced without bureaucracy.

### P3 — Freelance Dev "Daniel"
Builds 6–8 client MVPs per year. Each project starts identically. Wants to go from zero to building real features in under an hour. Resells efficiency to clients.

---

## 4. User Stories

### 4.1 Onboarding & Stack Setup

| ID | Story | Priority |
|---|---|---|
| U01 | As a new user, I want to sign up with GitHub OAuth so I don't need to create another password | P0 |
| U02 | As a new user, I want to complete guided onboarding that captures my preferred stack so Scaffold personalises from day one | P0 |
| U03 | As a developer, I want to create multiple named stacks so I can switch between project types | P1 |
| U04 | As a developer, I want to import a stack from `package.json` so Scaffold auto-detects my tools | P1 |
| U05 | As a user, I want to edit my saved stack at any time to update preferences | P1 |
| U06 | As a user, I want Google OAuth as an alternative sign-in option | P1 |

### 4.2 Playbooks & Checklists

| ID | Story | Priority |
|---|---|---|
| P01 | As a founder, I want to open a "New SaaS MVP" playbook for a complete step-by-step launch checklist | P0 |
| P02 | As a developer, I want to open a "Production Deploy" playbook so I never forget critical pre-launch steps | P0 |
| P03 | As a user, I want to check off completed playbook steps to track progress | P0 |
| P04 | As a user, I want to add custom steps to any playbook for project-specific items | P1 |
| P05 | As a user, I want to fork a built-in playbook and save my version for future projects | P1 |
| P06 | As a team admin, I want to publish a playbook to the team library so all members follow the same process | P1 |
| P07 | As a developer, I want to see which playbook steps are auto-handled by my saved stack | P1 |
| P08 | As a user, I want to duplicate a running playbook for a new project | P2 |
| P09 | As a user, I want to set a due date on a playbook to plan my launch timeline | P2 |

### 4.3 Templates & Boilerplates

| ID | Story | Priority |
|---|---|---|
| T01 | As a developer, I want to browse templates by category (auth, payments, email, etc.) | P0 |
| T02 | As a developer, I want to search templates by keyword | P0 |
| T03 | As a developer, I want to copy a template to clipboard with one click | P0 |
| T04 | As a user on a paid plan, I want to be notified when a template's dependency releases a major version | P1 |
| T05 | As a developer, I want to save custom templates to my personal library | P1 |
| T06 | As a developer, I want to tag my templates with stack and category labels | P1 |
| T07 | As a team member, I want to share a template to the team library | P1 |
| T08 | As a developer, I want to see which templates are compatible with my saved stack | P1 |

### 4.4 Project Init

| ID | Story | Priority |
|---|---|---|
| I01 | As a developer, I want to click "New Project" and select a stack so Scaffold generates a project scaffold in seconds | P0 |
| I02 | As a developer, I want the generated scaffold to include a pre-filled `.env.example` based on my stack | P0 |
| I03 | As a developer, I want to download the generated scaffold as a ZIP | P0 |
| I04 | As a developer, I want the init to pre-fill a README with my project name and stack details | P1 |
| I05 | As a developer, I want to install a Scaffold CLI and run `scaffold init` from my terminal | P1 |

### 4.5 Decision Log

| ID | Story | Priority |
|---|---|---|
| D01 | As a developer, I want to create a decision entry with title, context, chosen option, alternatives, and rationale | P1 |
| D02 | As a user, I want to search my decision log by keyword | P1 |
| D03 | As a developer, I want to link a decision to a specific template or stack | P2 |
| D04 | As a team member, I want to view my team's decision log | P1 |

### 4.6 Team & Collaboration

| ID | Story | Priority |
|---|---|---|
| C01 | As a team admin, I want to invite teammates by email | P0 |
| C02 | As a user, I want to share a playbook via a public link for non-Scaffold users to view | P1 |
| C03 | As a team admin, I want to lock the team's primary stack | P1 |
| C04 | As a team admin, I want to see which team members have completed their project playbooks | P2 |
| C05 | As a new team member, I want access to the team's stack, templates, and playbooks on day one | P0 |

### 4.7 Billing & Account

| ID | Story | Priority |
|---|---|---|
| B01 | As a user, I want to upgrade my plan from within the app without contacting support | P0 |
| B02 | As a user on Free plan, I want a clear indication of what I'll unlock by upgrading | P0 |
| B03 | As a user, I want to switch between monthly and annual billing | P1 |
| B04 | As a team admin, I want to manage billing and see per-seat cost breakdown | P1 |
| B05 | As a user, I want to cancel at any time without speaking to anyone | P0 |
| B06 | As a user who cancels, I want my data preserved on the Free plan | P0 |

---

## 5. Feature Specifications

### 5.1 Plan Feature Matrix

| Feature | Free | Solo | Team | Studio |
|---|---|---|---|---|
| Projects | 3 | Unlimited | Unlimited | Unlimited |
| Templates (built-in) | 15 | All 120+ | All 120+ | All 120+ |
| Custom stack memory | — | ✓ | ✓ | ✓ |
| Custom checklists | — | ✓ | ✓ | ✓ |
| AI setup suggestions | — | ✓ | ✓ | ✓ |
| Decision log | — | ✓ | ✓ | ✓ |
| Team members | 1 | 1 | Up to 8 | Unlimited |
| Shared team library | — | — | ✓ | ✓ |
| Boilerplate sync | — | — | ✓ | ✓ |
| Slack integration | — | — | ✓ | ✓ |
| API access | — | — | — | ✓ |
| SSO (Google/GitHub) | — | — | — | ✓ |
| White-label playbooks | — | — | — | ✓ |
| Usage analytics dashboard | — | — | — | ✓ |
| Dedicated onboarding | — | — | — | ✓ |
| Price (monthly) | $0 | $12 | $32 | $89 |
| Price (annual) | $0 | $10 | $27 | $74 |

### 5.2 Template Categories

Auth · Payments · Email · CI/CD · Monitoring · Legal · Database · API · Frontend · DevOps · Analytics · Documentation

---

## 6. Implementation Decisions

### 6.1 Module Architecture

Scaffold is organised into **six core bounded modules**. Modules communicate via defined interfaces only — no shared mutable state.

#### M1 — Identity & Auth
- Handles: user registration, login, OAuth (GitHub, Google), session management, team membership
- Interface: `getUser()`, `getTeam()`, `inviteMember()`, `updatePermissions()`
- Auth provider: Supabase Auth (JWT-based sessions)
- Role model: `owner | admin | member` — stored in `team_members` table

#### M2 — Stack
- Handles: CRUD for named user stacks; stack = ordered list of tool selections with version pins
- Interface: `createStack()`, `getStack()`, `updateStack()`, `listStacks()`, `detectFromManifest()`
- `detectFromManifest()` accepts `package.json`, `requirements.txt`, `Gemfile` — parses known tool signatures
- Schema: `{ id, userId, name, tools: [{ category, toolId, version, config }] }`

#### M3 — Playbook
- Handles: playbook templates, running instances, step state
- Interface: `createPlaybook()`, `forkPlaybook()`, `startRun()`, `toggleStep()`, `getRunProgress()`
- Playbook schema: `{ id, title, category, steps: [{ id, title, description, autoCompletedBy?: toolId }] }`
- Run schema: `{ id, playbookId, projectId, completedSteps: string[], dueDate?, createdAt }`
- Auto-complete: when stack contains a tool matching a step's `autoCompletedBy` field, that step is pre-checked

#### M4 — Template
- Handles: template library — both built-in (Scaffold-owned) and user-created
- Interface: `getTemplate()`, `listTemplates()`, `createTemplate()`, `updateTemplate()`, `copyToClipboard()`
- Schema: `{ id, title, category, tags, stack_compatibility: string[], content: string, version, lastUpdated }`
- Version tracking: templates pin a semver range per dependency; background job flags outdated templates on registry releases

#### M5 — Project Init
- Handles: generates downloadable project scaffolds from a saved stack
- Interface: `generateScaffold(stackId, projectMeta) => ZipBuffer`
- Server-side: Node.js worker assembles files from template fragments keyed to stack tool selections
- Output: ZIP containing folder structure, `.env.example`, `README.md`, `package.json`, config files

#### M6 — Decision Log
- Handles: structured log of architectural decisions per user/team
- Interface: `createDecision()`, `searchDecisions(query)`, `linkDecisionToStack()`, `getTeamDecisions()`
- Full-text search via `pg_trgm` extension on PostgreSQL

### 6.2 Data Architecture

| Layer | Technology | Rationale |
|---|---|---|
| Primary DB | PostgreSQL via Supabase | Relational model fits bounded domains |
| File storage | Supabase Storage | ZIP TTL: 48h presigned URLs |
| Cache | Upstash Redis | Session tokens, public template list (5min TTL) |
| Search | PostgreSQL `pg_trgm` | In-database full-text search; avoids Elasticsearch at early scale |

### 6.3 API Design

- RESTful JSON API — Next.js API routes for web client, same endpoints consumed by CLI
- All endpoints require `Authorization: Bearer <token>` except public template browsing
- Rate limiting: 100 req/min (Free), 500 req/min (paid)
- Versioning: `/api/v1/` prefix; breaking changes bump major version
- Error shape: `{ error: string, code: string }`
- Plan limit error: HTTP 402 `{ code: 'PLAN_LIMIT', resource, current, max }`

### 6.4 Viral & Growth Mechanics

- **Public playbook links**: any user can share a read-only URL — viewers prompted to sign up
- **Team invite flow**: email invitation with pre-filled team context; converts to upgrade prompt at seat limit
- **CLI install**: `scaffold init` generates share link after project creation; generated README includes attribution line

---

## 7. Testing Decisions

Good tests verify **observable behaviour from the outside** — not internal implementation details. Tests should be readable, fast, and only break when the user-facing contract changes.

### 7.1 Module Test Priorities

#### M2 Stack Module — HIGH
- `createStack()` validates required fields and rejects unknown tool IDs
- `detectFromManifest()` identifies Next.js, Supabase, Stripe from sample `package.json`
- `updateStack()` does not mutate running playbook instances tied to the stack

#### M3 Playbook Module — HIGH
- Auto-complete logic correctly pre-checks steps when matching tool in stack
- `forkPlaybook()` creates independent copy with no shared state
- Run progress = `completedSteps.length / steps.length`

#### M4 Template Module — MEDIUM
- `stack_compatibility` filtering returns templates matching given tool IDs
- Version staleness check fires for templates whose semver range excludes latest release

#### M5 Project Init — MEDIUM
- `generateScaffold()` returns valid ZIP with expected files for given stack
- `.env.example` contains all known env var keys for stack's tools

#### Billing Enforcement — HIGH
- Free user cannot create a 4th project (expect 402 / `PLAN_LIMIT`)
- Upgrading user's plan immediately unlocks new limits without re-login

### 7.2 Testing Approach

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Pure functions: manifest detection, plan limit checks, zip assembly |
| Integration | Supertest | Next.js API routes with seeded test database |
| E2E | Playwright | Sign up → create stack → start playbook → complete step → upgrade plan |
| UI | Manual + visual diff | No snapshot tests — fragile and low-signal |

---

## 8. Out of Scope — v1.0

| Feature | Reason Deferred | Target Version |
|---|---|---|
| AI-generated stack recommendations | Needs user data to train on first | v1.1 |
| Native IDE plugin (VS Code, JetBrains) | CLI covers same init workflow | v1.2 |
| GitHub / GitLab auto-repo creation | Scope creep; API complexity | v1.2 |
| White-label / custom domain (Studio) | Build after revenue validation | v2.0 |
| Mobile apps (iOS/Android) | Responsive web sufficient for v1 | v2.0 |
| Community marketplace for 3rd-party templates | Moderation overhead | v2.0 |
| Real-time collaborative playbook editing | WebSocket complexity | v2.0 |
| Zapier / n8n integrations | Studio API access covers power users | v2.0 |

---

## 9. Success Metrics

| Metric | Target | Measurement Window |
|---|---|---|
| Activation | 60% of users create ≥1 stack within 7 days of signup | Day 7 cohort |
| Retention | 40% of users return within 14 days of first project init | Day 14 cohort |
| Conversion | 8% of Free users upgrade to Solo within 30 days | Day 30 cohort |
| Team growth | 25% of Solo users invite ≥1 teammate within 60 days | Day 60 cohort |
| NPS | ≥50 | 90-day cohort |

---

## 10. Further Notes

### 10.1 Template Maintenance Strategy
Template staleness is the primary long-term risk for user trust. A weekly cron job checks npm/PyPI/RubyGems for new major versions of known tool dependencies and updates a `is_stale` flag on affected templates. Paid users receive in-app notifications and optional email digests. The Scaffold team reviews and updates affected templates within **5 business days** of a major release.

### 10.2 Pricing Rationale
The Free plan is intentionally useful (3 projects, 15 templates) to drive organic adoption and word-of-mouth. The natural upgrade trigger is the project limit — most active indie hackers hit 3 projects within 60 days. The Team plan's per-seat economics (up to 8 members at $32/mo flat) are positioned as cheaper than 1 hour of a senior dev's time spent on repeated setup.

### 10.3 CLI Strategy
The CLI (`scaffold init`) is a **distribution channel**, not just a feature. It reduces friction for terminal-first developers and creates a natural touchpoint for referrals. The CLI is open-source; the cloud service is the commercial product.