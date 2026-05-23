# Cowork Skills

16 skills that turn Claude Cowork into a personal operating system for any business operator. Built around what Cowork does best: persistent file workspaces, scheduled tasks, connectors, and rich visual outputs (HTML pages, dashboards, slide decks, PDFs).

Most are designed to work without setup — install them, point Cowork at a folder, and trigger by saying the skill name or a related phrase. `carousels` is the exception: it needs Node, a headless browser, and an OpenAI API key (its preflight walks you through it).

## The 16

**Run while you sleep (scheduled-task skills):**
- `morning-briefing` — daily HTML dashboard of calendar, inbox, and news
- `expense-report` — drop receipts in a folder, get a categorized spreadsheet + dashboard

**Inbox and meetings:**
- `inbox-triage` — Gmail-connected review and reply drafter
- `meeting-prep` — pre-call briefing dashboard + post-meeting follow-up

**Thinking and decisions:**
- `brain-dump` — voice or text dump becomes a structured project + task list
- `step-back` — forces critical reflection on a long conversation's direction
- `decision-journal` — log decisions with context, pattern-match against past ones

**Visual outputs:**
- `slide-deck` — generate a polished HTML slide deck from any topic or document
- `explainer-infographic` — animated, interactive HTML page explaining a concept
- `dashboard-builder` — interactive KPI dashboard from any CSV, sheet, or folder
- `carousels` — turn a piece of content into an on-brand LinkedIn + Instagram image carousel (rendered PNGs + PDF + caption)

**Documents:**
- `contract-review` — flag risks, missing terms, and negotiation points
- `invoice-generator` — one sentence in, polished PDF invoice out

**Research and relationships:**
- `deep-research` — sourced, bite-sized brief on any topic
- `personal-crm` — relationship tracker, follow-ups owed, context from past conversations
- `workflow-visualizer` — interactive map of your own business systems

## Install

```bash
npx skills@latest add TheCraigHewitt/skills/cowork
```

Or grab one at a time:

```bash
npx skills@latest add TheCraigHewitt/skills/cowork -s morning-briefing
```

## How to trigger a skill

Once installed, three ways to invoke any of these:

1. **Slash command** — type `/` then pick the skill from the list
2. **Skill name in plain English** — say "draft a slide deck on X" or "review this contract" and Cowork will load the right skill
3. **Scheduled task** — for skills marked as scheduled (morning-briefing, expense-report), set a recurring schedule from any chat

## Customizing

Every skill in here is a starting point. To tailor one to your business, open the skill in Cowork (`/customize`) or edit its `SKILL.md` directly. The skills are written to explain *why* each step matters so the model can adapt sensibly when you change a constraint.

## Notes

- Skills work best when Cowork has connectors enabled (Gmail, Calendar, Slack, Drive). Each skill notes which connectors it needs.
- For apps not in Cowork's default connector list (Stripe, HubSpot CRM, Notion databases, etc.), use Zapier MCP — it exposes 8,000+ apps as MCP tools.
- Outputs land in the folder Cowork is pointed at. Skills generally produce one primary artifact (HTML, PDF, markdown, or spreadsheet) plus a short summary in chat.
