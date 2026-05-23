# API Rules — Scaffold

## Route Structure

```
app/api/v1/
  auth/
    me/route.ts
    session/route.ts
    tokens/route.ts
  stacks/
    route.ts          ← GET (list), POST (create)
    [id]/route.ts     ← GET, PATCH, DELETE
    detect/route.ts   ← POST (from manifest)
  templates/
    route.ts
    [id]/route.ts
    [id]/copy/route.ts
  playbooks/
    route.ts
    [id]/route.ts
    [id]/fork/route.ts
  runs/
    route.ts
    [id]/route.ts
    [id]/steps/[stepId]/route.ts
  init/
    route.ts
    [jobId]/route.ts
  decisions/
    route.ts
    [id]/route.ts
  teams/
    route.ts
    [id]/route.ts
    [id]/invites/route.ts
    [id]/members/[userId]/route.ts
  billing/
    checkout/route.ts
    portal/route.ts
  webhooks/
    stripe/route.ts
```

## Route Handler Template

```ts
// app/api/v1/stacks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createStack } from '@/lib/modules/stacks'
import { requireAuth } from '@/lib/auth'
import { enforcePlanLimit } from '@/lib/billing/plan-limits'
import { captureEvent } from '@/lib/analytics'
import { withSentry } from '@/lib/sentry'

const CreateStackSchema = z.object({
  name: z.string().min(1).max(100),
  tools: z.array(z.object({
    category: z.string(),
    toolId: z.string(),
    version: z.string().optional(),
  })),
})

export const POST = withSentry(async (req: NextRequest) => {
  // 1. Auth
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })

  // 2. Parse + validate
  const body = await req.json()
  const parsed = CreateStackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message, code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  // 3. Plan limit check
  const limitCheck = await enforcePlanLimit(user, 'stacks')
  if (!limitCheck.allowed) {
    return NextResponse.json({
      error: 'Plan limit reached',
      code: 'PLAN_LIMIT',
      resource: 'stacks',
      current: limitCheck.current,
      max: limitCheck.max,
    }, { status: 402 })
  }

  // 4. Business logic
  const stack = await createStack({ userId: user.id, ...parsed.data })

  // 5. Analytics
  await captureEvent(user.id, 'stack_created', { stackId: stack.id })

  // 6. Response
  return NextResponse.json(stack, { status: 201 })
})
```

## Mandatory Patterns for Every Route

### Auth Check
```ts
const user = await requireAuth(req)
if (!user) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
```

### Body Validation
```ts
const parsed = SomeSchema.safeParse(await req.json())
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.message, code: 'VALIDATION_ERROR' }, { status: 400 })
}
```

### Plan Limit Check (on resource creation)
```ts
const limitCheck = await enforcePlanLimit(user, resourceType)
if (!limitCheck.allowed) {
  return NextResponse.json({ error: 'Plan limit reached', code: 'PLAN_LIMIT', ...limitCheck }, { status: 402 })
}
```

### Sentry Wrapper
All route handlers wrapped in `withSentry()` for automatic error capture.

### PostHog Event
Every key user action fires an analytics event before returning the response.

## Error Response Shapes

| Scenario | Status | Body |
|---|---|---|
| Invalid/missing body fields | 400 | `{ error: string, code: 'VALIDATION_ERROR' }` |
| No/invalid auth token | 401 | `{ error: 'Unauthorized', code: 'UNAUTHORIZED' }` |
| Accessing another user's resource | 403 | `{ error: 'Forbidden', code: 'FORBIDDEN' }` |
| Resource not found | 404 | `{ error: 'Not found', code: 'NOT_FOUND' }` |
| Plan limit exceeded | 402 | `{ error: string, code: 'PLAN_LIMIT', resource, current, max }` |
| Server error | 500 | `{ error: 'Internal server error', code: 'INTERNAL_ERROR' }` |

Never expose internal error details (stack traces, DB errors) in 500 responses.

## Rate Limiting

Implemented via Upstash Redis in Edge middleware:

```ts
// middleware.ts
const limit = user.plan === 'free' ? 100 : 500  // req/min
const { success } = await ratelimit.limit(userId)
if (!success) return new Response('Too Many Requests', { status: 429 })
```

## Webhooks

### Stripe Webhook
```ts
// MUST verify signature before any processing
const sig = req.headers.get('stripe-signature')!
const rawBody = await req.text()  // Must be raw text, not parsed JSON
const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)

// MUST check idempotency
const existing = await db.select().from(stripeEvents).where(eq(stripeEvents.id, event.id))
if (existing.length > 0) return NextResponse.json({ received: true })  // Already processed

// Process + mark as processed atomically
await db.transaction(async (tx) => {
  await processStripeEvent(tx, event)
  await tx.insert(stripeEvents).values({ id: event.id, type: event.type, processed: true })
})
```

## Versioning

- Current: `/api/v1/`
- Breaking changes increment the major version: `/api/v2/`
- Non-breaking additions (new fields in responses, new optional params): no version bump
- Document every endpoint in `doc/TRD.md` API Contracts section

## Rules Summary

1. **No business logic in route files** — import from `lib/modules/`
2. **Zod validate every request body** — no exceptions
3. **Plan limits checked before every write** — server-side only
4. **All routes wrapped in `withSentry`**
5. **All key actions fire PostHog event**
6. **Never expose DB errors in responses**
7. **Stripe webhooks: verify signature + check idempotency**
8. **New endpoints documented in TRD before merge**