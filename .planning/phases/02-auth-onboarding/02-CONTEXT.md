# Phase 2: Auth & Onboarding - Context

**Gathered:** 2026-05-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can sign in with GitHub or Google via Supabase OAuth, complete a skippable 3-step onboarding flow, and remain logged in across sessions. New users get a dashboard layout shell after auth. CLI token management (generate / list / revoke) lives at /settings/tokens. Template library, stack module, and all other feature content are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Onboarding flow
- 3 steps: project type → stack builder → ready
- Project type step: structure and options left to planner's discretion
- Stack builder step: optional — has a "skip for now" exit that creates no stack
- Ready screen: design left to planner's discretion
- Skip behavior: "skip setup" exits the entire flow early; sets onboarding_complete = true immediately (skip is a one-way door — not shown again)
- Returning users who skipped: shown a soft prompt (banner/tooltip on dashboard), NOT redirected back to onboarding

### Post-auth routing
- New user routing after OAuth: planner decides (either onboarding-first redirect or dashboard with onboarding overlay)
- Deep-link / redirect param after sign-in: planner decides
- Dashboard in Phase 2: layout shell with sidebar nav + empty content area (not a stub). Sidebar should include nav items for stacks, playbooks, templates, settings — real content added per phase.

### Auth errors & edge cases
- OAuth failure UX: planner decides (login page with error OR dedicated /auth/error page)
- Provider conflict: if same email exists under different OAuth provider, auto-link accounts silently
- Login page loading state: spinner on the clicked button, other button disabled — prevents double-submit
- Session expiry / JWT refresh failure: planner decides handling

### CLI token UI
- Location: /settings/tokens (account settings sub-page)
- Token reveal on generation: modal dialog with plaintext token, copy button, and warning ("Save this — won't be shown again")
- Token list columns: name, created date, last used, revoke button
- Revoke confirmation: confirm dialog before revoke ("Revoke this token? Any CLI sessions using it will stop working.")

### Claude's Discretion
- Project type step options and structure
- Ready screen (step 3) design
- New user post-OAuth routing decision (onboarding redirect vs overlay)
- Deep-link redirect param handling
- OAuth failure error page vs login page with error
- Session expiry handling
- Exact sidebar nav items and layout

</decisions>

<specifics>
## Specific Ideas

- Token list shows "last used" timestamp so users can identify active vs dormant tokens
- Revoke is destructive with no undo — confirm dialog is the safety gate
- Soft prompt for skipped onboarding (not a hard redirect on subsequent sign-ins)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-auth-onboarding*
*Context gathered: 2026-05-23*
