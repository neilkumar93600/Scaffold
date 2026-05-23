# Scaffold — Risk Register

> All identified risks with likelihood, impact, mitigation, and owner

---

## Risk Matrix

| Likelihood \ Impact | Low | Medium | High | Critical |
|---|---|---|---|---|
| **High** | Monitor | Mitigate | **Mitigate urgently** | **Escalate** |
| **Medium** | Accept | Monitor | **Mitigate** | **Mitigate urgently** |
| **Low** | Accept | Accept | Monitor | **Mitigate** |

---

## Technical Risks

### T1 — Supabase Outage
| Field | Value |
|---|---|
| **Likelihood** | Low |
| **Impact** | Critical — entire platform down |
| **Owner** | Engineering |
| **Mitigation** | Status page at `status.scaffold.app`; error pages with ETA; Inngest jobs queue until DB recovers; Vercel serves static pages during outage |
| **Detection** | Uptime monitor on `/api/v1/health`; Sentry DB connection errors |
| **Contingency** | Supabase Pro SLA 99.9%; PITR for data recovery; contact Supabase support immediately |

---

### T2 — Stripe Webhook Missed or Duplicate
| Field | Value |
|---|---|
| **Likelihood** | Medium |
| **Impact** | High — user plan not updated; double billing |
| **Owner** | Engineering |
| **Mitigation** | Idempotency via `stripe_events` table; Stripe retries with exponential backoff (up to 3 days); Sentry alert on webhook failures; manual webhook replay available via Stripe dashboard |
| **Detection** | Sentry error on any 4xx/5xx response to Stripe; PagerDuty alert |
| **Test** | Integration test: duplicate event ID returns 200 without processing |

---

### T3 — ZIP Generation Job Failure
| Field | Value |
|---|---|
| **Likelihood** | Low |
| **Impact** | Medium — user gets no scaffold; recoverable |
| **Owner** | Engineering |
| **Mitigation** | Inngest retries 3× with backoff; job status API lets user see failure; UI shows "retry" button; jobs recoverable via Inngest dashboard replay |
| **Detection** | Inngest function error logs; PostHog `scaffold_generated_failed` event |

---

### T4 — Template Library Staleness
| Field | Value |
|---|---|
| **Likelihood** | High |
| **Impact** | High — user trust erosion; templates become useless |
| **Owner** | Engineering + Product |
| **Mitigation** | Weekly automated staleness check via Inngest; in-app staleness badge; team reviews affected templates within 5 business days of major release; paid users notified |
| **Detection** | `is_stale = true` count dashboard; weekly engineering review |
| **Metric** | Alert if >10% of templates are stale and unreviewed for >7 days |

---

### T5 — Plan Limit Bypass via Race Condition
| Field | Value |
|---|---|
| **Likelihood** | Low |
| **Impact** | Medium — user gets more than plan allows; revenue leakage |
| **Owner** | Engineering |
| **Mitigation** | Atomic DB transaction for resource creation + count check; no optimistic client-side enforcement; DB-level CHECK constraints as fallback |
| **Detection** | Periodic audit: count resources per user vs plan limits |
| **Test** | Concurrent request test: two simultaneous POST /stacks on a 3-stack Free account — only one should succeed |

---

### T6 — CLI Token Leakage
| Field | Value |
|---|---|
| **Likelihood** | Low |
| **Impact** | High — attacker can access all user data |
| **Owner** | Engineering |
| **Mitigation** | Tokens stored as SHA-256 hash (DB); shown plaintext once; never logged; instant revoke via dashboard; audit log per token use (future); rate limiting on CLI tokens |
| **Detection** | Unusual API access patterns trigger rate limit; Sentry alerts on auth errors |
| **Response** | User can revoke immediately; 24h token auto-expiry if unused (future v2) |

---

### T7 — RLS Policy Gap on New Table
| Field | Value |
|---|---|
| **Likelihood** | Medium (if process not followed) |
| **Impact** | Critical — data leakage between users |
| **Owner** | Engineering |
| **Mitigation** | CI gate: RLS policy tests against seeded test DB run on every PR; security-auditor agent checks every new table; Definition of Done requires RLS policies |
| **Detection** | PR CI: RLS test failure blocks merge |
| **Test** | `it('user A cannot read user B\'s stack', ...)` runs in CI |

---

### T8 — XSS via Template Content
| Field | Value |
|---|---|
| **Likelihood** | Low (if rule followed) |
| **Impact** | High — session hijack, data theft |
| **Owner** | Engineering |
| **Mitigation** | Template content rendered ONLY in `<pre><code>` blocks; no `dangerouslySetInnerHTML`; Zod validates content as plain text; CSP headers block inline scripts |
| **Detection** | Security-auditor agent review on any template rendering code changes |

---

## Business Risks

### B1 — Low Activation Rate (<40%)
| Field | Value |
|---|---|
| **Likelihood** | Medium |
| **Impact** | High — no retention without activation |
| **Owner** | Product |
| **Mitigation** | PostHog funnel tracking from signup→first stack; guided onboarding with 3-step flow; pre-populated stack suggestions; activation email at 24h if no stack created |
| **Detection** | Weekly cohort activation rate in PostHog; alert if <40% by Day 7 |
| **Response** | A/B test onboarding variations; add "quick start" 30-second stack builder |

---

### B2 — Price Resistance ($12/mo)
| Field | Value |
|---|---|
| **Likelihood** | Low |
| **Impact** | High — conversion fails; company unviable |
| **Owner** | Product + Growth |
| **Mitigation** | Value narrative anchored to time: "4.2 hours saved = $630 at $150/hr"; Free plan is genuinely useful to prove value before paywall; annual plan offers 17% savings |
| **Detection** | Stripe revenue data; conversion rate <5% at 30 days is a signal |
| **Response** | Reduce to $9/mo or increase Free allowance; run pricing survey with cancellers |

---

### B3 — Competitor Ships Overlapping Feature
| Field | Value |
|---|---|
| **Likelihood** | Low (18mo window) |
| **Impact** | Medium |
| **Owner** | Product |
| **Mitigation** | Speed to market advantage; personal stack memory moat (competitors can copy features, not user data); community moat via team libraries |
| **Detection** | Competitor monitoring (weekly check: Vercel, Linear, Notion, GitHub) |
| **Response** | Accelerate roadmap; differentiate on personalization and team features |

---

### B4 — Open-Source CLI Self-Hosting Cannibalizes SaaS
| Field | Value |
|---|---|
| **Likelihood** | Low |
| **Impact** | Low — self-hosters are not the target market |
| **Owner** | Product |
| **Mitigation** | CLI alone is useful but limited — stack memory, team library, staleness alerts, decision log require the cloud service; self-host is possible but not the target user's priority |
| **Detection** | Monitor GitHub stars vs signups ratio |

---

### B5 — Team Plan Underperforms
| Field | Value |
|---|---|
| **Likelihood** | Medium |
| **Impact** | Medium — TAM limited to Solo plan ARPU |
| **Owner** | Growth |
| **Mitigation** | Team invite loop at seat limit (Solo user hits 3-project limit → prompted to invite team); case study content from Month 4; direct outreach to startup CTOs |
| **Detection** | Solo→Team upgrade rate <5% at 60 days is a signal |

---

### B6 — GDPR Deletion Request Volume
| Field | Value |
|---|---|
| **Likelihood** | Low |
| **Impact** | Medium — operational burden |
| **Owner** | Engineering + Legal |
| **Mitigation** | Automated deletion via CASCADE FK on `users` table; data export (v2); documented process in Privacy Policy |
| **Detection** | Email volume to privacy@scaffold.app |

---

## Risk Log

| Date | Risk ID | Event | Response |
|---|---|---|---|
| (First entry here) | — | — | — |