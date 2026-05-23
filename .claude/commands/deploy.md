# Command: deploy

## Usage
```
/deploy [staging|production]
```

## What It Does
Runs pre-deploy checklist, applies DB migrations, and triggers the appropriate Vercel deployment.

## Pre-Deploy Checklist

### Code Quality
```bash
pnpm lint          # Must pass — zero errors
pnpm typecheck     # Must pass — zero errors
pnpm test          # Must pass — all unit + integration tests green
```

### Database Migrations
```bash
# Review pending migrations
pnpm db:generate   # Only if schema changes in this deploy

# IMPORTANT: Review migration SQL before applying
# Migrations must be additive-only (v1 policy):
# - No column drops
# - No column renames
# - No table drops
pnpm db:push       # Apply to target environment
```

### Environment Variables
Confirm all required env vars are set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`
- `NEXT_PUBLIC_POSTHOG_KEY`

## Deploy to Staging

```bash
# Merge to main triggers staging auto-deploy via GitHub Actions
# Playwright E2E suite runs against staging automatically

# To manually trigger staging:
vercel --target staging
```

### Staging Smoke Test
After staging deploy, manually verify:
- [ ] Sign in with GitHub OAuth
- [ ] Create a stack
- [ ] Browse templates
- [ ] Start a playbook run
- [ ] Check a step
- [ ] Upgrade plan flow (Stripe test mode)

## Promote to Production

**Only after staging E2E passes.**

```bash
# Manual trigger in GitHub Actions: "Promote to Production"
# OR:
vercel --prod
```

### Post-Production Verification
- [ ] Check Sentry — no new error spike
- [ ] Check PostHog — key events firing
- [ ] Check Stripe dashboard — webhooks delivering
- [ ] Check Inngest dashboard — background jobs running

## Rollback

### Code Rollback
```bash
# Vercel instant rollback to previous deployment
vercel rollback
```

### Database Rollback
- Restore from Supabase PITR (Point-in-Time Recovery) snapshot taken before migration
- Never attempt to write a "reverse migration" manually for a failed production migration

## Rules
- Never deploy directly to production without staging verification
- Never skip the pre-deploy checklist
- Never push migrations to production without first applying to staging
- If any pre-deploy check fails, do NOT deploy — fix the issue first
- Document every production deploy in the team Slack channel