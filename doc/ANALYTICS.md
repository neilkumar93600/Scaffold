# Scaffold — Analytics & Metrics

> Event tracking plan, funnels, dashboards, and KPI definitions

---

## 1. Event Tracking Plan (PostHog)

All events fired server-side in API routes after successful operation. Never fire on failure.

### 1.1 Identity Events

| Event | When Fired | Properties |
|---|---|---|
| `user_signed_up` | New user row created | `{ method: 'github'\|'google', plan: 'free' }` |
| `user_signed_in` | Successful auth | `{ method: 'github'\|'google' }` |
| `onboarding_completed` | Step 2 saved (first stack) | `{ stack_tool_count: number, project_type: string }` |
| `onboarding_skipped` | User navigated away from /onboarding | — |

### 1.2 Stack Events

| Event | When Fired | Properties |
|---|---|---|
| `stack_created` | POST /stacks 201 | `{ tool_count, has_team, plan }` |
| `stack_updated` | PATCH /stacks/:id 200 | `{ tools_added, tools_removed }` |
| `stack_deleted` | DELETE /stacks/:id 204 | `{ tool_count }` |
| `stack_detected` | POST /stacks/detect 200 | `{ manifest_type, detected_count, unrecognized_count }` |

### 1.3 Template Events

| Event | When Fired | Properties |
|---|---|---|
| `template_viewed` | GET /templates/:id 200 | `{ category, is_stale, is_built_in }` |
| `template_copied` | POST /templates/:id/copy 200 | `{ template_id, category, is_stale, is_built_in }` |
| `template_created` | POST /templates 201 | `{ category, is_public, has_team }` |
| `template_search` | GET /templates?search=... | `{ query_length, results_count, has_stack_filter }` |

### 1.4 Playbook Events

| Event | When Fired | Properties |
|---|---|---|
| `playbook_run_started` | POST /runs 201 | `{ playbook_category, auto_complete_count, has_stack, is_built_in }` |
| `playbook_step_toggled` | PATCH /runs/:id/steps/:stepId | `{ step_id, completed: bool, is_auto_complete, run_progress }` |
| `playbook_run_completed` | Run `is_complete` set | `{ playbook_category, duration_days, total_steps, auto_completed_count }` |
| `playbook_forked` | POST /playbooks/:id/fork | `{ source_is_built_in }` |

### 1.5 Init Events

| Event | When Fired | Properties |
|---|---|---|
| `scaffold_generation_started` | POST /init 202 | `{ stack_tool_count, project_name_length }` |
| `scaffold_generation_completed` | Inngest job complete | `{ duration_ms, file_count, tool_count }` |
| `scaffold_generation_failed` | Inngest job failed | `{ error_type }` |
| `scaffold_downloaded` | User clicks download link | `{ tool_count }` |

### 1.6 Decision Events

| Event | When Fired | Properties |
|---|---|---|
| `decision_created` | POST /decisions 201 | `{ has_stack_link, has_alternatives, has_team, word_count }` |
| `decision_searched` | GET /decisions?q=... | `{ query_length, results_count }` |

### 1.7 Billing Events

| Event | When Fired | Properties |
|---|---|---|
| `plan_limit_hit` | 402 response on any endpoint | `{ resource, plan, current, max }` |
| `upgrade_started` | POST /billing/checkout 200 | `{ from_plan, to_plan, interval }` |
| `plan_upgraded` | Stripe checkout.session.completed | `{ from_plan, to_plan, interval, mrr_impact }` |
| `plan_downgraded` | Stripe subscription.deleted | `{ from_plan, reason: 'cancelled'\|'payment_failed' }` |
| `billing_portal_opened` | POST /billing/portal 200 | — |

### 1.8 Team Events

| Event | When Fired | Properties |
|---|---|---|
| `team_created` | POST /teams 201 | `{ plan }` |
| `team_invite_sent` | POST /teams/:id/invites 201 | `{ team_plan, team_size }` |
| `team_invite_accepted` | GET /teams/:id/invites/:token 200 | `{ team_plan }` |
| `team_member_removed` | DELETE /teams/:id/members/:userId | — |
| `slack_connected` | Slack OAuth complete | — |

---

## 2. User Identification

```ts
// On sign up / sign in
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: user.plan,
  created_at: user.created_at,
})

// On plan upgrade
posthog.setPersonProperties({ plan: 'solo' })
```

---

## 3. Key Funnels (PostHog Funnels)

### 3.1 Activation Funnel
```
Sign up → Onboarding page → First stack saved → Dashboard
```
**Target:** 60% reach "First stack saved" step within 7 days

### 3.2 Conversion Funnel (Free → Paid)
```
Sign up → Stack created → Plan limit hit → Upgrade started → Plan upgraded
```
**Target:** 8% of Free users complete this funnel within 30 days

### 3.3 Template Engagement Funnel
```
Templates page visited → Template viewed → Template copied
```
**Target:** 70% of template viewers copy at least one

### 3.4 Team Growth Funnel
```
Solo plan purchased → Team invite sent → Invite accepted → Team plan purchased
```
**Target:** 25% of Solo users send at least one invite within 60 days

---

## 4. KPI Definitions

| KPI | Definition | Target (Month 12) |
|---|---|---|
| MAU | Unique users with ≥1 API call in rolling 30 days | 35,000 |
| Activation rate | % of signups who create ≥1 stack within 7 days | 60% |
| Day 14 retention | % of activated users who return within 14 days of first init | 40% |
| Free → Paid conversion | % of Free users who upgrade within 30 days | 8% |
| MRR | Sum of active subscription revenue | $42,000 |
| ARPU | MRR / paying users | ~$20 |
| Churn rate | % of paying users who cancel in a given month | <3% |
| NPS | Net Promoter Score from 90-day survey | ≥50 |
| Template copy rate | Avg templates copied per active user per month | ≥3 |
| Playbook completion rate | % of started runs marked complete | ≥50% |

---

## 5. Dashboards

### 5.1 Daily Dashboard (check every morning)
- Signups last 24h
- Activations last 24h (stacks created)
- Template copies last 24h
- MRR (current)
- Stripe webhook health
- Sentry error count

### 5.2 Weekly Dashboard (Friday review)
- DAU/WAU/MAU trend
- Activation rate (7-day cohort)
- Conversion rate (30-day rolling)
- Top templates copied this week
- Playbook completion rate
- Churned users this week

### 5.3 Monthly Dashboard (end of month)
- MRR growth
- Net new paying users
- Cohort retention curves (Day 7, 14, 30)
- NPS score
- Plan mix (Free/Solo/Team/Studio %)
- LTV estimates

---

## 6. A/B Testing Framework

Use PostHog feature flags for A/B tests:

```ts
// Check experiment in RSC
const variant = await posthog.getFeatureFlag('onboarding-v2', userId)

if (variant === 'quick-start') {
  return <QuickStartOnboarding />
} else {
  return <StandardOnboarding />
}
```

**Active experiments (launch period):**
- `onboarding-v2`: Quick 30-second stack builder vs standard 3-step flow
- `pricing-display`: Show annual pricing first vs monthly first
- `upgrade-prompt`: Modal vs inline vs banner on plan limit hit

**Test duration:** Minimum 2 weeks per test; minimum 100 conversions per variant before declaring winner.

---

## 7. Analytics Data Retention

| Data | Retention | Notes |
|---|---|---|
| PostHog events | 1 year (PostHog Cloud) | No PII in events |
| Sentry errors | 90 days | Email stripped before send |
| Vercel request logs | 30 days (Vercel default) | IP addresses included |
| Stripe events table | 90 days | Billing audit trail |
| User-generated data | Until deletion | Per privacy policy |