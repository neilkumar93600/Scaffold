# Scaffold — Hooks & Libraries

> Custom React hooks, utility libraries, and shared helpers

---

## Custom React Hooks

### useStack
```ts
// hooks/use-stack.ts
// Manage current user's stacks — fetch, create, switch active
'use client'
import { useState, useCallback } from 'react'

export function useStack() {
  const [stacks, setStacks] = useState<Stack[]>([])
  const [activeStack, setActiveStack] = useState<Stack | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStacks = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/v1/stacks')
    const data = await res.json()
    setStacks(data)
    setLoading(false)
  }, [])

  const createStack = useCallback(async (input: CreateStackInput) => {
    const res = await fetch('/api/v1/stacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const err = await res.json()
      if (err.code === 'PLAN_LIMIT') throw new PlanLimitError(err)
      throw new Error(err.error)
    }
    const stack = await res.json()
    setStacks(prev => [stack, ...prev])
    return stack
  }, [])

  return { stacks, activeStack, setActiveStack, fetchStacks, createStack, loading }
}
```

---

### usePlaybookRun
```ts
// hooks/use-playbook-run.ts
// Track run progress and toggle steps with optimistic updates
'use client'

export function usePlaybookRun(runId: string) {
  const [run, setRun] = useState<PlaybookRun | null>(null)
  const [optimisticSteps, setOptimisticSteps] = useState<Set<string>>(new Set())

  const toggleStep = useCallback(async (stepId: string) => {
    const isCompleted = run?.completed_steps.includes(stepId)

    // Optimistic update
    setOptimisticSteps(prev => {
      const next = new Set(prev)
      isCompleted ? next.delete(stepId) : next.add(stepId)
      return next
    })

    try {
      const res = await fetch(`/api/v1/runs/${runId}/steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !isCompleted }),
      })
      const updated = await res.json()
      setRun(updated)
      setOptimisticSteps(new Set())  // clear optimistic; use server state
    } catch {
      // Rollback optimistic update on error
      setOptimisticSteps(new Set())
    }
  }, [run, runId])

  const progress = useMemo(() => {
    if (!run || !run.totalSteps) return 0
    const completed = new Set([...run.completed_steps, ...optimisticSteps])
    return Math.round((completed.size / run.totalSteps) * 100)
  }, [run, optimisticSteps])

  return { run, toggleStep, progress, loading: !run }
}
```

---

### useTemplateSearch
```ts
// hooks/use-template-search.ts
// Debounced template search with stack filtering
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './use-debounce'

export function useTemplateSearch(initialCategory?: string) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(initialCategory ?? 'all')
  const [stackId, setStackId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set('search', debouncedQuery)
    if (category !== 'all') params.set('category', category)
    if (stackId) params.set('stack_id', stackId)

    setLoading(true)
    fetch(`/api/v1/templates?${params}`)
      .then(r => r.json())
      .then(d => { setTemplates(d.data); setLoading(false) })
  }, [debouncedQuery, category, stackId])

  return { query, setQuery, category, setCategory, stackId, setStackId, templates, loading }
}
```

---

### usePlanLimit
```ts
// hooks/use-plan-limit.ts
// Check plan limits and show upgrade prompts
'use client'

export function usePlanLimit() {
  const { user } = useUser()

  const isFeatureAllowed = useCallback((feature: keyof PlanLimitConfig): boolean => {
    if (!user) return false
    const limit = planLimits[user.plan][feature]
    return limit !== false && limit !== 0
  }, [user])

  const getUpgradeReason = useCallback((feature: keyof PlanLimitConfig): string => {
    const featureLabels: Record<string, string> = {
      decisionLog: 'Decision Log',
      teamMembers: 'Team Library',
      apiAccess: 'API Access',
    }
    return `${featureLabels[feature] ?? feature} requires a paid plan`
  }, [])

  return { isFeatureAllowed, getUpgradeReason, plan: user?.plan ?? 'free' }
}
```

---

### useDebounce
```ts
// hooks/use-debounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
```

---

### useMobile
```ts
// hooks/use-mobile.ts
// Already present in project — detects mobile viewport
import { useState, useEffect } from 'react'

export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
```

---

## Utility Libraries

### cn (className helper)
```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### planLimits
```ts
// lib/billing/plan-limits.ts
// Single source of truth for all plan feature limits
// See LOGIC.md for full definition
export const planLimits = { ... }
export function assertPlanAllows(user, resource) { ... }
export class PlanLimitError extends Error { ... }
```

---

### withSentry (API route wrapper)
```ts
// lib/sentry.ts
export function withSentry(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    return Sentry.withScope(async (scope) => {
      const user = await getUserFromRequest(req)
      if (user) scope.setUser({ id: user.id, plan: user.plan })
      scope.setTag('route', req.nextUrl.pathname)
      try {
        return await handler(req, ctx)
      } catch (err) {
        if (err instanceof PlanLimitError) {
          return NextResponse.json(err.toResponse(), { status: 402 })
        }
        Sentry.captureException(err)
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

### requireAuth
```ts
// lib/auth.ts
export async function requireAuth(req: NextRequest): Promise<User> {
  const supabase = createSupabaseServer()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user || error) {
    throw new UnauthorizedError()
  }

  const dbUser = await getUserById(user.id)
  if (!dbUser) throw new UnauthorizedError()

  return dbUser
}
```

---

### captureEvent (PostHog)
```ts
// lib/analytics.ts
import { PostHog } from 'posthog-node'
const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!)

export async function captureEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  posthog.capture({
    distinctId: userId,
    event,
    properties: {
      ...properties,
      $source: 'server',
    },
  })
  // Fire and forget — don't await
}
```

---

## Key Third-Party Libraries

| Library | Version | Purpose | Docs |
|---|---|---|---|
| `next` | 16.x | App framework | nextjs.org |
| `react` | 19.x | UI layer | react.dev |
| `@supabase/supabase-js` | 2.x | DB + Auth + Storage client | supabase.com/docs |
| `@supabase/ssr` | Latest | SSR-compatible Supabase client | supabase.com/docs/guides/auth/server-side |
| `drizzle-orm` | Latest | Type-safe ORM | orm.drizzle.team |
| `drizzle-kit` | Latest | Migration CLI | orm.drizzle.team/kit-docs |
| `zod` | 3.x | Schema validation | zod.dev |
| `stripe` | Latest | Stripe Node SDK | stripe.com/docs/api |
| `@stripe/stripe-js` | Latest | Stripe browser SDK | stripe.com/docs/js |
| `resend` | Latest | Email sending | resend.com/docs |
| `inngest` | Latest | Background jobs | inngest.com/docs |
| `@upstash/redis` | Latest | Redis client | upstash.com/docs/redis |
| `@upstash/ratelimit` | Latest | Rate limiting | upstash.com/docs/ratelimit |
| `@sentry/nextjs` | Latest | Error monitoring | docs.sentry.io/platforms/javascript/guides/nextjs |
| `posthog-node` | Latest | Server-side analytics | posthog.com/docs/libraries/node |
| `posthog-js` | Latest | Client-side analytics | posthog.com/docs/libraries/js |
| `tailwindcss` | 4.x | Utility CSS | tailwindcss.com |
| `clsx` | Latest | Conditional classnames | github.com/lukeed/clsx |
| `tailwind-merge` | Latest | Merge Tailwind classes | github.com/nicolo-ribaudo/tailwind-merge |
| `lucide-react` | Latest | Icon library | lucide.dev |
| `sonner` | Latest | Toast notifications | sonner.emilkowal.ski |
| `date-fns` | 4.x | Date utilities | date-fns.io |
| `vitest` | Latest | Unit testing | vitest.dev |
| `@playwright/test` | Latest | E2E testing | playwright.dev |