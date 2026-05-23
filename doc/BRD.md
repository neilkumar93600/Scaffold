# Scaffold — Business Requirements Document
> Business justification, objectives, stakeholder needs, and success criteria for v1.0
> Version: 1.0 | Status: Active | Owner: Neil

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Business Context](#2-business-context)
3. [Market Opportunity](#3-market-opportunity)
4. [Stakeholders](#4-stakeholders)
5. [Current State Analysis](#5-current-state-analysis)
6. [Future State Vision](#6-future-state-vision)
7. [Business Requirements](#7-business-requirements)
8. [Business Rules](#8-business-rules)
9. [Assumptions & Constraints](#9-assumptions--constraints)
10. [Dependencies](#10-dependencies)
11. [Financial Model](#11-financial-model)
12. [Go-to-Market Strategy](#12-go-to-market-strategy)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Milestones & Timeline](#14-milestones--timeline)
15. [Risk Summary](#15-risk-summary)

---

## 1. Executive Summary

**Product:** Scaffold — Launch OS for developers, solo founders, and small startups
**Category:** Developer tools / SaaS productivity
**Stage:** Pre-revenue, open beta
**Model:** Freemium SaaS (Free → Solo $12/mo → Team $32/mo → Studio $89/mo)

**Problem in one sentence:** Every developer and founder rebuilds the exact same project foundation from scratch — authentication, payments, CI/CD, legal docs, monitoring — each time they start a new project, wasting an average of **4.2 hours per project** on work that adds no unique value.

**Solution in one sentence:** Scaffold is a persistent knowledge base that remembers your preferred tools, configurations, and decisions once — then applies them automatically to every new project via structured playbooks, reusable boilerplates, and one-click project scaffold generation.

**Business case:** The global developer tools market is projected to reach **$28.3B by 2028**. The target segment — indie hackers, solo founders, and small startup engineering teams — numbers approximately **4–6 million** professionals globally. Scaffold's freemium model targets a conservative **0.5% paid conversion** of 50,000 MAU in Year 1, yielding ~$360K ARR at launch-scale, scaling to **$2.4M ARR** at 5,000 paying users by Month 18.

---

## 2. Business Context

### 2.1 Industry Background

The developer tools market has bifurcated:

- **Infrastructure tooling** (Vercel, Supabase, Railway) — handles runtime and deployment
- **Code generation** (GitHub Copilot, Cursor) — assists with writing new code

**Neither category solves the setup loop.** A developer using Vercel + Supabase + GitHub Copilot still manually configures the same Stripe integration for the fourth time this year. They still forget to add PostHog before launch. They still onboard a new team member by walking them through a scattered collection of Notion docs and GitHub gists.

Scaffold fills the gap between "generate code" and "deploy code" — the **launch layer** that is currently unowned by any major tool.

### 2.2 Strategic Positioning

```
              HIGH VALUE
                  │
  GitHub Copilot  │              SCAFFOLD
  (write code)    │          (launch infrastructure)
                  │
──────────────────┼────────────────────────────────
  NARROW          │                         BROAD
  (one task)      │                      (lifecycle)
                  │
                  │  Notion/Obsidian
                  │  (generic notes)
              LOW VALUE
```

Scaffold is positioned as **broad lifecycle value** — covering the full launch journey from stack definition through project init, checklist completion, and knowledge capture — rather than excelling at one narrow task.

### 2.3 Why Now

Three converging trends make this the right moment:

1. **Indie hacker growth** — the number of solo founders shipping multiple products per year has grown 3× since 2020, driven by AI-assisted development and no-code tools lowering the activation energy for product development.

2. **Tool proliferation fatigue** — the modern SaaS stack has 8–15 tools per project (auth, payments, email, monitoring, analytics, legal, CI/CD, etc.), each with its own setup ceremony. Fatigue is high; consolidation tools win.

3. **AI writing code, humans managing complexity** — as AI handles more code writing, human engineering time increasingly goes to setup, configuration, and decision-making. Scaffold targets exactly this remaining human work.

---

## 3. Market Opportunity

### 3.1 Target Market Segments

| Segment | Size (Global Est.) | Willingness to Pay | Acquisition Channel |
|---|---|---|---|
| Indie hackers / solo founders | ~2M | High ($12–$32/mo) | Twitter/X, Product Hunt, Hacker News |
| Small startup teams (2–8) | ~1.5M teams | Very high ($32/mo flat) | Word of mouth, team invite loop |
| Freelancers / micro-agencies | ~1M | Medium ($12–$32/mo) | Google, dev communities |
| First-time founders | ~500K | Low initially, grows fast | Incubator partnerships |

**Total Addressable Market (TAM):** ~5M developers/founders fitting the profile
**Serviceable Addressable Market (SAM):** ~800K with sufficient English-language reach and tool sophistication
**Serviceable Obtainable Market (SOM) — Year 1:** 50,000 MAU, 2,500 paying users

### 3.2 Competitive Landscape

| Competitor | Category | Overlap | Scaffold Advantage |
|---|---|---|---|
| Notion | Notes / wikis | Decision log, playbooks | Scaffold is developer-native; no setup to use; auto-applies stack |
| GitHub Gists | Code snippets | Template library | Searchable, versioned, stack-filtered; not a dump |
| Cookiecutter / create-next-app | Scaffolding | Project init | Scaffold is persistent + personalized; not one-off |
| Linear / Jira | Project management | Playbook tracking | Scaffold is launch-specific; zero config; no ticket overhead |
| Cursor / Copilot | Code generation | Nothing directly | Complementary — Scaffold does setup, AI does feature code |
| Bullet Train / SaaSKit | Starter kits | Templates, project init | Scaffold is language-agnostic; saves YOUR decisions, not generic ones |

**No direct competitor** occupies the "persistent, personalized, developer launch OS" position.

---

## 4. Stakeholders

### 4.1 Internal Stakeholders

| Stakeholder | Role | Primary Interest |
|---|---|---|
| Founder / Product Owner | Strategy, roadmap, GTM | Product-market fit, ARR growth |
| Engineering Lead | Architecture, delivery | Technical correctness, velocity |
| Design Lead | UX, visual system | Conversion, retention, delight |
| Growth / Marketing | Acquisition, activation | CAC, conversion rates |

### 4.2 External Stakeholders

| Stakeholder | Type | Need |
|---|---|---|
| Indie hackers (P1 — Alex) | Primary user | Save setup time; ship faster |
| Small team CTOs (P2 — Mia) | Primary buyer (Team plan) | Onboard devs fast; enforce standards |
| Freelancers (P3 — Daniel) | High-volume user | Consistent client project setup |
| Template contributors (future) | Community | Recognition, distribution |
| Integration partners | Ecosystem | Listed in template library |

### 4.3 Influence Matrix

| Stakeholder | Influence | Interest | Engagement Strategy |
|---|---|---|---|
| Solo founders | High | High | Product Hunt launch, Twitter/X |
| Team CTOs | High | High | Direct outreach, case studies |
| Dev communities (HN, Reddit) | High | Medium | Organic posts, value-first content |
| Integration vendors (Stripe, Supabase) | Medium | Low | Partner listing program (v2) |

---

## 5. Current State Analysis

### 5.1 How Developers Solve This Today (Workarounds)

| Workaround | Tool Used | Pain |
|---|---|---|
| Store configs | GitHub Gists | Not searchable; no stack filtering; stale |
| Document stack choices | Notion / Obsidian | Generic; no auto-apply to projects |
| Reuse old projects | Copy-paste from GitHub repos | Manual; outdated; no structure |
| Use starter kits | create-next-app, Bullet Train | Not personalized; one-time; no memory |
| Mental checklist | Memory | Incomplete; forgotten items; no handoff |
| Team wiki | Confluence / Notion | Not developer-workflow-integrated; high maintenance |

### 5.2 Current State Pain Metrics

| Metric | Value | Source |
|---|---|---|
| Average setup hours lost per project | 4.2 hours | Scaffold user interviews (n=47) |
| % who forget ≥1 launch item | 73% | Survey (analytics, error monitoring, legal pages most common) |
| Avg. days to unblock a new team member | 3.2 days | Team user interviews |
| % who have a "system" vs ad hoc | 28% have a system | Survey |
| % of devs who repeat same integrations | 91% (Stripe, auth, email) | Survey |

### 5.3 Cost of Status Quo

For an indie hacker shipping 4 products/year:
- **Time cost:** 4.2 hrs × 4 projects = **16.8 hours/year** lost to setup
- At $150/hr consulting equivalent: **$2,520/year** in value lost to repetitive setup
- Scaffold Solo at $120/year = **21× ROI** on time alone

For a 5-person team shipping 2 new features/month:
- **Time cost:** 4.2 hrs × 2/mo × 12 × 5 people = **504 hrs/year** across team
- Scaffold Team at $384/year = payback in **<1 day** of recovered dev time

---

## 6. Future State Vision

### 6.1 North Star

> **A developer starting any new project should never manually configure the same thing twice.**

In the future state, Scaffold:
- Knows your stack and applies it automatically
- Catches everything you'd otherwise forget via structured playbooks
- Preserves every architectural decision so it is never re-debated
- Onboards new team members to your standards on day one

### 6.2 User Journey — Future State

```
Before Scaffold (today):
  Day 0: Project started
  Day 1-3: Setup (auth, payments, email, CI/CD, etc.)
  Day 4: Start real product work
  Day N: Realize monitoring wasn't added; scramble to add it

After Scaffold:
  Day 0: scaffold init → stack applied, playbook started
  Day 0: 20 minutes of config (vs 3 days)
  Day 0 afternoon: Start real product work
  Never: Forget monitoring — it's in the playbook
```

### 6.3 Success Picture at 12 Months

- **3,800+ active users** (matching landing page social proof)
- **2,500 paying users** across Solo, Team, Studio plans
- **~$420K ARR** at Month 12
- **NPS ≥ 50** — users recommend Scaffold to at least one peer
- **Template library:** 120+ built-in + growing user-contributed private templates
- **Viral coefficient ≥ 0.3** — team invites and public playbook links drive organic growth

---

## 7. Business Requirements

Business requirements define **what the business needs** — independent of how it is technically implemented.

### 7.1 Revenue Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR01 | System must support four plan tiers (Free, Solo, Team, Studio) with distinct feature gates | P0 |
| BR02 | System must accept monthly and annual billing, with annual at 17% discount | P0 |
| BR03 | Plan upgrades must take effect immediately without user re-login or support intervention | P0 |
| BR04 | Cancellations must be self-serve; users must not need to contact support to cancel | P0 |
| BR05 | User data must be preserved at Free tier limits on downgrade — no data loss on cancellation | P0 |
| BR06 | System must support team billing with flat-rate pricing (not per-seat variable) for Team plan | P1 |
| BR07 | Billing portal must show invoices, payment method, and plan change options without custom UI | P1 |

### 7.2 Growth & Acquisition Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR08 | System must support GitHub and Google OAuth sign-in — no password barrier to signup | P0 |
| BR09 | Playbooks must be shareable via public read-only link to drive viral acquisition | P0 |
| BR10 | CLI must include Scaffold attribution in generated README to create organic referrals | P1 |
| BR11 | Team invite flow must show upgrading value proposition at seat limit to convert Solo→Team | P1 |
| BR12 | Free plan must be genuinely useful (3 projects, 15 templates) to drive word-of-mouth | P0 |
| BR13 | Onboarding must guide new users to their first stack within 10 minutes of signup | P0 |

### 7.3 Retention Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR14 | Users must receive notifications when a template they copied becomes outdated | P1 |
| BR15 | Playbook run history must persist so users see their progress and return to continue | P0 |
| BR16 | Decision log must be searchable — users must be able to retrieve past decisions quickly | P1 |
| BR17 | Stack changes must not destroy active playbook runs tied to that stack | P0 |
| BR18 | System must send weekly staleness digest (opt-in) to keep paid users engaged | P2 |

### 7.4 Team & Collaboration Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR19 | New team members must have access to team stack, templates, and playbooks on first login | P0 |
| BR20 | Team admin must be able to lock stack to prevent members from deviating from approved tools | P1 |
| BR21 | System must support Slack integration to post playbook completions and alerts to team channel | P1 |
| BR22 | Team admin must be able to track which members have completed project playbooks | P2 |

### 7.5 Trust & Reliability Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR23 | System must achieve 99.9% uptime — setup tool downtime blocks entire projects | P0 |
| BR24 | Template library must be reviewed and updated within 5 business days of a major dependency release | P1 |
| BR25 | User data must never be deleted on plan downgrade — only access restricted | P0 |
| BR26 | CLI must be open-source to build developer trust and community contributions | P1 |

### 7.6 Compliance & Legal Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR27 | System must not store OAuth credentials — delegate entirely to Supabase Auth / providers | P0 |
| BR28 | User data must be deletable on request (GDPR right to erasure) | P0 |
| BR29 | Terms of Service and Privacy Policy must be displayed at signup and accessible from footer | P0 |
| BR30 | Template content contributed by users must comply with ToS prohibiting copyrighted material | P1 |

---

## 8. Business Rules

These rules govern system behaviour and must not be violated:

| ID | Rule |
|---|---|
| BIZ01 | A Free user cannot have more than 3 projects. The 4th project creation must be blocked server-side with a prompt to upgrade. |
| BIZ02 | A Free user can access exactly 15 built-in templates. Paid templates or the full library require Solo or higher. |
| BIZ03 | Decision log is inaccessible on Free plan. Any attempt to create a decision entry must prompt upgrade. |
| BIZ04 | A Team plan stack can be locked by an admin/owner. Locked stacks cannot be edited by members. |
| BIZ05 | A team cannot exceed its `max_members` limit. Attempting to invite the 9th member on Team plan (max 8) must prompt upgrade to Studio. |
| BIZ06 | Plan enforcement is always server-side. Client-rendered plan gates are UX-only — API must re-validate. |
| BIZ07 | A user who cancels reverts to Free plan immediately on billing period end. Their data is preserved at Free-tier access. |
| BIZ08 | Stripe events must be processed idempotently. Duplicate webhook delivery must not double-process billing actions. |
| BIZ09 | A stack cannot be fully deleted if it has active (incomplete) playbook runs. User must complete or abandon runs first. |
| BIZ10 | Public playbook links are read-only. A viewer cannot check steps, fork, or edit without signing up. |
| BIZ11 | CLI API tokens are stored as SHA-256 hash. The plaintext token is shown once at generation and cannot be retrieved. |
| BIZ12 | Annual plan discount is exactly 17%. This must be mathematically consistent across Stripe Price objects and UI display. |
| BIZ13 | Template content is always stored and rendered as plain text. No HTML rendering of template content — ever. |
| BIZ14 | Generated scaffold ZIPs are available for 48 hours via presigned URL, then expire. User must re-generate after expiry. |

---

## 9. Assumptions & Constraints

### 9.1 Assumptions

| ID | Assumption | If Wrong… |
|---|---|---|
| A01 | Target users are willing to pay $12–$32/mo for setup time savings | Revisit pricing; shift to lower price or feature bundling |
| A02 | 60% activation rate (users who create ≥1 stack within 7 days) is achievable with good onboarding | Invest in onboarding optimization before other features |
| A03 | Supabase is a reliable long-term infrastructure partner with adequate uptime SLAs | Architecture is modular enough to swap DB layer; see R1 in Risk Register |
| A04 | Template library of 120+ is sufficient for v1 value proof | Ship 60+ high-quality templates over 200+ low-quality ones |
| A05 | CLI adoption is a secondary, not primary, onboarding path for v1 | Don't block launch on CLI; ship web-first |
| A06 | GitHub OAuth covers >80% of target users' preferred auth method | Google OAuth as fallback covers the remainder |

### 9.2 Constraints

| ID | Constraint | Impact |
|---|---|---|
| C01 | v1.0 ships as a modular monolith — no microservices | Limits independent scaling of ZIP generation; mitigated by Inngest offloading |
| C02 | No mobile apps in v1 | Responsive web only; must work on 375px viewport |
| C03 | Template library is hand-curated by Scaffold team — no open marketplace in v1 | Quality control maintained; growth bounded by team capacity |
| C04 | Migrations are additive-only in v1 (no drops, no renames) | Cannot restructure schema mid-v1 without a major version |
| C05 | Stripe Billing Portal handles all subscription management — no custom billing UI in v1 | Faster to build; less control over upgrade flow UX |
| C06 | Real-time collaboration out of scope for v1 | Teams share a library but do not co-edit playbooks simultaneously |

---

## 10. Dependencies

### 10.1 External Service Dependencies

| Service | Purpose | Criticality | Fallback |
|---|---|---|---|
| Supabase | Database, Auth, Storage | Critical | No hot fallback; status page + queue |
| Stripe | Payments, subscriptions | Critical | No fallback; service degradation acceptable |
| Vercel | Deployment, edge network | Critical | Re-deploy to Netlify/Fly.io if needed |
| Inngest | Background jobs | High | Retry queue; jobs recoverable; ZIP gen falls back to sync for small payloads |
| Resend | Transactional email | Medium | Emails delayed; no user-facing failure |
| Upstash Redis | Rate limiting, cache | Medium | Fail open on cache miss; rate limiting degraded |
| PostHog | Product analytics | Low | Data gap; no user impact |
| Sentry | Error monitoring | Low | Errors untracked; no user impact |

### 10.2 Internal Dependencies

| Dependency | Blocks | Notes |
|---|---|---|
| DB schema + RLS policies | Every module | Must be complete before feature development |
| Auth module (M1) | All other modules | Every module depends on `getUser()` |
| Stack module (M2) | Playbook auto-complete, Project init | Stacks must exist before runs or init can work |
| Zod validation schemas | API routes | Schema written before route implementation |
| Stripe products configured | Billing UI | Price IDs must exist in Stripe before billing endpoints |

---

## 11. Financial Model

### 11.1 Pricing

| Plan | Monthly | Annual (÷12) | Discount |
|---|---|---|---|
| Free | $0 | $0 | — |
| Solo | $12 | $10 | 17% |
| Team | $32 | $27 | 16% |
| Studio | $89 | $74 | 17% |

### 11.2 Revenue Projections

#### Year 1 (Month 1–12)

| Month | MAU | Paying Users | MRR | ARR Run Rate |
|---|---|---|---|---|
| 1 (Beta) | 500 | 25 | $450 | $5,400 |
| 3 | 2,000 | 120 | $2,280 | $27,360 |
| 6 | 8,000 | 480 | $9,120 | $109,440 |
| 9 | 20,000 | 1,200 | $24,000 | $288,000 |
| 12 | 35,000 | 2,100 | $42,000 | $504,000 |

**Assumptions:**
- Conversion rate: 6% Free → paid (below industry avg of 2–5% for dev tools, justified by high activation intent)
- Plan mix: 60% Solo, 35% Team, 5% Studio
- Blended ARPU: ~$20/mo
- MoM growth: 40% through Month 6, 25% Month 7–12

#### Year 2 Target

| Metric | Target |
|---|---|
| MAU | 100,000 |
| Paying users | 5,000 |
| MRR | $100,000 |
| ARR | $1.2M |

### 11.3 Unit Economics

| Metric | Target |
|---|---|
| Customer Acquisition Cost (CAC) | <$30 (organic-first) |
| Lifetime Value (LTV) — Solo | ~$240 (20mo × $12) |
| LTV — Team | ~$640 (20mo × $32) |
| LTV/CAC ratio | >8× |
| Payback period | <3 months |
| Gross margin | >85% (SaaS, low COGS) |

### 11.4 Cost Structure (Monthly at $42K MRR)

| Cost | Monthly | Notes |
|---|---|---|
| Supabase Pro | $25 | Scales on usage |
| Vercel Pro | $20 | Scales on bandwidth |
| Upstash Redis | $10 | Pay-per-request |
| Inngest | $50 | Based on job volume |
| Resend | $20 | Based on email volume |
| Sentry | $26 | Team plan |
| PostHog | $0–450 | Free tier to start |
| Stripe fees | ~2.9% + $0.30 per transaction | ~$1,200 at $42K |
| **Total COGS** | **~$1,400/mo** | **~3.3% of MRR** |

---

## 12. Go-to-Market Strategy

### 12.1 Launch Strategy

**Phase 1 — Closed Beta (Weeks 1–4)**
- Invite 100–200 high-intent users from personal network and Twitter/X DMs
- Goal: first 10 paying users, activation rate benchmark
- Instrument everything with PostHog from day one

**Phase 2 — Open Beta Launch (Week 5)**
- Product Hunt launch (primary distribution event)
- Hacker News "Show HN" post
- Twitter/X thread: "I wasted 4 hours setting up the same Stripe integration for the 8th time, so I built…"
- Goal: 500+ signups on launch day, 25 paying users within 7 days

**Phase 3 — Content Flywheel (Month 2–6)**
- SEO content: "Next.js Stripe integration guide", "Supabase auth setup", etc. — each targeting a Scaffold template
- Each article ends with: "Or copy this in Scaffold in one click"
- Goal: organic search becoming top acquisition channel by Month 4

**Phase 4 — Team Expansion (Month 4+)**
- Team invite viral loop activated — Solo users invited teammates at 25% rate per cohort
- Case study: "How [Company] onboards new devs in 1 hour using Scaffold"

### 12.2 Positioning Statement

> For **indie hackers, solo founders, and small startup teams** who are tired of rebuilding the same project foundation from scratch, **Scaffold** is a **developer Launch OS** that saves your stack, playbooks, and boilerplates — so you ship faster, every time.
>
> Unlike **Notion docs, GitHub gists, or starter kits**, Scaffold is **stateful and personalized** — it remembers your exact preferences and automatically applies them to every new project.

### 12.3 Key Metrics Dashboard

| Metric | Tracked In | Review Cadence |
|---|---|---|
| Signup → Stack creation rate | PostHog funnel | Weekly |
| Day 7 retention | PostHog cohort | Weekly |
| Free → paid conversion rate | Stripe + PostHog | Weekly |
| Solo → Team upgrade rate | Stripe | Monthly |
| Template copy events | PostHog | Weekly |
| Playbook completion rate | PostHog | Weekly |
| NPS | Typeform survey | Monthly |
| MRR growth rate | Stripe MRR dashboard | Weekly |

---

## 13. Acceptance Criteria

A business requirement is **satisfied** when all criteria below are met for the corresponding area.

### 13.1 Revenue

- [ ] Free user cannot create a 4th project — blocked server-side, upgrade prompt shown
- [ ] Stripe checkout completes and plan upgrades within 30 seconds of payment
- [ ] Annual billing shows correct discounted price on UI and in Stripe
- [ ] User can cancel via Billing Portal with no support contact required
- [ ] Cancelled user retains data access at Free plan limits on next login

### 13.2 Onboarding & Activation

- [ ] New user can sign up with GitHub OAuth in <30 seconds
- [ ] Onboarding flow guides user to create first stack — achievable in ≤10 minutes
- [ ] 60% of beta cohort users create ≥1 stack within 7 days

### 13.3 Core Features

- [ ] User can create, save, and apply a named stack with ≥3 tool selections
- [ ] User can start a playbook run, check steps, and see progress percentage
- [ ] User can browse and filter all 120+ templates by category and stack
- [ ] User can copy a template to clipboard with single click
- [ ] User can generate a project scaffold ZIP from a saved stack
- [ ] User can create a decision log entry with title, context, decision, alternatives, rationale
- [ ] Decision log full-text search returns relevant results in <200ms

### 13.4 Team

- [ ] Admin can invite a member by email; invitee receives onboarding email
- [ ] New team member sees team stack, playbooks, and templates on first login
- [ ] Admin can lock team stack; locked stack shows read-only to members

### 13.5 Reliability

- [ ] System uptime ≥ 99.9% in any rolling 30-day period
- [ ] Template staleness check runs weekly; stale templates flagged within 7 days of release
- [ ] Paid users receive staleness notification email (opted-in by default)

---

## 14. Milestones & Timeline

| Milestone | Target Date | Success Criteria |
|---|---|---|
| M0 — Foundation | Week 2 | DB schema live, auth working, basic stack CRUD |
| M1 — Core Loop | Week 5 | Stack + Playbook + Template modules complete; internal dogfooding |
| M2 — Project Init | Week 7 | ZIP generation working; CLI alpha available |
| M3 — Decision Log | Week 8 | Decision CRUD + search working |
| M4 — Billing | Week 9 | Stripe integration live; all plans purchasable |
| M5 — Team Features | Week 11 | Team library, invites, Slack integration |
| M6 — Beta Launch | Week 12 | Open beta on Product Hunt; 500+ signups target |
| M7 — Iteration | Week 13–16 | Activation optimization; template library expansion to 120+ |
| M8 — Month 6 | Week 24 | 8,000 MAU, 480 paying users, $9K MRR |

---

## 15. Risk Summary

> Full risk register: see [TRD.md — Risk Register](TRD.md#9-risk-register)

| # | Risk | Likelihood | Impact | Owner |
|---|---|---|---|---|
| R1 | Low activation rate (<40%) — onboarding fails to reach "aha moment" | Medium | High | Product |
| R2 | Price sensitivity — target users unwilling to pay $12/mo | Low | High | Growth |
| R3 | Template library goes stale — users lose trust in boilerplate quality | Medium | High | Engineering |
| R4 | Stripe/Supabase outage blocks critical user actions | Low | High | Engineering |
| R5 | Competitor (Vercel, Linear, Notion) ships overlapping feature | Low | Medium | Product |
| R6 | Team plan underperforms — solo usage dominates, team virality fails | Medium | Medium | Growth |
| R7 | CLI adoption below 10% — terminal-first devs not converting | Medium | Low | Engineering |
| R8 | Open-source CLI forked into a free self-hosted alternative | Low | Low | Business model |

### Mitigations Summary

- **R1:** Invest heavily in onboarding before adding features; use PostHog funnels to find drop-off
- **R2:** Free plan is genuinely useful; value narrative anchored to time savings ($2,500+/year)
- **R3:** Weekly automated staleness checks + team review SLA of 5 business days
- **R4:** Status page, graceful degradation, Inngest retry queues
- **R5:** Speed to market + personal stack memory moat; competitors can copy features, not user data
- **R6:** Team viral loop (invite sent at seat limit); case study marketing from Month 4
- **R7:** CLI is distribution, not core; web-first is primary path
- **R8:** Cloud service value (stack memory, team library, staleness alerts) not replicable in self-host