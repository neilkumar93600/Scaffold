# Scaffold — Error Handling

> Error taxonomy, response shapes, client handling, and logging strategy

---

## 1. Error Taxonomy

### 1.1 Client Errors (4xx — user/request problems)

| Code | HTTP | When |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod schema failure — invalid/missing fields |
| `UNAUTHORIZED` | 401 | Missing, expired, or invalid auth token |
| `PLAN_LIMIT` | 402 | Feature or quantity limit for user's plan |
| `FORBIDDEN` | 403 | Authenticated but not owner/admin of resource |
| `NOT_FOUND` | 404 | Resource doesn't exist or RLS blocks it |
| `CONFLICT` | 409 | Duplicate resource (e.g., team invite already sent) |
| `GONE` | 410 | Presigned URL expired (scaffold download link) |
| `RATE_LIMITED` | 429 | Exceeded req/min limit for plan |

### 1.2 Server Errors (5xx — our problem)

| Code | HTTP | When |
|---|---|---|
| `INTERNAL_ERROR` | 500 | Unexpected server error — logged to Sentry |
| `SERVICE_UNAVAILABLE` | 503 | Supabase/Redis down — transient |

---

## 2. Error Response Shapes

### Standard Error
```json
{
  "error": "Human-readable description for display",
  "code": "MACHINE_READABLE_CODE"
}
```

### Validation Error (includes field details)
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "fields": {
    "name": ["Required"],
    "tools": ["Expected array, received string"]
  }
}
```

### Plan Limit Error
```json
{
  "error": "Stack limit reached on Free plan",
  "code": "PLAN_LIMIT",
  "resource": "stacks",
  "current": 3,
  "max": 3,
  "upgrade_url": "https://scaffold.app/billing"
}
```

### Rate Limit Error
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "retry_after": 14
}
```
With headers: `Retry-After: 14`, `X-RateLimit-Reset: 1700000060`

---

## 3. Error Classes

```ts
// lib/errors.ts

export class ScaffoldError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly extra?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ScaffoldError'
  }

  toResponse() {
    return { error: this.message, code: this.code, ...this.extra }
  }
}

export class ValidationError extends ScaffoldError {
  constructor(fields: Record<string, string[]>) {
    super('VALIDATION_ERROR', 'Validation failed', 400, { fields })
  }
}

export class UnauthorizedError extends ScaffoldError {
  constructor() {
    super('UNAUTHORIZED', 'Unauthorized', 401)
  }
}

export class PlanLimitError extends ScaffoldError {
  constructor(resource: string, current: number, max: number) {
    super('PLAN_LIMIT', `${resource} limit reached`, 402, {
      resource, current, max,
      upgrade_url: 'https://scaffold.app/billing',
    })
  }
}

export class ForbiddenError extends ScaffoldError {
  constructor(action?: string) {
    super('FORBIDDEN', action ?? 'Forbidden', 403)
  }
}

export class NotFoundError extends ScaffoldError {
  constructor(resource?: string) {
    super('NOT_FOUND', resource ? `${resource} not found` : 'Not found', 404)
  }
}

export class ConflictError extends ScaffoldError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
  }
}

export class RateLimitError extends ScaffoldError {
  constructor(retryAfter: number) {
    super('RATE_LIMITED', 'Too many requests', 429, { retry_after: retryAfter })
  }
}
```

---

## 4. withSentry Route Handler

All API routes use `withSentry` wrapper which:
1. Catches `ScaffoldError` subclasses → returns correct status + code
2. Catches unexpected errors → logs to Sentry + returns 500
3. Sets user context on Sentry scope

```ts
// lib/sentry.ts
export function withSentry(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    return Sentry.withScope(async (scope) => {
      try {
        const user = await getUserFromRequest(req).catch(() => null)
        if (user) scope.setUser({ id: user.id, plan: user.plan })
        scope.setTag('route', req.nextUrl.pathname)
        scope.setTag('method', req.method)

        return await handler(req, ctx)

      } catch (err) {
        if (err instanceof ScaffoldError) {
          // Known error — return structured response, don't log to Sentry
          return NextResponse.json(err.toResponse(), {
            status: err.status,
            headers: err instanceof RateLimitError
              ? { 'Retry-After': String(err.extra?.retry_after) }
              : {},
          })
        }

        // Unknown error — log to Sentry
        Sentry.captureException(err, { tags: { route: req.nextUrl.pathname } })

        return NextResponse.json(
          { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        )
      }
    })
  }
}
```

---

## 5. Client-Side Error Handling

### API fetch wrapper
```ts
// lib/api-client.ts
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly data?: Record<string, unknown>
  ) {
    super(message)
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(body.code ?? 'UNKNOWN', body.error ?? 'Request failed', res.status, body)
  }

  return res.json()
}
```

### Plan Limit UI handling
```ts
try {
  await createStack(input)
} catch (err) {
  if (err instanceof ApiError && err.code === 'PLAN_LIMIT') {
    // Show upgrade modal with context
    openUpgradeModal({
      reason: `You've reached the ${err.data?.max} stack limit on the Free plan.`,
      upgradeUrl: err.data?.upgrade_url as string,
    })
    return
  }
  // Other errors: show toast
  toast.error(err.message)
}
```

### Toast notifications (Sonner)
```ts
// Consistent toast patterns
toast.success('Stack saved')
toast.error('Failed to save stack — please try again')
toast.info('Template copied to clipboard')
toast.warning('This template may be outdated')
```

---

## 6. Logging Strategy

### What Gets Logged (Sentry)
- All unexpected server errors (5xx)
- Stripe webhook failures (with event ID for replay)
- ZIP generation failures
- Auth errors (JWT issues, unusual patterns)

### What Does NOT Get Logged
- Plan limit errors (expected, not a bug)
- Validation errors (user error, not a bug)
- 404 errors from client navigation
- PII: email addresses, tokens, stack content

### Sentry Filtering
```ts
Sentry.init({
  beforeSend(event) {
    // Strip user email
    if (event.user?.email) delete event.user.email

    // Don't log expected errors
    if (event.exception?.values?.[0]?.type === 'ScaffoldError') return null

    return event
  }
})
```

---

## 7. Error Monitoring Alerts

| Condition | Alert | Channel |
|---|---|---|
| New error type (first occurrence) | Sentry issue created | Slack #engineering |
| Error rate spike (>10 in 5min) | Sentry alert | Slack #alerts |
| Any Stripe webhook error | Immediate | PagerDuty |
| Inngest function failed 3× | Inngest alert | Slack #alerts |
| 500 error on auth endpoints | Immediate | Slack #alerts |