# Command: fix-issue

## Usage
```
/fix-issue <issue-number-or-description>
```

## What It Does
Investigates a bug or issue, finds the root cause, writes a failing test, applies a minimal fix, confirms the test passes, and prepares a commit.

## Steps

### 1. Understand the Issue
- Read the issue description carefully
- Identify which module is affected: `lib/modules/{auth,stacks,playbooks,templates,init,decisions}/`
- Check `app/api/v1/` for the relevant API route
- Check Sentry for any server-side stack trace

### 2. Reproduce
- Write the minimal reproduction steps
- Identify the exact error message and HTTP status code (if API issue)

### 3. Write a Failing Test
Before touching production code, write a test that:
- Demonstrates the bug (test should FAIL currently)
- Is placed in the appropriate test file: `__tests__/[module].test.ts`
- Uses Vitest for unit/integration, Playwright for E2E flows

```bash
pnpm test -- --reporter=verbose [test-file]
# Should see the new test FAIL
```

### 4. Fix
- Apply the minimal change that addresses the root cause
- Do NOT refactor surrounding code in the same commit
- Run `pnpm typecheck` to confirm no TS errors

### 5. Verify
```bash
pnpm test          # All tests must pass
pnpm typecheck     # No TS errors
pnpm lint          # No lint errors
```

### 6. Commit
Commit message format:
```
fix: [short description of what was broken]

Root cause: [one sentence]
Fixes: #[issue-number]
```

## Rules
- Never fix without a failing test first
- Fix the minimum — no refactoring in fix commits
- If the fix requires a DB migration, note it separately — don't bundle with the fix commit
- If the issue turns out to be a security vulnerability, stop and escalate