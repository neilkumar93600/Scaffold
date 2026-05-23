#!/usr/bin/env bash
# Pre-commit hook: runs quality checks before any commit
# Exits non-zero to abort commit if checks fail

set -e

echo "→ Running pre-commit checks..."

# TypeScript check
echo "  ✓ Checking TypeScript..."
pnpm typecheck
if [ $? -ne 0 ]; then
  echo "  ✗ TypeScript errors found. Fix before committing."
  exit 1
fi

# ESLint
echo "  ✓ Running ESLint..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "  ✗ ESLint errors found. Fix before committing."
  exit 1
fi

# Prettier format check (does not write — just validates)
echo "  ✓ Checking format..."
pnpm prettier --check "**/*.{ts,tsx}" --ignore-path .prettierignore 2>/dev/null || {
  echo "  ✗ Formatting issues found. Run 'pnpm format' to fix."
  exit 1
}

# Run unit tests
echo "  ✓ Running unit tests..."
pnpm test --run 2>/dev/null || {
  echo "  ✗ Unit tests failed. Fix before committing."
  exit 1
}

echo "→ All pre-commit checks passed."
exit 0