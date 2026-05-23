# Phase 1: Foundation - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a deployable project skeleton: Next.js 16 app boots, full DB schema defined via Drizzle, plan limits config exported, CI/CD pipeline running, and all infrastructure clients (Redis, Inngest, Sentry, PostHog, Resend) initialized. No application features — pure foundation that every subsequent phase builds on.

</domain>

<decisions>
## Implementation Decisions

### Plan limits config

| Resource | Free | Solo | Team | Studio |
|----------|------|------|------|--------|
| Projects | 3 | Unlimited | Unlimited | Unlimited |
| Templates | 15 | Unlimited | Unlimited | Unlimited |
| Stacks | 3 | Unlimited | Unlimited | Unlimited |
| Playbook runs | 3 | Unlimited | Unlimited | Unlimited |
| Decision log | ❌ Feature-gated | ✅ Unlocked | ✅ Unlocked | ✅ Unlocked |
| Team access | ❌ Feature-gated | ❌ Feature-gated | ✅ Up to 8 seats | ✅ Unlimited seats |

- Solo plan removes ALL numeric limits — the differentiator is unlocking the decision log and personal templates
- Team plan has unlimited shared resources; the only cap is 8 seats
- Studio plan is truly unlimited: no resource caps, no seat limit

### Database schema scope

- Define ALL core domain tables in Phase 1 (users, stacks, tools, templates, playbooks, playbook_steps, playbook_runs, run_steps, decisions, teams, team_members, team_invites)
- **Exceptions**: `stripe_events` and `cli_tokens` are defined in their feature phases (Phase 10 and Phase 2 respectively)
- Built-in playbook seed data runs in Phase 6 alongside the 120+ template content seed — not in Phase 1
- RLS policies enabled for all Phase 1 tables now; later phases add policies for their own tables when built

### Tools catalog

- Claude's discretion — static TypeScript config or seeded DB table, whichever fits the Drizzle schema approach best

### Placeholder page

- Branded holding page at `/`: Scaffold wordmark, tagline ("Launch OS for developers"), and disabled sign-in buttons (greyed out, not functional until Phase 2)
- Dark theme applied immediately: `globals.css` populated with all design tokens from CLAUDE.md (`--bg: #0B0C0F`, `--teal: #00D4AA`, etc.) so every subsequent phase inherits the correct base
- Stub all route groups in Phase 1: `app/(auth)/` and `app/(dashboard)/` created with placeholder pages to establish the folder structure
- `/api/health` endpoint returns JSON with: DB connectivity status, env var presence check, Redis ping result — useful for CI and Vercel deploy smoke testing

### CI/CD pipeline

- Checks: lint → typecheck → vitest → next build (in sequence, fail fast)
- Triggers: PRs (required), push to main, and scheduled nightly run
- Branch protection: failing CI **blocks merge** — required status check enforced
- Vercel: preview deployment on every PR via Vercel GitHub integration (auto-configured)
- Secret handling in CI: Claude's discretion — use stub env vars for build/typecheck, real secrets only if needed for integration tests (Vitest unit tests won't need DB at this phase)

### Claude's Discretion

- Tools catalog implementation (static config vs DB table)
- CI secret strategy (stub values vs GitHub Secrets) — prioritize simplest approach that makes `next build` pass
- Exact Drizzle schema file organization (one file vs per-table files)
- Health endpoint response shape beyond the three required signals

</decisions>

<specifics>
## Specific Ideas

- The `/api/health` endpoint should check three things: DB (can Drizzle reach Supabase), env vars (all required vars present and non-empty), Redis (Upstash ping round-trip). Return `{ status: "ok" | "degraded", checks: { db, env, redis } }`.
- Branded holding page should feel consistent with `doc/scaffold-landing.html` aesthetic — dark background, teal accent, clean typography.
- Route group stubs (`app/(auth)/login/page.tsx`, `app/(dashboard)/page.tsx`) exist as empty shells so the file tree is established, even if they just return `null` or a "Coming soon" fragment.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 1 scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-05-23*
