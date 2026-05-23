# Scaffold — Definition of Done

> A feature, fix, or module is **DONE** when every applicable item is checked. No exceptions without explicit team sign-off.

---

## Code Quality

- [ ] No TypeScript errors — `pnpm typecheck` passes with zero errors
- [ ] No ESLint errors or warnings — `pnpm lint` passes clean
- [ ] Code formatted — `pnpm format` produces no diff
- [ ] No `any` types introduced — `unknown` + type narrowing used instead
- [ ] No `console.log` left in committed code

---

## Architecture Compliance

- [ ] New logic lives in the appropriate module (`lib/modules/[name]/`)
- [ ] API route contains no business logic — imports from module only
- [ ] No cross-module direct DB queries — only via module interface
- [ ] New components follow RSC-first pattern — `'use client'` only where required
- [ ] No `dangerouslySetInnerHTML` with user-controlled content

---

## Validation & Error Handling

- [ ] Every API request body has a Zod schema in `lib/validations/`
- [ ] All API error responses use correct HTTP status code and `{ error, code }` shape
- [ ] Plan limit breaches return HTTP 402 with `PLAN_LIMIT` code
- [ ] Plan limit enforcement is server-side — not client-only

---

## Security

- [ ] New tables have RLS enabled and policies defined
- [ ] RLS policies tested with user-isolation assertions
- [ ] Plan limit enforcement tested with Free-tier edge case (e.g., 4th project blocked)
- [ ] No secrets or env vars hardcoded in source
- [ ] Template content rendered as plain text only — never as HTML
- [ ] Service-role Supabase client not used in user-facing routes

---

## Testing

- [ ] Unit tests written for all new pure functions (Vitest)
- [ ] Integration tests cover API route happy path and key error cases (Supertest)
- [ ] E2E test covers the complete user-facing flow (Playwright) — where applicable
- [ ] All tests pass: `pnpm test`
- [ ] No snapshot tests added
- [ ] No mocking the database in integration tests — seeded test DB used

---

## Database (if schema changed)

- [ ] Migration is additive-only (no column drops, renames, or type changes)
- [ ] Migration SQL reviewed in PR before `drizzle-kit push`
- [ ] RLS policies written for any new table
- [ ] Indexes created for new `user_id`, `team_id`, and query-filtered columns
- [ ] Migration applied to staging before merge

---

## API (if new or changed endpoint)

- [ ] Endpoint documented in `doc/API.md`
- [ ] Zod schema in `lib/validations/` for request body
- [ ] Route wrapped in `withSentry()`
- [ ] Auth check at top of handler
- [ ] Plan limit check before any resource creation
- [ ] Rate limiting inherited from middleware (no action needed per-route)

---

## Observability

- [ ] Sentry error tracking instrumented on all new server-side functions
- [ ] PostHog event fired for every key user action in the feature
- [ ] Performance-critical functions wrapped in Sentry span

---

## Documentation

- [ ] New API endpoints added to `doc/API.md`
- [ ] New business rules added to `doc/LOGIC.md`
- [ ] New integration behaviour added to `doc/INTEGRATIONS.md`
- [ ] New env variables added to `.env.example` and `CLAUDE.md`
- [ ] Module README (`lib/modules/[name]/README.md`) updated if public interface changed

---

## Review & Deployment

- [ ] PR reviewed and approved by at least one other engineer
- [ ] No unresolved review comments
- [ ] Feature deployed to staging
- [ ] Staging smoke-tested manually (critical user flow exercised)
- [ ] Build passes in CI (`pnpm build` succeeds)

---

## Release Checklist (for milestone releases only)

- [ ] All DoD items above satisfied for every item in the milestone
- [ ] `pnpm build` succeeds on clean install
- [ ] Playwright E2E suite passes on staging
- [ ] All Stripe webhook handlers tested with Stripe CLI
- [ ] Database migrations applied to staging first, then production
- [ ] Vercel production deployment verified
- [ ] Post-deploy: Sentry shows no new error spike (5-minute window)
- [ ] Post-deploy: PostHog key events firing correctly
- [ ] Status page updated if any infrastructure changed