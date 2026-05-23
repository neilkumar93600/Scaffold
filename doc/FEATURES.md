# Scaffold — Feature Specifications

> Detailed behaviour specs for every product feature

---

## F1 — Onboarding

### F1.1 Sign Up
- GitHub OAuth and Google OAuth available
- No password creation — OAuth only
- New user → `/onboarding` page
- Returning user → `/dashboard`

### F1.2 Onboarding Flow (3 steps)
```
Step 1: "What do you build most often?"
  Options: SaaS, Mobile app, APIs, Client sites, Other
  → Sets default playbook category

Step 2: "Build your first stack"
  → Guided stack builder OR import from package.json
  → Must select ≥1 tool to proceed

Step 3: "You're ready"
  → Summary of stack saved
  → CTA: "Create your first project" or "Browse templates"
  → Mark user.onboarding_done = true
```

**Activation metric:** Completing Step 2 (first stack saved) = "activated"

---

## F2 — Stack Management

### F2.1 Create Stack
- Name (required, 1–100 chars)
- Description (optional, max 500 chars)
- Tools: select from categorized tool picker (framework, database, auth, payments, email, monitoring, analytics, devops)
- Import from manifest: paste `package.json` / `requirements.txt` / `Gemfile`

### F2.2 Tool Picker
- Grouped by category
- Search by tool name
- Each tool shows: icon, name, category
- Selected tools shown as chips
- Unknown tools can be added as custom (free text) — tagged as "custom"

### F2.3 Stack List
- Shows all stacks sorted by `updated_at DESC`
- Team stacks shown with team name badge
- Locked stacks show 🔒 icon

### F2.4 Stack Detail
- Tool list with version display
- Edit button (disabled if locked and not admin)
- "Use for project init" CTA
- "Start playbook with this stack" CTA
- Compatible templates count (link to filtered template browse)

### F2.5 Stack Locking (Team Plan)
- Admin/owner can toggle lock
- Locked: members see read-only view; edit button hidden
- Lock status shown in team stack list

---

## F3 — Playbook System

### F3.1 Playbook Library
- Built-in playbooks (Scaffold-owned, always available)
  - New SaaS MVP
  - Production Deploy
  - New Feature Launch
  - Client MVP
  - Startup Launch
- User-created playbooks (forked or from scratch)
- Team playbooks (Team+ plan)
- Filter: category, mine/team/built-in

### F3.2 Playbook Detail
- Step list with checkboxes
- Auto-completed steps shown with ✓ and "Handled by [tool]" label
- Required vs optional steps visually differentiated
- Fork button
- "Start run" button → prompts for project name + stack selection

### F3.3 Playbook Run
- Project name displayed at top
- Stack attached (optional)
- Progress bar: X/Y steps
- Step groups (optional — playbooks can have sections)
- Check/uncheck steps
- Each step: title + description + optional external link
- Due date picker
- When all required steps complete: confetti + "Mark complete" confirmation

### F3.4 Fork Playbook
- Deep copy — all steps get new UUIDs
- Name defaults to "[Original Name] (fork)"
- User can rename before saving
- `forked_from` field preserved for attribution

### F3.5 Custom Playbook Builder
- Add/remove/reorder steps (drag and drop)
- Set step title, description, auto_complete_tool_id
- Mark steps as required or optional
- Publish to team library (Team+ plan)

---

## F4 — Template Library

### F4.1 Browse
- Grid layout with card per template
- Filter panel: category, tags, compatibility with my stack
- Search: keyword (title + tags)
- Sort: Most copied, Newest, A-Z
- Stale templates show ⚠️ badge

### F4.2 Template Card
- Title, category badge, tags
- Compatible tools chips
- Copy count
- "Copy" button (primary CTA) — copies content to clipboard

### F4.3 Template Detail Drawer/Modal
- Full content in syntax-highlighted code block
- Copy button (large)
- Version, last updated
- Staleness warning if `is_stale = true`
- "Save to my library" button (Solo+ plan)

### F4.4 My Templates (Personal Library)
- Personal templates created by user
- CRUD: create, edit, delete
- Tags management
- Stack compatibility selection
- Toggle public/private

### F4.5 Template Staleness
- Stale templates show warning badge in browse and detail
- Warning: "This template uses [tool] v1.x. Latest is v2.0. The Scaffold team will update it shortly."
- Paid users receive email notification

---

## F5 — Project Init

### F5.1 New Project Flow
```
1. Click "New Project" in dashboard
2. Select or create a stack
3. Enter project name
4. Click "Generate Scaffold"
5. Progress indicator (async for large stacks)
6. Download button appears when ready
7. ZIP contains: folder structure, .env.example, README.md, package.json, config files
```

### F5.2 Generated Files
| File | Source |
|---|---|
| `README.md` | Template with project name + stack details injected |
| `.env.example` | All env vars for stack tools, grouped by tool |
| `.gitignore` | Standard + tool-specific ignores |
| `package.json` | Dependencies for all stack tools at recommended versions |
| `tsconfig.json` | Standard TypeScript config for stack |
| `next.config.mjs` | If Next.js in stack |
| `tailwind.config.ts` | If Tailwind in stack |
| `drizzle.config.ts` | If Drizzle in stack |

### F5.3 CLI Equivalent
```bash
scaffold init --stack "nextjs-saas" --name "my-project"
# Equivalent to web flow
# Downloads ZIP and extracts to ./my-project/
# Prints: "✓ Scaffold generated. Run: cd my-project && pnpm install"
```

---

## F6 — Decision Log

### F6.1 Create Decision
Fields:
- **Title** (required) — e.g., "PostgreSQL over MongoDB"
- **Context** — what problem prompted this decision
- **Decision** (required) — what was chosen
- **Alternatives considered** — what was rejected and why (one per line)
- **Rationale** (required) — why the chosen option won
- **Tags** — free text
- **Link to stack** — optional

### F6.2 Decision List
- Sorted by `created_at DESC`
- Search bar: full-text search across title + context + rationale
- Tag filter
- Stack filter
- Team decisions mixed with personal (if team member)

### F6.3 Decision Detail
- Read-only after creation (append-only log)
- "Supersede" button — creates new decision with this one in context

---

## F7 — Team Library

### F7.1 Team Setup
- User upgrades to Team plan → prompted to create team or join existing
- Team has: name, members, shared stacks, shared playbooks, shared templates

### F7.2 Invite Flow
- Admin enters email address
- Invite email sent with team name, inviter name, and accept link
- Accept link expires in 7 days
- Invitee signs up → lands on team onboarding (skips generic onboarding)

### F7.3 Member Management
- Admin view: list of members with roles
- Promote/demote member ↔ admin
- Remove member (data preserved, access revoked)
- Seat limit enforcement: >8 members on Team → upgrade to Studio

### F7.4 Shared Library
- Shared stacks: visible to all members, editable per lock status
- Shared playbooks: visible + forkable by all members
- Shared templates: visible + copyable by all members
- Individual member's personal items not shared (separate from team library)

### F7.5 Slack Integration
- Connect via OAuth in team settings
- Select channel for notifications
- Events posted: playbook completed, new member joined, template staleness alert
- `/scaffold status [project-name]` slash command

---

## F8 — Billing

### F8.1 Upgrade Flow
- Plan comparison table in `/billing`
- Toggle: monthly / annual
- "Upgrade" button → Stripe Checkout (hosted)
- Success: redirect to `/billing/success` → plan activated immediately

### F8.2 Plan Limit UI
- Free tier gates show upgrade prompt inline
- "You've used 3/3 projects" with upgrade CTA
- Clicking any locked feature opens upgrade modal

### F8.3 Billing Portal
- "Manage billing" → Stripe Billing Portal
- Handles: cancel, change plan, update card, view invoices
- No custom UI — Stripe handles everything

---

## F9 — CLI (scaffold-cli)

### F9.1 Commands
```bash
scaffold init [--stack <name>] [--name <project-name>]
scaffold stack list
scaffold stack use <name>
scaffold template list [--category <cat>]
scaffold template copy <id>
scaffold auth login      # Opens browser for OAuth
scaffold auth token      # Show/regenerate API token
```

### F9.2 Auth
- `scaffold auth login` opens browser → OAuth → token stored in `~/.scaffold/config.json`
- Token is a CLI API token (not session JWT)
- Token revocable from web dashboard

### F9.3 Attribution
Generated `README.md` includes footer:
```markdown
---
*Scaffolded with [Scaffold](https://scaffold.app)*
```
This is the viral referral touchpoint. Opt-out available in settings (v2).