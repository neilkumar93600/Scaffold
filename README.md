<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=00E6A1&height=200&section=header&text=Scaffold&fontSize=70&fontColor=ffffff" width="100%" />

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=20&duration=3000&pause=1000&color=00E6A1&center=true&vCenter=true&width=500&lines=Stop+rebuilding+from+scratch;Ship+smarter,+every+time;Your+ultimate+Launch+OS)](https://git.io/typing-svg)

<br/>

<p align="center">
  <a href="#-project-overview"><b>Overview</b></a> •
  <a href="#-the-120-templates-library"><b>120+ Templates</b></a> •
  <a href="#-core-features-deep-dive"><b>Features</b></a> •
  <a href="#-architecture--tech-stack"><b>Architecture</b></a> •
  <a href="#-getting-started"><b>Getting Started</b></a> •
  <a href="#-environment-variables"><b>Environment Config</b></a> •
  <a href="#-testing"><b>Testing</b></a> •
  <a href="#-plans--pricing"><b>Pricing</b></a>
</p>

[![Version](https://img.shields.io/badge/Version-1.0.0-00E6A1?style=for-the-badge&logo=rocket&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-00E6A1?style=for-the-badge&logo=open-source-initiative&logoColor=white)](#)
[![Status](https://img.shields.io/badge/Status-Active-00E6A1?style=for-the-badge&logo=checkmarx&logoColor=white)](#)

*Crafted with precision by **Neil** | Made by **Gary Soft***

<br/>

---

> 💡 **The Setup Loop is Broken** <br/>
> Every developer, solo founder, and small startup team faces the same invisible tax. Each new project requires rebuilding the exact same foundation. <br/> **Scaffold** is a **Launch OS** that eliminates repetitive setup work by giving you a persistent, personalized knowledge base of your stack, decisions, and launch playbooks.

---

</div>

<br/>

## 🚀 Project Overview

Scaffold provides everything needed to go from idea to production reliably. It orchestrates your entire development workflow by learning your preferred stack once and applying it automatically to every new project through a combination of **Memory**, **Guidance**, and **Automation**.

<br/>

## 📚 The 120+ Templates Library

Scaffold comes with **120+ hand-curated, maintained starter templates**. Rather than giving you a monolithic boilerplate where you have to delete code you don't need, Scaffold's templates are modular and injected based _only_ on the stack you specify.

Every template includes **Semantic Version Staleness Detection**—run via a weekly cron against npm/PyPI APIs—so you are immediately notified if a boilerplate is using outdated dependencies.

<div align="center">

| Category                  | Available Boilerplates & Snippets (Partial List)                                      |
| :------------------------ | :------------------------------------------------------------------------------------ |
| 🔐 **Authentication**     | Supabase Auth, Clerk, NextAuth.js, Firebase Auth, Magic Links, OAuth Helpers          |
| 💳 **Payments**           | Stripe Checkout, LemonSqueezy, Paddle webhook handlers, Pricing Tables UI             |
| 📧 **Email & Comms**      | Resend templates, SendGrid wrappers, React Email components, Transactional flows      |
| 🗄️ **Database & ORM**     | Prisma schemas, Drizzle migrations, Supabase RLS policies, Mongoose setup             |
| 🚀 **CI/CD & DevOps**     | GitHub Actions (Lint, Test, Preview, Deploy), GitLab CI, Dockerfiles, Vercel configs  |
| 📊 **Monitoring**         | Sentry integration, Datadog tracing, PostHog analytics, Vercel Web Vitals             |
| 🎨 **UI/UX Components**   | Tailwind CSS globals, Shadcn/UI setups, Framer Motion transitions, Dark Mode wrappers |
| ⚖️ **Legal & Compliance** | standard Privacy Policy, Terms of Service, Cookie Consent banners, GDPR flows         |

</div>

<br/>

## 🛠 Core Features Deep Dive

Scaffold isn't just templates. It's an entire OS for launching software.

<details open>
<summary><b>📖 Launch Playbooks (Guidance)</b></summary>
<br/>

Structured, step-by-step checklists for every scenario: "New SaaS MVP", "Production Deploy", "Security Audit".

- **Smart Auto-completion**: If your saved stack includes `Stripe`, the playbook automatically checks off or injects the Stripe webhook steps.
- **Forkable**: Copy built-in playbooks and modify them for your specific workflow.
</details>

<details open>
<summary><b>🧠 Personal Stack Memory</b></summary>
<br/>

Define your preferred tools once (e.g., `Next.js` + `Supabase` + `Stripe` + `Resend`).

- **Auto-import**: Import your stack instantly from an existing `package.json` or `requirements.txt`.
- **Team Sync**: Team Admins can lock the stack to enforce consistency across all developers.
</details>

<details open>
<summary><b>⚡ One-Click Project Init (Automation)</b></summary>
<br/>

Given your saved stack, Scaffold generates a fully configured project structure in seconds via a background worker (`Inngest`).

- **Outputs**: `.env.example`, `README.md`, config files, and complete folder structures perfectly tuned to your stack.
</details>

<details open>
<summary><b>📓 Decision Log</b></summary>
<br/>

A searchable, structured log of architectural decisions. Prevent the same debates across projects.

- **Records**: Title, context, chosen option, alternatives, rationale, and date.
- **Search**: Full-text search powered by PostgreSQL `pg_trgm`.
</details>

<br/>

## 🏗 Architecture & Tech Stack

Scaffold is built as a **Modular Monolith** prioritizing speed, type-safety, and reliability.

### ⚙️ Core Technologies

<div align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind,supabase,postgres,vercel,githubactions&perline=8" />
  </a>
</div>
<br/>

### 🧱 Modules

| Module                     | Responsibility                   | Engine / Service            |
| :------------------------- | :------------------------------- | :-------------------------- |
| 🔐 **M1: Identity & Auth** | User sessions, OAuth, teams      | `Supabase Auth (JWT)`       |
| 🗄️ **M2: Stack Memory**    | Persistent tool preferences      | `PostgreSQL (Supabase)`     |
| 📓 **M3: Playbooks**       | Launch checklists and runs       | `Next.js App Router`        |
| 📦 **M4: Templates**       | Code boilerplates and snippets   | `Upstash Redis`             |
| 🏗️ **M5: Project Init**    | Automated project generation     | `Inngest (Background Jobs)` |
| 🔍 **M6: Decision Log**    | Searchable architectural logging | `PostgreSQL pg_trgm`        |

<br/>

<details>
<summary><b>📈 Click to view the architectural workflow diagram</b></summary>
<br/>

```mermaid
sequenceDiagram
    participant User
    participant Scaffold Engine
    participant Background Worker (Inngest)
    participant Storage (Supabase)

    User->>Scaffold Engine: POST /api/v1/init (stack_id, project_name)
    Scaffold Engine->>Background Worker: Enqueue 'scaffold/generate'
    Scaffold Engine-->>User: 202 Accepted (jobId)

    loop Background Processing
        Background Worker->>Background Worker: Assemble File Tree
        Background Worker->>Background Worker: Generate ZIP Buffer
    end

    Background Worker->>Storage: Upload scaffold.zip
    Storage-->>Background Worker: Return Presigned URL
    Background Worker->>Background Worker: Mark Job Complete

    User->>Scaffold Engine: GET /api/v1/init/{jobId}
    Scaffold Engine-->>User: 200 OK (downloadUrl)
```

</details>

<br/>

## 💻 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en) (v20 or higher)
- [pnpm](https://pnpm.io/) (v9 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional for local database)
- Optional: Docker (if you prefer running PostgreSQL manually)

### 1️⃣ Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/neilkumar93600/Scaffold.git
cd Scaffold

# 2. Install Dependencies
pnpm install

# 3. Setup Environment Variables
cp .env.example .env.local

# 4. Start Local Supabase
supabase start

# 5. Push Database Schema (via Drizzle)
pnpm db:push

# 6. Start the Development Server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### 2️⃣ Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server with Turbopack |
| `pnpm build` | Create a production-ready Next.js build |
| `pnpm lint` | Run ESLint across the codebase |
| `pnpm typecheck` | Run TypeScript compiler checks without emitting files |
| `pnpm format` | Auto-format code using Prettier |
| `pnpm db:push` | Push Drizzle schema changes to the PostgreSQL database |
| `pnpm db:studio` | Open Drizzle Studio to inspect database tables |

<br/>

## ⚙️ Environment Variables

The project relies on a number of external services. Fill out your `.env.local` based on the provided `.env.example`.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Transaction pooled PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin role key for server-side auth/data fetching |
| `STRIPE_SECRET_KEY` | Stripe backend key |
| `RESEND_API_KEY` | Resend email dispatch key |
| `INNGEST_EVENT_KEY` | Secret for dispatching background jobs via Inngest |
| `UPSTASH_REDIS_REST_URL` | Serverless Redis instance URL for rate-limiting |
| `SENTRY_DSN` | DSN for tracking unhandled errors |

<br/>

## 🧪 Testing

We utilize Vitest for unit testing and Playwright for end-to-end browser testing.

```bash
# Run Unit Tests
pnpm test

# Run Unit Tests with Coverage Report
pnpm test:coverage

# Run End-to-End Browser Tests
pnpm test:e2e
```

<br/>

## 🚢 Deployment

The application is built for Vercel deployment but is portable to any Node.js environment.

### Vercel (Recommended)
1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add all required Environment Variables.
4. Click Deploy.

### CI/CD Pipeline (GitHub Actions)

Our deployment pipeline is fully automated. Every PR validates type safety, runs unit tests, and triggers E2E verification.

```yaml
name: CI & Preview Deploy
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
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck && pnpm lint
      - run: pnpm test --run

  e2e:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm test:e2e
```

<br/>

## 🩺 Troubleshooting

**Error:** `password authentication failed for user "postgres"` <br/>
**Fix:** Verify your `DATABASE_URL` uses the correct password and pooler URL. If running locally via `supabase start`, ensure you use `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

**Error:** `Inngest functions are not being triggered` <br/>
**Fix:** Ensure you run the Inngest local dev server alongside Next.js using `npx inngest-cli@latest dev`.

**Error:** `Drizzle push fails with missing role` <br/>
**Fix:** Ensure the database exists and you have adequate permissions. On Supabase, the default transaction pooler uses port `6543`.

<br/>

## 💳 Plans & Pricing

<div align="center">

|     Tier      | Best For          |   Price    | Core Entitlements                  |
| :-----------: | :---------------- | :--------: | :--------------------------------- |
|  🥉 **Free**  | Trying things out |   **$0**   | 3 Projects, 15 Built-in Templates  |
|  🥈 **Solo**  | Indie Hackers     | **$12/mo** | Unlimited Projects, Custom Stacks  |
|  🥇 **Team**  | Small Teams       | **$32/mo** | Up to 8 Members, Slack Integration |
| 💎 **Studio** | Power Users       | **$89/mo** | Unlimited Members, SSO Integration |

</div>

<br/>

## 🤝 Contribute

We welcome contributions from the community!

1. **Fork the repository** and create your branch from `main`.
2. **Make your changes**, ensuring tests pass and type safety is maintained.
3. **Submit a Pull Request** with a detailed description of your changes.

To report bugs or request features, please open an issue in our GitHub repository. Be sure to check existing issues before submitting a new one.

<br/>

---

<div align="center">

### 📜 License

Released under the **MIT License**. <br/>
© 2026 **Gary Soft**. All rights reserved.

<br/>

<a href="https://github.com/neilkumar93600/Scaffold">
  <img src="https://img.shields.io/github/stars/neilkumar93600/Scaffold?style=social" alt="GitHub stars">
</a>
<a href="https://github.com/neilkumar93600/Scaffold">
  <img src="https://img.shields.io/github/forks/neilkumar93600/Scaffold?style=social" alt="GitHub forks">
</a>

<br/>
Made with 💚 by <b>Neil</b> & the Scaffold Team

</div>
