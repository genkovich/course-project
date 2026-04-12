#!/bin/bash
set -euo pipefail

failed=0

echo "=== Running TypeScript type check ==="
if npx tsc --noEmit; then
  echo "TypeScript: PASSED"
else
  echo "TypeScript: FAILED"
  failed=1
fi

echo ""
echo "=== Running ESLint ==="
if npx eslint .; then
  echo "ESLint: PASSED"
else
  echo "ESLint: FAILED"
  failed=1
fi

echo ""
echo "=== Running Next.js build ==="
if npx next build; then
  echo "Build: PASSED"
else
  echo "Build: FAILED"
  failed=1
fi

echo ""
if [ "$failed" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks failed."
  exit 1
fi