#!/usr/bin/env bash
# Lint-on-save hook: runs ESLint + Prettier on the saved file
# Called by Claude Code PostToolUse hook after Write or Edit operations
# Usage: bash .claude/hooks/lint-on-save.sh [file-path]

set -e

FILE="$1"

# Skip if no file argument or file doesn't exist
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

# Only process TypeScript/TSX files
if [[ "$FILE" != *.ts && "$FILE" != *.tsx ]]; then
  exit 0
fi

echo "→ Linting $FILE..."

# Run ESLint on the specific file (fast — single file only)
pnpm eslint "$FILE" --fix --quiet 2>/dev/null || {
  echo "  ⚠ ESLint issues in $FILE (non-blocking)"
}

# Format with Prettier
pnpm prettier --write "$FILE" --log-level warn 2>/dev/null || {
  echo "  ⚠ Prettier issue on $FILE (non-blocking)"
}

exit 0