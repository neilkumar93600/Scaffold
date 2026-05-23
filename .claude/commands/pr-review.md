# Command: pr-review

## Usage
```
/pr-review <PR-number-or-branch>
```

## What It Does
Conducts a thorough review of a pull request using the `code-reviewer` and `security-auditor` agents. Produces a structured review comment ready to post on GitHub.

## Review Process

### 1. Fetch the Diff
```bash
git fetch origin
git diff main...<branch-name>
```

### 2. Understand the Change
- Read the PR description and linked issue
- Identify which modules are touched: `lib/modules/`, `app/api/v1/`, `components/`
- Check if DB migrations are included

### 3. Run Automated Checks
```bash
git checkout <branch>
pnpm install       # Ensure deps are correct
pnpm lint          # Must be clean
pnpm typecheck     # Must be clean
pnpm test          # All tests must pass
```

### 4. Code Review (code-reviewer agent)
Apply the full code-reviewer checklist from `.claude/agents/code-reviewer.md`:
- Correctness
- Security
- Performance
- Conventions
- Testing

### 5. Security Audit (security-auditor agent)
Apply the security audit from `.claude/agents/security-auditor.md`:
- Input validation
- Auth + authorization
- Plan enforcement
- Injection vectors
- Secrets

### 6. DB Migration Review (if migrations present)
- Confirm additive-only (no drops, no renames)
- Confirm RLS policies exist for any new tables
- Confirm indexes exist for new `user_id`, `team_id` columns
- Confirm migration is reversible (or rollback strategy documented)

### 7. API Contract Review (if new endpoints)
- Confirm endpoint documented in `doc/TRD.md` API Contracts section
- Confirm Zod schema exists in `lib/validations/`
- Confirm plan limit check present if endpoint creates a resource

## Output Format

```markdown
## PR Review: [PR title] (#[number])

### Automated Checks
- [ ] lint: PASS | FAIL
- [ ] typecheck: PASS | FAIL
- [ ] tests: PASS | FAIL (X/Y passing)

### Blocking Issues (must fix before merge)
- **[CRITICAL]** `path/to/file.ts:42` — [description]

### Non-blocking Issues (should fix)
- **[MINOR]** `path/to/file.ts:99` — [description]

### Security Findings
- **[HIGH]** [description] — [file:line]

### Migration Notes (if applicable)
- [Observations about schema changes]

### Summary
[2–3 sentences on overall quality and what this PR does]

### Verdict
✅ APPROVE | 🔄 REQUEST CHANGES | 💬 COMMENT

---
*Reviewed by claude code-reviewer + security-auditor*
```

## Rules
- Automated checks must pass before human review starts — if they fail, request fixes first
- All Critical and High security findings block merge regardless of other positives
- Be specific: file + line number for every finding
- If PR touches billing code, the security-auditor's plan enforcement check is mandatory
- If PR adds a new table, RLS policy audit is mandatory