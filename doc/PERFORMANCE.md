# Scaffold — Performance

> SLAs, caching strategy, optimization techniques, and monitoring

---

## 1. Performance SLAs

| Metric | Target | Alert Threshold | Measurement |
|---|---|---|---|
| API p50 response time | <150ms | >300ms for 5min | Sentry traces |
| API p99 response time | <500ms | >1s for 5min | Sentry traces |
| Time to First Byte (TTFB) | <200ms | >400ms | Vercel Analytics |
| Largest Contentful Paint (LCP) | <2.5s | >4s | Web Vitals (PostHog) |
| First Input Delay (FID) | <100ms | >300ms | Web Vitals |
| Cumulative Layout Shift (CLS) | <0.1 | >0.25 | Web Vitals |
| Template list page load | <800ms | >1.5s | Synthetic monitoring |
| Playbook step toggle | <100ms | >250ms | Sentry traces |
| Decision log search (FTS) | <200ms | >500ms | Sentry traces |
| ZIP generation (Inngest) | <30s | >60s | Inngest dashboard |
| Uptime | 99.9% | <99.5% rolling 30d | Uptime monitor |

---

## 2. Caching Strategy

### 2.1 Layer Overview

```
Request → Vercel Edge Cache → Next.js Cache → Upstash Redis → Supabase PostgreSQL
```

### 2.2 Next.js Static / Dynamic Rendering

| Route | Rendering | Cache |
|---|---|---|
| `/` (marketing pages) | Static | Vercel CDN — indefinite |
| `/templates` (public browse) | Static with revalidate | 5 min (`revalidate: 300`) |
| `/dashboard/*` | Dynamic (per-user) | No cache — SSR per request |
| `/playbooks` (built-in list) | Static with revalidate | 10 min |

```ts
// app/templates/page.tsx — ISR for public template browse
export const revalidate = 300  // 5 minutes

async function TemplatesPage() {
  const templates = await getPublicTemplates()  // cached fetch
  return <TemplateGrid templates={templates} />
}
```

### 2.3 Upstash Redis Cache

| Cache Key | TTL | Invalidated By |
|---|---|---|
| `templates:public:{category}:{page}` | 5 min | Template create/update |
| `templates:stale:ids` | 1 hour | Staleness check job |
| `playbooks:built-in` | 10 min | Admin playbook update |

```ts
// Pattern: cache-aside
async function getCached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await redis.get<T>(key)
  if (cached !== null) return cached

  const data = await fetcher()
  await redis.setex(key, ttl, JSON.stringify(data))
  return data
}
```

### 2.4 Cache Invalidation

```ts
// On template create/update: invalidate public template cache
async function invalidateTemplateCache(category?: string) {
  const pattern = category
    ? `templates:public:${category}:*`
    : 'templates:public:*'
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}
```

---

## 3. Database Query Optimization

### 3.1 Query Patterns

**Avoid N+1 queries — always join:**
```ts
// ✅ Single query with join
const runsWithPlaybooks = await db
  .select({
    run: playbook_runs,
    playbookTitle: playbooks.title,
    playbookCategory: playbooks.category,
  })
  .from(playbook_runs)
  .leftJoin(playbooks, eq(playbooks.id, playbook_runs.playbookId))
  .where(and(eq(playbook_runs.userId, userId), eq(playbook_runs.isComplete, false)))
  .limit(20)

// ❌ N+1
const runs = await getRuns(userId)
for (const run of runs) {
  run.playbook = await getPlaybook(run.playbookId)  // N queries
}
```

**Paginate always — never SELECT * without LIMIT:**
```ts
const templates = await db
  .select({ id, title, category, tags, copyCount })  // named columns only
  .from(templatesTable)
  .where(eq(templatesTable.isPublic, true))
  .limit(20)
  .offset((page - 1) * 20)
```

**Full-text search with ranking:**
```ts
// Use ts_rank for relevance ordering when query present
.orderBy(sql`ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC`)
```

### 3.2 Connection Pooling

- PgBouncer in **transaction mode** — each Vercel function gets a pooled connection
- Released immediately after query (transaction mode = connection returned on `COMMIT`/`ROLLBACK`)
- Configured via Supabase: `max_client_conn = 100`, `pool_mode = transaction`
- Per-function max: 25 connections (Supabase Pro plan limit)

### 3.3 Index Usage Verification

Run `EXPLAIN ANALYZE` on slow queries in Supabase SQL editor:
```sql
EXPLAIN ANALYZE
SELECT * FROM templates
WHERE stack_compat @> ARRAY['nextjs']::text[]
AND is_public = true
ORDER BY copy_count DESC
LIMIT 20;
-- Should show: "Bitmap Index Scan on idx_templates_compat"
```

---

## 4. Frontend Performance

### 4.1 Bundle Size

**Targets:**
- First Load JS: <120KB gzipped (Next.js 16 App Router default)
- Client components: lazy-loaded where possible
- shadcn/ui: only import components in use (tree-shaken)

**Monitoring:**
```bash
pnpm build
# Check: Route (app) | Size | First Load JS
# Flag anything >100KB First Load JS
```

### 4.2 Image Optimization

- All images via Next.js `<Image>` component — automatic WebP conversion, lazy loading
- User avatars: `width=38`, `height=38`, `loading="eager"` (above fold)
- Marketing images: `priority` prop for hero, lazy for below-fold

### 4.3 Font Loading

```tsx
// app/layout.tsx — loaded once, no per-page re-fetch
import { Syne, DM_Sans } from 'next/font/google'

const syne = Syne({ subsets: ['latin'], variable: '--font-head', weight: ['400','600','700','800'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', weight: ['300','400','500'] })
```

### 4.4 React Server Components

**Rules for RSC vs Client Components:**

| Use RSC | Use Client Component |
|---|---|
| Data fetching | State (useState) |
| DB queries | Effects (useEffect) |
| Static rendering | Browser APIs |
| Heavy compute | Event handlers |
| Access to env vars | Third-party client-only libs |

Heavy dashboard pages (template library, playbook list) use RSC for initial render. Interactive sub-components (step toggle, copy button) are extracted to small Client Components.

---

## 5. Background Job Performance

### 5.1 ZIP Generation Sizing

| Stack Size | Template Fragments | Estimated ZIP Generation Time |
|---|---|---|
| 3 tools | ~8 files | <5s (sync API response) |
| 6 tools | ~15 files | 5–15s (Inngest job) |
| 10 tools | ~25 files | 15–30s (Inngest job) |

**Decision threshold:** Stacks with >5 tools trigger async Inngest job. ≤5 tools generates synchronously in API response.

```ts
const ASYNC_THRESHOLD = 5  // tools
if (stack.tools.length > ASYNC_THRESHOLD) {
  await inngest.send('scaffold/generate', { data: { stackId, projectName, userId, jobId } })
  return NextResponse.json({ job_id: jobId, status: 'pending' }, { status: 202 })
} else {
  const zip = await generateScaffold(stackId, { name: projectName })
  // ... return 200 with download URL
}
```

### 5.2 Staleness Check Performance

Weekly cron processes potentially 120+ templates against npm/PyPI APIs:
- Parallelised with `Promise.allSettled()` in batches of 10
- npm registry: `GET https://registry.npmjs.org/{package}/latest` — cached 1h
- Rate limit: respect npm's anonymous rate limit (no API key needed for public packages)
- Max runtime: 5 minutes (Inngest function timeout)

---

## 6. Monitoring Setup

### 6.1 Sentry Performance Tracing

```ts
// Wrap slow operations with Sentry spans
const span = Sentry.startSpan({ name: 'generateScaffold', op: 'function' })
try {
  const result = await generateScaffold(stackId, meta)
  span.setStatus('ok')
  return result
} catch (err) {
  span.setStatus('error')
  throw err
} finally {
  span.end()
}
```

### 6.2 Web Vitals Reporting

```ts
// app/components/WebVitalsReporter.tsx — client component, loaded once
'use client'
import { useReportWebVitals } from 'next/web-vitals'
import posthog from 'posthog-js'

export function WebVitalsReporter() {
  useReportWebVitals(({ name, value, rating }) => {
    posthog.capture('web_vital', { metric: name, value, rating })
  })
  return null
}
```

### 6.3 Synthetic Uptime Monitoring

- Uptime Robot or BetterUptime: 1-minute checks on `https://scaffold.app/api/v1/health`
- Health endpoint: returns DB ping + Redis ping latency
- Alert: Slack #alerts if down >2min

```ts
// app/api/v1/health/route.ts
export async function GET() {
  const dbStart = Date.now()
  await db.execute(sql`SELECT 1`)
  const dbMs = Date.now() - dbStart

  const redisStart = Date.now()
  await redis.ping()
  const redisMs = Date.now() - redisStart

  return NextResponse.json({
    status: 'ok',
    db_ms: dbMs,
    redis_ms: redisMs,
    timestamp: new Date().toISOString(),
  })
}
```