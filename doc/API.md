# Scaffold — API Reference

> Complete endpoint contracts for all `/api/v1/` routes
> Base URL: `https://scaffold.app/api/v1`
> Auth: `Authorization: Bearer <token>`
> Content-Type: `application/json`

---

## Global Conventions

### Request Format
All mutation endpoints (POST, PUT, PATCH) expect JSON body.
Query parameters for GET endpoints (filters, search, pagination).

### Response Format

**Success:**
```json
{ "data": { ... } }
// or for lists:
{ "data": [...], "meta": { "total": 42, "page": 1, "limit": 20 } }
```

**Error:**
```json
{ "error": "Human-readable description", "code": "MACHINE_CODE" }
```

### Error Codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod schema failure — invalid/missing fields |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT/API token |
| 402 | `PLAN_LIMIT` | Plan feature/quantity limit reached |
| 403 | `FORBIDDEN` | Authenticated but not owner/admin of resource |
| 404 | `NOT_FOUND` | Resource does not exist or RLS blocks it |
| 409 | `CONFLICT` | Duplicate (e.g., email already registered) |
| 429 | `RATE_LIMITED` | Exceeded req/min limit |
| 500 | `INTERNAL_ERROR` | Unexpected server error (full trace in Sentry) |

### Plan Limit Error Shape
```json
{
  "error": "Project limit reached on Free plan",
  "code": "PLAN_LIMIT",
  "resource": "stacks",
  "current": 3,
  "max": 3,
  "upgrade_url": "https://scaffold.app/billing"
}
```

### Pagination (list endpoints)
```
GET /api/v1/templates?page=2&limit=20&category=auth&tags[]=nextjs
```
Default: `page=1`, `limit=20`. Max `limit=100`.

---

## Auth Endpoints

### GET /auth/me
Returns current authenticated user.

**Auth:** Required

**Response 200:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Alex",
  "avatar_url": "https://...",
  "plan": "solo",
  "plan_expires_at": null,
  "onboarding_done": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### DELETE /auth/session
Logout — invalidates current session.

**Auth:** Required
**Response:** 204 No Content

---

### POST /auth/tokens
Generate CLI API token. Shown plaintext **once** — stored as SHA-256 hash.

**Auth:** Required
**Response 201:**
```json
{
  "id": "uuid",
  "token": "scaf_live_xxxxxxxxxxxxxxxxxxxxxxxx",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### GET /auth/tokens
List active CLI tokens (IDs only — no plaintext token retrieval).

**Auth:** Required
**Response 200:**
```json
[{ "id": "uuid", "last_used_at": "2025-01-01T00:00:00Z", "created_at": "..." }]
```

---

### DELETE /auth/tokens/:id
Revoke a CLI token.

**Auth:** Required
**Response:** 204

---

## Stacks Endpoints

### GET /stacks
List user's stacks.

**Auth:** Required
**Query:** `?team_id=uuid` to filter team stacks

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Next.js SaaS",
    "description": "My standard SaaS stack",
    "is_locked": false,
    "team_id": null,
    "tools": [
      { "category": "framework", "toolId": "nextjs", "version": "16.x" },
      { "category": "database",  "toolId": "supabase", "version": "2.x" }
    ],
    "created_at": "...",
    "updated_at": "..."
  }
]
```

---

### POST /stacks
Create a new stack.

**Auth:** Required
**Plan check:** Free → max 3 stacks

**Request body:**
```json
{
  "name": "Next.js SaaS",
  "description": "optional",
  "team_id": "uuid | null",
  "tools": [
    { "category": "framework", "toolId": "nextjs", "version": "16.x", "config": {} }
  ]
}
```

**Validation:**
- `name`: string, 1–100 chars, required
- `tools`: array, each item must have `category` and `toolId`; `toolId` must be in known tools registry
- `team_id`: if provided, requester must be team member

**Response 201:** Created stack object
**Response 402:** Plan limit reached

---

### GET /stacks/:id
**Auth:** Required
**Response 200:** Stack object or 404

---

### PATCH /stacks/:id
Update name, description, tools. Locked stacks return 403.

**Auth:** Required (owner or team admin/owner)
**Request body:** Partial stack fields

**Response 200:** Updated stack

---

### DELETE /stacks/:id
**Auth:** Required (owner only)
**Constraint:** Cannot delete if active `playbook_runs` reference this stack
**Response 204** or **409** if active runs exist

---

### POST /stacks/detect
Parse a manifest file to detect tools.

**Auth:** Required
**Request body:**
```json
{
  "type": "package.json | requirements.txt | Gemfile | go.mod",
  "content": "{ \"dependencies\": { \"next\": \"^16.0.0\" } }"
}
```

**Response 200:**
```json
{
  "detected": [
    { "category": "framework", "toolId": "nextjs", "version": "^16.0.0" },
    { "category": "database",  "toolId": "supabase", "version": "^2.0.0" }
  ],
  "unrecognized": ["some-unknown-package"]
}
```

---

## Templates Endpoints

### GET /templates
Browse template library. Public endpoint — auth optional.

**Auth:** Optional (auth unlocks plan-gated templates)
**Query params:**
- `category`: `auth | payments | email | ci-cd | monitoring | legal | ...`
- `tags[]`: filter by tag (e.g., `?tags[]=nextjs&tags[]=stripe`)
- `stack_id`: filter by compatibility with a stack's tools
- `search`: keyword search (title + tags)
- `is_public`: `true | false`
- `page`, `limit`

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Next.js Auth (Clerk)",
      "category": "auth",
      "tags": ["nextjs", "clerk"],
      "stack_compat": ["nextjs", "clerk"],
      "version": "1.2.0",
      "is_stale": false,
      "copy_count": 847,
      "owner_id": null,
      "created_at": "..."
    }
  ],
  "meta": { "total": 120, "page": 1, "limit": 20 }
}
```

**Note:** `content` field is NOT returned in list view — only in single-template GET.

---

### GET /templates/:id
Get full template including content.

**Auth:** Optional (required for private templates)
**Response 200:**
```json
{
  "id": "uuid",
  "title": "...",
  "content": "// Full template code as plain text...",
  "category": "auth",
  "tags": [...],
  "stack_compat": [...],
  "version": "1.2.0",
  "is_stale": false,
  "copy_count": 847
}
```

---

### POST /templates
Create a personal or team template.

**Auth:** Required
**Plan check:** Solo+ required for custom templates

**Request body:**
```json
{
  "title": "My Stripe Setup",
  "description": "optional",
  "category": "payments",
  "tags": ["stripe", "nextjs"],
  "stack_compat": ["stripe", "nextjs"],
  "content": "// template code as plain text",
  "is_public": false,
  "team_id": "uuid | null"
}
```

**Response 201:** Template object (without content)

---

### PATCH /templates/:id
**Auth:** Required (owner or team admin)
**Request body:** Partial template fields
**Response 200:** Updated template

---

### DELETE /templates/:id
**Auth:** Required (owner only; cannot delete built-in templates)
**Response 204**

---

### POST /templates/:id/copy
Increment copy count. Signals user copied template to clipboard.

**Auth:** Required
**Request body:** `{}` (empty)
**Response 200:** `{ "copy_count": 848 }`

---

## Playbooks Endpoints

### GET /playbooks
List available playbooks.

**Auth:** Optional
**Query:** `?category=mvp&built_in=true`
**Response 200:** Array of playbook objects (without `steps` content for list performance)

---

### GET /playbooks/:id
**Auth:** Optional (required for private playbooks)
**Response 200:** Full playbook with `steps` array

---

### POST /playbooks
Create or fork a playbook.

**Auth:** Required
**Request body:**
```json
{
  "title": "My SaaS Checklist",
  "description": "optional",
  "category": "mvp",
  "is_public": false,
  "team_id": "uuid | null",
  "steps": [
    {
      "id": "step-uuid",
      "title": "Configure Stripe",
      "description": "Add Stripe keys to .env",
      "auto_complete_tool_id": "stripe",
      "required": true
    }
  ]
}
```

**Response 201:** Playbook object

---

### POST /playbooks/:id/fork
Deep copy a playbook into user's personal library.

**Auth:** Required
**Request body:** `{ "name": "optional override name" }`
**Response 201:** New playbook with `forked_from` set to source `id`

---

### PATCH /playbooks/:id
Update title, description, steps. Built-in playbooks are read-only.

**Auth:** Required (owner or team admin)
**Response 200:** Updated playbook

---

### DELETE /playbooks/:id
**Auth:** Required (owner only; cannot delete built-in)
**Constraint:** Cannot delete if active `playbook_runs` reference it
**Response 204**

---

## Playbook Runs Endpoints

### GET /runs
List active (incomplete) runs for current user.

**Auth:** Required
**Query:** `?is_complete=false&page=1&limit=20`
**Response 200:** Array of run objects with computed `progress` percent

---

### GET /runs/:id
**Auth:** Required
**Response 200:**
```json
{
  "id": "uuid",
  "playbook_id": "uuid",
  "project_name": "My Startup",
  "stack_id": "uuid",
  "completed_steps": ["step-1", "step-2"],
  "due_date": "2025-03-01",
  "is_complete": false,
  "progress": 25,
  "auto_completed_steps": ["step-3"],
  "created_at": "..."
}
```

---

### POST /runs
Start a new playbook run.

**Auth:** Required
**Request body:**
```json
{
  "playbook_id": "uuid",
  "project_name": "My New SaaS",
  "stack_id": "uuid | null",
  "due_date": "2025-03-01 | null"
}
```

**Logic:** On creation, `completed_steps` is auto-populated with step IDs where `auto_complete_tool_id` matches a tool in the linked stack.

**Response 201:** Run object with `auto_completed_steps` list

---

### PATCH /runs/:id/steps/:stepId
Toggle a step complete/incomplete.

**Auth:** Required (run owner)
**Request body:** `{ "completed": true }`
**Response 200:** Updated run with new `completed_steps` array and `progress`

**Side effect:** If all required steps complete → sets `is_complete = true`, `completed_at = now()`, fires PostHog event + Slack notification (Team plan).

---

### PATCH /runs/:id
Update due date or project name.

**Auth:** Required
**Request body:** `{ "due_date": "2025-04-01", "project_name": "..." }`
**Response 200:** Updated run

---

### DELETE /runs/:id
**Auth:** Required
**Response 204**

---

## Project Init Endpoints

### POST /init
Trigger asynchronous scaffold ZIP generation.

**Auth:** Required
**Request body:**
```json
{
  "stack_id": "uuid",
  "project_name": "my-saas",
  "description": "optional project description"
}
```

**Response 202:**
```json
{ "job_id": "uuid", "status": "pending" }
```

---

### GET /init/:jobId
Poll job status.

**Auth:** Required
**Response 200 (pending):**
```json
{ "status": "pending", "progress_message": "Assembling templates..." }
```

**Response 200 (complete):**
```json
{
  "status": "complete",
  "download_url": "https://storage.supabase.co/...",
  "expires_at": "2025-01-03T00:00:00Z"
}
```

**Response 200 (failed):**
```json
{ "status": "failed", "error": "Stack not found" }
```

---

## Decisions Endpoints

### GET /decisions
List decisions (personal + team).

**Auth:** Required (Solo+ plan required — 402 if Free)
**Query:** `?q=postgres&stack_id=uuid&page=1&limit=20`

Full-text search via PostgreSQL `tsvector` on `q` param. Sorted by relevance when `q` present, otherwise `created_at DESC`.

**Response 200:** Array of decision objects (without full text for list performance)

---

### POST /decisions
**Auth:** Required (Solo+ plan)
**Request body:**
```json
{
  "title": "PostgreSQL over MongoDB",
  "context": "Needed relational model for team membership and plan limits...",
  "chosen": "PostgreSQL via Supabase",
  "alternatives": "MongoDB Atlas, PlanetScale",
  "rationale": "RLS built-in, relational model fits bounded domains...",
  "stack_id": "uuid | null",
  "tags": ["database", "infrastructure"],
  "team_id": "uuid | null"
}
```

**Response 201:** Decision object

---

### GET /decisions/:id
**Auth:** Required
**Response 200:** Full decision object

---

### DELETE /decisions/:id
**Auth:** Required (owner only — decisions are immutable; deletion is the only mutation)
**Response 204**

---

## Teams Endpoints

### POST /teams
Create a new team. Creates team + sets requester as owner in `team_members`.

**Auth:** Required
**Plan check:** Team or Studio plan required on the creating user

**Request body:**
```json
{ "name": "Formly Engineering" }
```

**Response 201:** Team object

---

### GET /teams/:id
Get team details + members list.

**Auth:** Required (team member only)
**Response 200:**
```json
{
  "id": "uuid",
  "name": "Formly Engineering",
  "plan": "team",
  "max_members": 8,
  "members": [
    { "user_id": "uuid", "name": "Mia", "role": "owner", "joined_at": "..." }
  ]
}
```

---

### POST /teams/:id/invites
Send invite email to a new member.

**Auth:** Required (admin or owner)
**Request body:**
```json
{ "email": "dev@company.com", "role": "member" }
```

**Plan check:** If `member_count >= max_members` → 402 with upgrade prompt

**Response 201:** `{ "invite_id": "uuid", "expires_at": "..." }`

---

### GET /teams/:id/invites/:token
Accept an invite (called from email link).

**Auth:** Required (new user must sign up first)
**Response 200:** User added to team, returns team object

---

### DELETE /teams/:id/invites/:inviteId
Revoke pending invite.

**Auth:** Required (admin or owner)
**Response 204**

---

### PATCH /teams/:id/members/:userId
Change a member's role.

**Auth:** Required (owner only for owner changes; admin for member → admin)
**Request body:** `{ "role": "admin | member" }`
**Response 200:** Updated member record

---

### DELETE /teams/:id/members/:userId
Remove member from team.

**Auth:** Required (admin/owner; cannot remove owner)
**Response 204**

---

## Billing Endpoints

### POST /billing/checkout
Create Stripe Checkout session for plan upgrade.

**Auth:** Required
**Request body:**
```json
{
  "plan": "solo | team | studio",
  "interval": "monthly | annual",
  "team_id": "uuid | null"
}
```

**Response 200:** `{ "url": "https://checkout.stripe.com/..." }`

---

### POST /billing/portal
Generate Stripe Billing Portal session (manage subscription, cancel, invoices).

**Auth:** Required (must have `stripe_customer_id`)
**Request body:** `{ "return_url": "https://scaffold.app/dashboard" }`
**Response 200:** `{ "url": "https://billing.stripe.com/..." }`

---

## Webhook Endpoints

### POST /webhooks/stripe
Receives Stripe events. **No auth header** — verified via Stripe signature.

**Headers required:** `stripe-signature`
**Body:** Raw (not parsed) JSON

**Events handled:**
- `checkout.session.completed` → activate plan
- `customer.subscription.updated` → sync plan changes
- `customer.subscription.deleted` → downgrade to free
- `invoice.payment_failed` → flag account + send dunning email

**Response 200:** `{ "received": true }`
**Response 400:** Signature invalid or event parse failed

---

## Rate Limits

| Plan | Limit | Window |
|---|---|---|
| Free | 100 requests | per minute |
| Solo | 500 requests | per minute |
| Team | 500 requests | per minute per member |
| Studio | 2000 requests | per minute |
| CLI token | Same as user's plan | per minute |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1700000060
```

Exceeded: HTTP 429 `{ "error": "Rate limit exceeded", "code": "RATE_LIMITED", "retry_after": 14 }`