# Scaffold — Testing Strategy

> Testing approach, priorities, patterns, and tooling

---

## 1. Philosophy

**Test observable behaviour, not implementation details.**
Tests should break when the user-facing contract changes — not when internals are refactored. A test that requires mocking 5 internal functions to test one public outcome is a bad test.

**Tests are production code.** Unreadable tests rot faster than code. Every test must have a clear intent readable from the `it()` description alone.

**No snapshot tests.** Fragile, low-signal, often committed wrong. Visual changes are caught by manual review and Playwright screenshots.

---

## 2. Test Layers

| Layer | Tool | Scope | Speed |
|---|---|---|---|
| Unit | Vitest | Pure functions, module logic, algorithms | <100ms each |
| Integration | Supertest + Vitest | API routes with real DB | <500ms each |
| E2E | Playwright | Full user flows in browser | 5–30s each |

**Test database:** Separate Supabase project or local Supabase via Docker. Seeded before test suite, cleaned between tests.

---

## 3. Priority Matrix

| Module / Feature | Priority | Test Type |
|---|---|---|
| Plan limit enforcement | P0 | Unit + Integration |
| M2 Stack — manifest detection | P0 | Unit |
| M3 Playbook — auto-complete logic | P0 | Unit |
| M3 Playbook — progress calculation | P0 | Unit |
| M5 Init — scaffold generation | P0 | Unit (ZIP validation) |
| Stripe webhook — idempotency | P0 | Integration |
| RLS policies — user isolation | P0 | Integration (DB layer) |
| M6 Decision — full-text search | P1 | Integration |
| M4 Template — stack filtering | P1 | Unit |
| M4 Template — staleness detection | P1 | Unit |
| Onboarding → first stack (E2E) | P0 | E2E |
| Playbook run → step toggle (E2E) | P0 | E2E |
| Plan upgrade flow (E2E) | P0 | E2E |

---

## 4. Unit Tests (Vitest)

### 4.1 Configuration

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'test/**', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

### 4.2 Plan Limit Tests

```ts
// __tests__/modules/plan-limits.test.ts
describe('planLimits', () => {
  it('free user cannot create 4th stack', async () => {
    await expect(
      assertPlanAllows({ plan: 'free' }, 'stacks', { currentCount: 3 })
    ).rejects.toThrow(PlanLimitError)
  })

  it('free user can create 3rd stack', async () => {
    await expect(
      assertPlanAllows({ plan: 'free' }, 'stacks', { currentCount: 2 })
    ).resolves.toBeUndefined()
  })

  it('solo user has unlimited stacks', async () => {
    await expect(
      assertPlanAllows({ plan: 'solo' }, 'stacks', { currentCount: 999 })
    ).resolves.toBeUndefined()
  })

  it('free user cannot access decision log', async () => {
    await expect(
      assertPlanAllows({ plan: 'free' }, 'decisionLog', { currentCount: 0 })
    ).rejects.toThrow(PlanLimitError)
  })
})
```

### 4.3 Manifest Detection Tests

```ts
// __tests__/modules/stacks/detect.test.ts
describe('detectFromManifest', () => {
  it('detects Next.js from package.json', () => {
    const content = JSON.stringify({
      dependencies: { next: '^16.0.0', '@supabase/supabase-js': '^2.0.0', stripe: '^14.0.0' }
    })
    const result = detectFromManifest('package.json', content)
    expect(result.detected).toContainEqual(expect.objectContaining({ toolId: 'nextjs' }))
    expect(result.detected).toContainEqual(expect.objectContaining({ toolId: 'supabase' }))
    expect(result.detected).toContainEqual(expect.objectContaining({ toolId: 'stripe' }))
  })

  it('ignores unknown packages', () => {
    const content = JSON.stringify({ dependencies: { 'some-unknown-lib': '^1.0.0' } })
    const result = detectFromManifest('package.json', content)
    expect(result.detected).toHaveLength(0)
    expect(result.unrecognized).toContain('some-unknown-lib')
  })
})
```

### 4.4 Auto-Complete Logic Tests

```ts
// __tests__/modules/playbooks/auto-complete.test.ts
describe('computeAutoCompletedSteps', () => {
  it('pre-checks steps when tool is in stack', () => {
    const playbook = {
      steps: [
        { id: 'step-1', title: 'Set up auth', auto_complete_tool_id: 'supabase' },
        { id: 'step-2', title: 'Add payments', auto_complete_tool_id: 'stripe' },
        { id: 'step-3', title: 'Write ToS', auto_complete_tool_id: undefined },
      ]
    }
    const stack = { tools: [{ toolId: 'supabase' }] }

    const result = computeAutoCompletedSteps(playbook, stack)
    expect(result).toEqual(['step-1'])
    expect(result).not.toContain('step-2')  // stripe not in stack
    expect(result).not.toContain('step-3')  // no auto_complete_tool_id
  })
})
```

### 4.5 ZIP Generation Tests

```ts
// __tests__/modules/init/generate.test.ts
describe('generateScaffold', () => {
  it('returns valid ZIP with expected files', async () => {
    const zip = await generateScaffold(testStackId, { name: 'test-project' })
    const files = await listZipContents(zip)

    expect(files).toContain('README.md')
    expect(files).toContain('.env.example')
    expect(files).toContain('.gitignore')
    expect(files).toContain('package.json')
  })

  it('.env.example contains Supabase vars for supabase stack', async () => {
    const stack = createTestStack({ tools: [{ toolId: 'supabase' }] })
    const envExample = buildEnvExample(stack)

    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_URL=')
    expect(envExample).toContain('SUPABASE_SERVICE_ROLE_KEY=')
  })

  it('rejects path traversal in template fragments', () => {
    expect(isWhitelistedPath('../../../etc/passwd')).toBe(false)
    expect(isWhitelistedPath('README.md')).toBe(true)
  })
})
```

---

## 5. Integration Tests (Supertest)

### 5.1 Setup

```ts
// test/setup.ts
import { execSync } from 'child_process'

beforeAll(async () => {
  // Seed test DB
  execSync('pnpm db:seed:test')
})

afterEach(async () => {
  // Clean created resources
  await cleanTestData()
})
```

### 5.2 Plan Limit Integration Test

```ts
// __tests__/api/stacks.test.ts
describe('POST /api/v1/stacks', () => {
  it('returns 402 when free user is at limit', async () => {
    const { token } = await createTestUser({ plan: 'free' })
    // Create 3 stacks (at limit)
    for (let i = 0; i < 3; i++) {
      await createTestStack(token)
    }
    // 4th should fail
    const res = await request(app)
      .post('/api/v1/stacks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Stack 4', tools: [] })

    expect(res.status).toBe(402)
    expect(res.body.code).toBe('PLAN_LIMIT')
    expect(res.body.resource).toBe('stacks')
    expect(res.body.current).toBe(3)
    expect(res.body.max).toBe(3)
  })

  it('returns 201 when solo user creates stack', async () => {
    const { token } = await createTestUser({ plan: 'solo' })
    const res = await request(app)
      .post('/api/v1/stacks')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Stack', tools: [] })
    expect(res.status).toBe(201)
  })
})
```

### 5.3 RLS Integration Test

```ts
// __tests__/rls/stacks.test.ts
describe('RLS: stacks', () => {
  it('user A cannot read user B\'s stack', async () => {
    const { supabase: clientA } = await createTestSession('user-a@test.com')
    const { supabase: clientB } = await createTestSession('user-b@test.com')

    // User B creates a stack
    const { data: stack } = await clientB.from('stacks').insert({ name: 'B Stack', tools: [] }).select().single()

    // User A tries to read it
    const { data, error } = await clientA.from('stacks').select().eq('id', stack.id)
    expect(data).toHaveLength(0)
  })
})
```

### 5.4 Stripe Webhook Test

```ts
// __tests__/api/webhooks/stripe.test.ts
describe('POST /api/v1/webhooks/stripe', () => {
  it('processes checkout.session.completed and updates plan', async () => {
    const event = createStripeEvent('checkout.session.completed', {
      metadata: { userId: testUser.id }
    })
    const sig = stripe.webhooks.generateTestHeaderString({
      payload: JSON.stringify(event),
      secret: process.env.STRIPE_WEBHOOK_SECRET!,
    })

    const res = await request(app)
      .post('/api/v1/webhooks/stripe')
      .set('stripe-signature', sig)
      .send(JSON.stringify(event))  // must be raw string

    expect(res.status).toBe(200)

    const updatedUser = await getUser(testUser.id)
    expect(updatedUser.plan).toBe('solo')
  })

  it('does not process duplicate event IDs', async () => {
    // Send same event twice
    await sendWebhookEvent(testEvent)
    const res = await sendWebhookEvent(testEvent)  // duplicate

    expect(res.status).toBe(200)
    // Verify plan only set once (no double processing)
  })
})
```

---

## 6. E2E Tests (Playwright)

### 6.1 Configuration

```ts
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
})
```

### 6.2 Critical E2E Flows

```ts
// e2e/onboarding.spec.ts
test('user signs up and creates first stack', async ({ page }) => {
  await page.goto('/login')
  // GitHub OAuth is mocked in test env via cookie injection
  await mockGitHubAuth(page, { email: 'test@test.com', name: 'Test User' })
  await expect(page).toHaveURL('/onboarding')

  // Step 1: project type
  await page.getByRole('button', { name: 'SaaS' }).click()
  await page.getByRole('button', { name: 'Next' }).click()

  // Step 2: build stack
  await page.getByRole('button', { name: 'Next.js' }).click()
  await page.getByRole('button', { name: 'Supabase' }).click()
  await page.getByRole('button', { name: 'Save stack' }).click()

  await expect(page).toHaveURL('/dashboard')
  await expect(page.getByText('My SaaS Stack')).toBeVisible()
})
```

```ts
// e2e/playbook.spec.ts
test('user starts playbook run and checks steps', async ({ page }) => {
  await loginAs(page, testUser)
  await page.goto('/playbooks')
  await page.getByText('New SaaS MVP').click()
  await page.getByRole('button', { name: 'Start run' }).click()
  await page.getByLabel('Project name').fill('My Startup')
  await page.getByRole('button', { name: 'Start' }).click()

  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', /.+/)

  // Check a step
  await page.getByRole('checkbox').first().click()
  await expect(page.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow', '0')
})
```

---

## 7. What NOT to Test

| Anti-pattern | Why |
|---|---|
| Snapshot tests | Fragile; break on any visual change; low signal |
| Mocking the DB in integration tests | Defeats the purpose; RLS and query correctness untested |
| Testing Drizzle internals | We trust the library; test our business logic only |
| Testing Stripe library calls | Mock only at integration boundary (webhook endpoint) |
| Testing RSC render output | Test data-fetching functions; let Playwright test rendered output |
| Implementation detail tests | If renaming a private function breaks a test, the test is wrong |

---

## 8. CI Test Execution

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: |
    pnpm typecheck
    pnpm lint
    pnpm test --run --reporter=verbose
    pnpm build

# On merge to main (staging):
- name: E2E tests
  run: pnpm test:e2e
  env:
    E2E_BASE_URL: https://staging.scaffold.app
```

**Coverage targets:** No hard coverage % enforced — high-value logic tests over coverage theater.