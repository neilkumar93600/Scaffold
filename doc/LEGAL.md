# Scaffold — Legal Requirements

> Terms of Service requirements, Privacy Policy requirements, GDPR compliance, and legal obligations

---

## 1. Terms of Service Requirements

### 1.1 Must Cover

**Account Terms**
- Minimum age: 16 (or 18 in jurisdictions requiring it)
- One account per person — no shared accounts at Solo plan
- Users responsible for all activity under their account
- Account credentials must not be shared (applies to non-team plans)
- Team plan: up to `max_members` seats

**Acceptable Use**
- No scraping or automated bulk-copying of built-in template content
- Template content contributed by users must not infringe copyright
- No using Scaffold to store or distribute malicious code
- No reselling Scaffold access to third parties
- No circumventing plan limits via multiple accounts

**Intellectual Property**
- Built-in templates: owned by Scaffold, licensed for use in user's projects (not for redistribution)
- User-created templates: owned by user; user grants Scaffold license to display to team members
- Public playbooks shared via link: user grants Scaffold read-only display license
- Scaffold trademark: "Scaffold" and logo may not be used in competing products

**Service & Availability**
- Service provided "as is"; no uptime guarantee in ToS (SLA aspirational only)
- Scaffold reserves right to modify/discontinue features with 30-day notice
- Free plan may be changed with 30-day notice

**Termination**
- User can terminate at any time — no questions
- Scaffold can terminate accounts for ToS violation with notice (except severe violations)
- On termination: data retained 30 days for recovery, then deleted

**Limitation of Liability**
- Scaffold not liable for indirect, incidental, consequential damages
- Total liability capped at fees paid in last 12 months
- No warranty on template correctness or fitness for production use

**Governing Law**
- Jurisdiction: [TBD — based on company incorporation country]

---

## 2. Privacy Policy Requirements

### 2.1 Data Collected

| Data | Source | Purpose |
|---|---|---|
| Email address | GitHub/Google OAuth | Account identification, transactional email |
| Name | OAuth profile | Display in UI |
| Avatar URL | OAuth profile | UI avatar |
| GitHub/Google user ID | OAuth | Authentication link |
| IP address | Vercel Edge logs | Rate limiting, abuse prevention |
| Plan + billing data | Stripe | Service delivery |
| Stack/template/playbook content | User-created | Core product functionality |
| Usage events | PostHog | Product analytics |
| Error data | Sentry | Bug fixing (PII stripped before send) |

### 2.2 Data NOT Collected
- Passwords (never stored — OAuth only)
- Payment card details (handled entirely by Stripe — PCI-compliant)
- Location data (beyond IP for rate limiting)
- Biometric data
- Health or financial information

### 2.3 Third-Party Processors

| Processor | Data Shared | Purpose | Privacy Policy |
|---|---|---|---|
| Supabase | All user data | Database + Auth + Storage | supabase.com/privacy |
| Stripe | Email, billing data | Payment processing | stripe.com/privacy |
| Vercel | Request logs (IP, URL) | Hosting + CDN | vercel.com/legal/privacy-policy |
| Resend | Email address | Transactional email | resend.com/privacy |
| PostHog | User ID, events | Analytics | posthog.com/privacy |
| Sentry | User ID, error context (no email) | Error monitoring | sentry.io/privacy |
| Inngest | Job payloads (no PII) | Background jobs | inngest.com/privacy |

### 2.4 GDPR Rights (EU Users)

| Right | How Exercised |
|---|---|
| Access | Request via email to privacy@scaffold.app (v2: self-serve export) |
| Erasure | Request via email OR DELETE /api/v1/users/me (cascades all data) |
| Portability | Request via email — JSON export provided within 30 days |
| Rectification | Edit profile in account settings |
| Object to processing | Contact privacy@scaffold.app |
| Withdraw consent | Delete account |

**GDPR compliance basis:** Legitimate interest (core service delivery); Consent (marketing emails, opt-in)

**DPA (Data Processing Agreement):** Offered on request for Team and Studio plan customers who require it.

### 2.5 Cookie Policy

| Cookie | Type | Purpose | Expiry |
|---|---|---|---|
| `sb-access-token` | Required | Supabase Auth session | 1 hour |
| `sb-refresh-token` | Required | Session refresh | 30 days |
| `_posthog` | Analytics | Product analytics (opt-out available) | 1 year |

Cookie consent banner required for EU/UK visitors. Required cookies (auth) cannot be declined. Analytics cookies can be declined.

---

## 3. GDPR Compliance Checklist

### Technical Measures
- [ ] RLS on all user data tables — enforced at DB layer
- [ ] Service-role key restricted to background jobs only
- [ ] PII stripped from Sentry events (`beforeSend` hook)
- [ ] HTTPS enforced everywhere (HSTS header)
- [ ] Data minimization — only email, name, avatar collected

### Process Measures
- [ ] Data breach notification process documented (72h GDPR requirement)
- [ ] Privacy policy accessible from landing page footer and signup flow
- [ ] Cookie consent banner implemented for EU/UK visitors
- [ ] DPA available on request for business customers
- [ ] GDPR contact email configured: privacy@scaffold.app
- [ ] Data retention policy documented (30 days post-deletion buffer)

### Account Deletion
```ts
// DELETE /api/v1/users/me
// Cascades via FK ON DELETE CASCADE to:
// - stacks, templates, playbooks, playbook_runs, decisions
// Stripe customer is NOT deleted (billing records required for 7 years)
// Stripe subscription is cancelled first, then customer anonymized
```

---

## 4. DMCA Policy

**Template content copyright:**
- Built-in templates: written by Scaffold team — owned by Scaffold
- User-created templates: user certifies they own or have rights to the content
- ToS prohibits uploading copyrighted content without permission

**DMCA Takedown Process:**
1. Rights holder submits takedown to legal@scaffold.app with:
   - Identification of copyrighted work
   - URL of the infringing Scaffold template
   - Contact information and good faith statement
2. Scaffold reviews within 5 business days
3. Infringing content removed if claim is valid
4. Counter-notice process available to content creator

---

## 5. Open Source (CLI)

**scaffold-cli** is open source under the MIT License.

MIT License requirements:
- License file must be included in the npm package
- Copyright notice: "Copyright (c) 2025 Scaffold"
- No warranty disclaimer included in LICENSE file

**Important:** The CLI is MIT-licensed. The Scaffold SaaS (cloud service) is proprietary. The CLI calls the Scaffold API — the API is not open source.

---

## 6. Compliance with Payment Card Industry (PCI)

Scaffold does **not** handle payment card data directly. Stripe (PCI DSS Level 1 certified) handles all card processing.

Scaffold's PCI compliance responsibilities:
- Use Stripe.js to tokenize card data in browser — ✓ (handled by Stripe Checkout)
- Never log card numbers or CVVs — ✓ (Stripe handles all)
- Stripe secret key stored securely (Vercel env var, never committed) — ✓

---

## 7. Legal Files Required at Launch

| File | Location | Status |
|---|---|---|
| Terms of Service | `/legal/terms` | Draft required |
| Privacy Policy | `/legal/privacy` | Draft required |
| Cookie Policy | `/legal/cookies` | Draft required |
| DMCA Policy | `/legal/dmca` | Draft required |
| Open Source License | CLI repo `/LICENSE` | MIT template available |

**Built-in templates to include in Scaffold library:**
- Privacy Policy template (SaaS)
- Terms of Service template (SaaS)
- Cookie Policy template
- (These eat our own cooking — Scaffold promotes using these templates to other builders)

---

## 8. Entity Requirements (Pre-Revenue)

Before accepting payments:
- [ ] Business entity incorporated (LLC or Ltd recommended)
- [ ] Business bank account separate from personal
- [ ] Stripe account in entity name (not personal)
- [ ] Terms of Service + Privacy Policy live before open beta
- [ ] EU users: VAT compliance required if revenue from EU customers (use Stripe Tax)