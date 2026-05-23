# Scaffold — Business Logic

> Core algorithms, rules engines, and domain logic for each module

---

## M1 — Identity & Auth Logic

### 1.1 OAuth Flow

```
1. User clicks "Sign in with GitHub"
2. Redirect to Supabase Auth OAuth handler
3. Supabase exchanges code for GitHub access token
4. Supabase creates/updates user in auth.users
5. App hook (PostHog 'user_signed_in') fires
6. If new user (created_at within 30s):
   a. Create row in public.users
   b. Redirect to /onboarding
7. If returning user:
   a. Redirect to /dashboard
```

### 1.2 Plan Check Middleware

Called before every resource-creation endpoint:

```ts
const planLimits = {
  free:   { stacks: 3, templates: 15, teamMembers: 0, decisionLog: false, apiAccess: false },
  solo:   { stacks: Infinity, templates: Infinity, teamMembers: 0, decisionLog: true, apiAccess: false },
  team:   { stacks: Infinity, templates: Infinity, teamMembers: 8, decisionLog: true, apiAccess: false },
  studio: { stacks: Infinity, templates: Infinity, teamMembers: Infinity, decisionLog: true, apiAccess: true },
} as const

async function enforcePlanLimit(userId: string, resource: keyof typeof planLimits.free) {
  const user = await getUser(userId)
  const limit = planLimits[user.plan][resource]
  if (limit === false) throw new PlanLimitError(resource, 0, 0)
  if (limit === Infinity) return  // no limit
  const current = await countUserResource(userId, resource)
  if (current >= limit) throw new PlanLimitError(resource, current, limit)
}
```

### 1.3 Team Role Hierarchy

```
owner
  └── can: everything admins can do
  └── can: transfer ownership
  └── can: delete team
  └── cannot: be removed without transferring ownership first

admin
  └── can: invite members, remove members, change roles (member ↔ admin)
  └── can: lock/unlock team stacks
  └── can: publish/unpublish team playbooks
  └── cannot: change owner role, delete team

member
  └── can: read team library, use team stacks, run team playbooks
  └── cannot: modify shared resources (unless stack is unlocked)
```

---

## M2 — Stack Logic

### 2.1 Manifest Detection

`detectFromManifest(type, content)` — parses manifest files and maps packages to known Scaffold tool IDs.

```ts
const toolSignatures: Record<string, { toolId: string; category: string }> = {
  // package.json dependencies
  'next':                 { toolId: 'nextjs',      category: 'framework' },
  '@supabase/supabase-js':{ toolId: 'supabase',    category: 'database' },
  'stripe':               { toolId: 'stripe',      category: 'payments' },
  'resend':               { toolId: 'resend',      category: 'email' },
  '@sentry/nextjs':       { toolId: 'sentry',      category: 'monitoring' },
  'posthog-js':           { toolId: 'posthog',     category: 'analytics' },
  'drizzle-orm':          { toolId: 'drizzle',     category: 'orm' },
  'prisma':               { toolId: 'prisma',      category: 'orm' },
  'react-native':         { toolId: 'reactnative', category: 'framework' },
  'expo':                 { toolId: 'expo',        category: 'framework' },
  'django':               { toolId: 'django',      category: 'framework' },
  'rails':                { toolId: 'rails',       category: 'framework' },
  // requirements.txt
  'Django':               { toolId: 'django',      category: 'framework' },
  'fastapi':              { toolId: 'fastapi',     category: 'framework' },
  // Gemfile
  'rails':                { toolId: 'rails',       category: 'framework' },
  // ... 80+ more entries
}

function detectFromManifest(type: ManifestType, content: string): DetectedTool[] {
  const deps = parseManifest(type, content)  // extract dep names
  return deps
    .map(dep => toolSignatures[dep])
    .filter(Boolean)
    .map(match => ({ ...match, version: deps.getVersion(match.toolId) }))
}
```

### 2.2 Stack Locking Logic

```
When is_locked = true:
  - Any PATCH /stacks/:id from a member → 403
  - Only admin/owner can toggle is_locked
  - Locked stacks CAN still be used for project init and playbook runs
  - Locked stacks display a lock icon in UI with owner's name

When admin unlocks:
  - Any team member can now edit tools
  - Audit log entry created (future v2)
```

---

## M3 — Playbook Logic

### 3.1 Auto-Complete on Run Start

When a run is created with a `stack_id`:

```ts
function computeAutoCompletedSteps(playbook: Playbook, stack: Stack): string[] {
  const stackToolIds = new Set(stack.tools.map(t => t.toolId))

  return playbook.steps
    .filter(step =>
      step.auto_complete_tool_id &&
      stackToolIds.has(step.auto_complete_tool_id)
    )
    .map(step => step.id)
}
```

Auto-completed steps are added to `completed_steps` at run creation. They appear checked in UI with a "✓ auto-completed by [stack name]" label.

### 3.2 Progress Calculation

```ts
function getRunProgress(run: PlaybookRun, playbook: Playbook): number {
  const requiredSteps = playbook.steps.filter(s => s.required !== false)
  if (requiredSteps.length === 0) return 100

  const completedRequired = requiredSteps.filter(s =>
    run.completed_steps.includes(s.id)
  ).length

  return Math.round((completedRequired / requiredSteps.length) * 100)
}
```

### 3.3 Playbook Completion

A run is marked `is_complete = true` when:
- All steps with `required !== false` are in `completed_steps`
- `is_complete` set to `true`, `completed_at = now()`
- Fires: PostHog event `'playbook_run_completed'`
- Fires: Inngest event `'scaffold/run-completed'` → Slack notification (Team plan)

### 3.4 Fork Logic

```ts
async function forkPlaybook(sourceId: string, userId: string, name?: string): Promise<Playbook> {
  const source = await getPlaybook(sourceId)

  // Deep copy steps with NEW UUIDs to prevent shared state
  const newSteps = source.steps.map(step => ({
    ...step,
    id: generateUUID(),  // fresh ID — not shared with source
  }))

  return createPlaybook({
    title: name ?? `${source.title} (fork)`,
    category: source.category,
    steps: newSteps,
    owner_id: userId,
    forked_from: sourceId,
    is_built_in: false,
    is_public: false,
  })
}
```

---

## M4 — Template Logic

### 4.1 Stack Compatibility Filtering

```ts
function filterByStack(templates: Template[], stack: Stack): Template[] {
  const stackToolIds = new Set(stack.tools.map(t => t.toolId))

  return templates.filter(template => {
    // Template with no compat constraints is universally compatible
    if (template.stack_compat.length === 0) return true
    // Template matches if ANY of its compat tools are in the stack
    return template.stack_compat.some(toolId => stackToolIds.has(toolId))
  })
}
```

### 4.2 Staleness Detection (Background Job)

Runs weekly (Sunday 02:00 UTC) via Inngest:

```ts
async function checkTemplateStaleness() {
  // 1. Load all templates with version pins
  const templates = await db.select().from(templatesTable)

  // 2. For each template, check latest version of each compat tool
  for (const template of templates) {
    for (const toolId of template.stack_compat) {
      const latestVersion = await fetchLatestVersion(toolId)  // npm/PyPI API
      const pinnedRange = getToolVersionRange(template, toolId)

      if (!satisfies(latestVersion, pinnedRange)) {
        // Mark stale
        await db.update(templatesTable)
          .set({ is_stale: true })
          .where(eq(templatesTable.id, template.id))

        // Queue notification for users who copied this template
        await inngest.send('scaffold/template-stale', { templateId: template.id })
      }
    }
  }
}
```

### 4.3 Copy Count Increment

`POST /templates/:id/copy` increments atomically:

```sql
UPDATE templates SET copy_count = copy_count + 1 WHERE id = $1
RETURNING copy_count;
```

No transaction needed — atomic increment is safe for this metric.

---

## M5 — Project Init Logic

### 5.1 Scaffold Generation Algorithm

```ts
async function generateScaffold(stackId: string, projectMeta: ProjectMeta): Promise<string> {
  const stack = await getStack(stackId)

  // Build file tree from template fragments
  const fileTree: Record<string, string> = {}

  // Base files (always included)
  fileTree['README.md'] = renderReadme(projectMeta, stack)
  fileTree['.env.example'] = buildEnvExample(stack)
  fileTree['.gitignore'] = getBaseGitignore()

  // Tool-specific files
  for (const tool of stack.tools) {
    const fragments = await getFragmentsForTool(tool.toolId)
    for (const fragment of fragments) {
      // Sandboxed path: only whitelisted paths allowed
      if (!isWhitelistedPath(fragment.outputPath)) continue
      fileTree[fragment.outputPath] = renderFragment(fragment.content, {
        projectName: projectMeta.name,
        tool,
        stack,
      })
    }
  }

  // Package.json assembly
  fileTree['package.json'] = buildPackageJson(stack, projectMeta)

  return await zipFiles(fileTree)
}
```

### 5.2 .env.example Generation

```ts
const envVarsByTool: Record<string, string[]> = {
  supabase:  ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  stripe:    ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  resend:    ['RESEND_API_KEY'],
  sentry:    ['SENTRY_DSN', 'NEXT_PUBLIC_SENTRY_DSN'],
  posthog:   ['NEXT_PUBLIC_POSTHOG_KEY', 'NEXT_PUBLIC_POSTHOG_HOST'],
  inngest:   ['INNGEST_EVENT_KEY', 'INNGEST_SIGNING_KEY'],
  upstash:   ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
  // ...
}

function buildEnvExample(stack: Stack): string {
  const lines = ['# Generated by Scaffold', '# Fill in values before running', '']
  for (const tool of stack.tools) {
    const vars = envVarsByTool[tool.toolId] ?? []
    if (vars.length > 0) {
      lines.push(`# ${tool.toolId}`)
      vars.forEach(v => lines.push(`${v}=`))
      lines.push('')
    }
  }
  return lines.join('\n')
}
```

### 5.3 Path Whitelist (Security)

```ts
const ALLOWED_PATHS = new Set([
  'README.md', '.env.example', '.gitignore', 'package.json',
  'tsconfig.json', 'next.config.mjs', 'tailwind.config.ts',
  '.eslintrc.json', '.prettierrc', 'postcss.config.mjs',
  'drizzle.config.ts', 'vitest.config.ts',
  'app/layout.tsx', 'app/page.tsx', 'app/globals.css',
  'middleware.ts',
  // ... finite list — no user-controlled paths
])

function isWhitelistedPath(path: string): boolean {
  // Normalize + check for traversal
  const normalized = path.replace(/\.\.\//g, '').replace(/^\/+/, '')
  return ALLOWED_PATHS.has(normalized)
}
```

---

## M6 — Decision Log Logic

### 6.1 Full-Text Search

```ts
async function searchDecisions(userId: string, query: string, teamId?: string) {
  // PostgreSQL tsvector search via Drizzle
  return db
    .select()
    .from(decisions)
    .where(
      and(
        // User's own + team decisions
        or(
          eq(decisions.userId, userId),
          teamId ? eq(decisions.teamId, teamId) : sql`false`
        ),
        // Full-text match
        query
          ? sql`search_vector @@ plainto_tsquery('english', ${query})`
          : undefined
      )
    )
    .orderBy(
      query
        ? sql`ts_rank(search_vector, plainto_tsquery('english', ${query})) DESC`
        : desc(decisions.createdAt)
    )
    .limit(50)
}
```

### 6.2 Decision Immutability

Decisions are **append-only** — no PATCH endpoint. This preserves the historical accuracy of the decision log. If a decision is superseded, the user creates a new entry referencing the old one in the `context` field.

---

## Plan Limits Engine

Central config object — single source of truth:

```ts
// lib/billing/plan-limits.ts

export type Plan = 'free' | 'solo' | 'team' | 'studio'

export const planLimits = {
  free: {
    stacks:        3,
    templates:     15,        // built-in only
    decisionLog:   false,
    teamMembers:   0,
    apiAccess:     false,
    customStack:   false,
    aiSuggestions: false,
    slackInteg:    false,
    whiteLabel:    false,
  },
  solo: {
    stacks:        Infinity,
    templates:     Infinity,
    decisionLog:   true,
    teamMembers:   0,
    apiAccess:     false,
    customStack:   true,
    aiSuggestions: true,
    slackInteg:    false,
    whiteLabel:    false,
  },
  team: {
    stacks:        Infinity,
    templates:     Infinity,
    decisionLog:   true,
    teamMembers:   8,
    apiAccess:     false,
    customStack:   true,
    aiSuggestions: true,
    slackInteg:    true,
    whiteLabel:    false,
  },
  studio: {
    stacks:        Infinity,
    templates:     Infinity,
    decisionLog:   true,
    teamMembers:   Infinity,
    apiAccess:     true,
    customStack:   true,
    aiSuggestions: true,
    slackInteg:    true,
    whiteLabel:    true,
  },
} satisfies Record<Plan, PlanLimitConfig>
```

**Rule:** This file is the only place plan limits are defined. All middleware and business logic imports from here.