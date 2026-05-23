# Scaffold — Deployment & Infrastructure

> Environments, CI/CD pipeline, migrations, rollback, and ops runbook

---

## 1. Environments

| Environment | URL | Purpose | DB | Deploy Trigger |
|---|---|---|---|---|
| Local | `localhost:3000` | Development | Supabase local / Docker | Manual `pnpm dev` |
| Preview | `*.vercel.app` (auto) | PR review | Supabase staging | Every PR open/push |
| Staging | `staging.scaffold.app` | Pre-prod validation | Supabase staging | Merge to `main` |
| Production | `scaffold.app` | Live traffic | Supabase production | Manual promotion |

### Environment Variables per Environment

| Variable | Local | Preview | Staging | Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | localhost | staging project | staging project | prod project |
| Stripe keys | test mode | test mode | test mode | live mode |
| `INNGEST_EVENT_KEY` | dev key | staging key | staging key | prod key |
| `SENTRY_DSN` | (optional) | staging DSN | staging DSN | prod DSN |

---

## 2. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }

      - run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm typecheck

      - name: Lint
        run: pnpm lint

      - name: Unit + Integration tests
        run: pnpm test --run
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}

      - name: Build
        run: pnpm build

  e2e:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'  # Only on merge to main
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm test:e2e
        env:
          E2E_BASE_URL: https://staging.scaffold.app

  # Vercel deploys automatically via Vercel GitHub integration
  # Preview: every PR → vercel.app URL
  # Production staging: every merge to main → staging.scaffold.app
```

---

## 3. Database Migration Workflow

### Step-by-Step

```bash
# 1. Make schema changes in db/schema/
# 2. Generate migration SQL
pnpm db:generate
# Output: db/migrations/0004_add_pending_invites.sql

# 3. REVIEW the generated SQL
# Confirm: additive-only, no drops, no renames
cat db/migrations/0004_add_pending_invites.sql

# 4. Apply to staging first
DATABASE_URL=$STAGING_DB_URL pnpm db:push

# 5. Run integration tests against staging
pnpm test:integration

# 6. Apply to production (BEFORE code deploy)
DATABASE_URL=$PROD_DB_URL pnpm db:push

# 7. Deploy code (Vercel production promotion)
```

### Migration Checklist

- [ ] SQL reviewed for additive-only compliance
- [ ] New tables have RLS enabled
- [ ] New tables have appropriate indexes
- [ ] Applied to staging first
- [ ] Integration tests pass on staging
- [ ] Applied to production before code deploy

---

## 4. Production Deployment

### Promote to Production (GitHub Actions Manual Trigger)

```yaml
# .github/workflows/promote.yml
name: Promote to Production

on:
  workflow_dispatch:  # Manual only
    inputs:
      confirm:
        description: 'Type DEPLOY to confirm'
        required: true

jobs:
  promote:
    if: github.event.inputs.confirm == 'DEPLOY'
    runs-on: ubuntu-latest
    steps:
      - name: Verify staging E2E passes
        run: curl -f https://staging.scaffold.app/api/v1/health

      - name: Apply DB migrations to production
        run: pnpm db:push
        env:
          DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}

      - name: Deploy to Vercel production
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### Post-Deploy Verification (5 minutes)

```bash
# 1. Health check
curl https://scaffold.app/api/v1/health
# Expected: { "status": "ok", "db_ms": <200, "redis_ms": <50 }

# 2. Sentry — no new error spike
# Open Sentry dashboard: 0 new errors in last 5 min

# 3. PostHog — events firing
# Check: user_signed_in, template_copied events flowing

# 4. Stripe webhook — delivering
# Stripe dashboard → Webhooks → Last delivery < 1 min ago

# 5. Inngest — jobs running
# Inngest dashboard → 0 failed functions
```

---

## 5. Rollback Procedures

### Code Rollback (Instant)

```bash
# Vercel instant rollback — no downtime
vercel rollback --token $VERCEL_TOKEN
# Rolls back to previous Vercel deployment (1-click in dashboard too)
```

### Database Rollback

**Never write a "reverse migration" manually.** Use Supabase PITR (Point-in-Time Recovery):

```
1. Identify the timestamp before the bad migration
2. Supabase Dashboard → Project Settings → Database → Point-in-Time Recovery
3. Restore to timestamp T-5min
4. Verify data integrity
5. Code is already rolled back via Vercel rollback
```

**Supabase Pro plan**: PITR enabled by default. 7-day recovery window.

---

## 6. Scaling Triggers

| Metric | Current Setup | Scale Trigger | Action |
|---|---|---|---|
| API requests | Vercel auto-scale | N/A (auto) | Upgrade Vercel plan if function concurrency limits hit |
| DB connections | Supabase Pro (25 pooled) | >20 avg connections | Upgrade Supabase plan or add read replicas |
| Redis operations | Upstash pay-per-request | Cost >$100/mo | Review cache TTLs; upgrade plan |
| ZIP generation | Inngest background | >100 concurrent jobs | Inngest scales automatically |
| Email sends | Resend | >10K/day | Upgrade Resend plan |

---

## 7. Monitoring Runbook

### Alerts and Responses

| Alert | Source | Response |
|---|---|---|
| Health check DOWN | Uptime monitor | Check Supabase status; check Vercel status; post to status page |
| Error spike (>10 in 5min) | Sentry | Check Sentry for error type; hotfix if user-facing |
| API p99 >1s | Sentry | Check for slow queries in Supabase dashboard; check Redis hit rate |
| Stripe webhook 4xx/5xx | PagerDuty | Check signature; check event processing; replay via Stripe dashboard |
| ZIP job failure >3× | Inngest | Check Inngest function logs; identify root cause; replay job |
| DB connection pool exhausted | Supabase logs | Check for long-running transactions; connection leak in code |

### Status Page

`status.scaffold.app` — lists status of:
- API (scaffold.app)
- Database (Supabase)
- Background jobs (Inngest)
- Email (Resend)

Update manually on incidents via Atlassian Statuspage or similar.

---

## 8. Local Development Setup

```bash
# Prerequisites: Node 20+, pnpm, Supabase CLI

# 1. Clone repo
git clone https://github.com/[org]/scaffold
cd scaffold

# 2. Install dependencies
pnpm install

# 3. Start Supabase locally
supabase start
# Outputs: local DB URL, anon key, service role key

# 4. Copy env template
cp .env.example .env.local
# Fill in Supabase local values + Stripe test keys + other services

# 5. Apply DB migrations
pnpm db:push

# 6. Seed development data
pnpm db:seed

# 7. Start dev server
pnpm dev
# App at http://localhost:3000
# Supabase Studio at http://localhost:54323
```