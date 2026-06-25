#!/usr/bin/env bash
#
# reset-demo.sh — put the demo back so it can be re-recorded.
#
# Reverts the working-tree edits the pipeline makes (version, changelog, doc fix,
# codified rules), removes the feature worktree + branch, and drops the throwaway
# pipeline branches and v0.2.0+ tags — keeping the v0.1.0 baseline. Local only; a
# Release-PR / draft Release left on GitHub from a live take you close by hand.
#
# Usage:  ./reset-demo.sh [worktree-path]
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WT="${1:-../course-project-tags}"

# 1. Revert working-tree edits from a take (version bump, changelog, doc fix, rules).
git checkout -- package.json docs/CHANGELOG.md docs/api.md .claude/rules/ 2>/dev/null || true
git clean -fdq .claude/rules/ 2>/dev/null || true

# 2. Remove the feature worktree and its branch.
git worktree remove --force "$WT" 2>/dev/null || true
git branch -D feat/meme-tags 2>/dev/null || true

# 3. Drop throwaway pipeline branches from earlier takes.
git checkout -q main 2>/dev/null || true
while IFS= read -r b; do
  [[ -n "$b" ]] && git branch -D "$b" >/dev/null 2>&1 || true
done < <(git branch --format='%(refname:short)' | grep -E '^(changelog|release-notes|docs-drift)/' || true)

# 4. Drop local v0.2.0+ tags, keep the v0.1.0 baseline.
while IFS= read -r t; do
  [[ -n "$t" ]] && git tag -d "$t" >/dev/null 2>&1 || true
done < <(git tag | grep -vx 'v0.1.0' || true)

echo "Reset: on main, only v0.1.0 remains, feature worktree removed."
echo "Re-run ./setup-demo.sh to record again. (Remote PR/draft from a live take: close by hand.)"
