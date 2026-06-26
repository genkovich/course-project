#!/usr/bin/env bash
#
# reset-demo.sh — put the demo back so it can be re-recorded.
#
# Reverts the working-tree edits /release makes (version, the generated user
# guide, codified rules), removes the feature worktree + branch, and drops any
# stray pipeline branches and v0.2.0+ tags — keeping the v0.1.0 baseline. Local
# only; a PR / Release left on GitHub from a live take you close by hand.
#
# Usage:  ./reset-demo.sh [worktree-path]
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WT="${1:-../course-project-tags}"

# 1. Revert working-tree edits from a take (version bump, changelog, rules).
git checkout -- package.json docs/CHANGELOG.md .claude/rules/ 2>/dev/null || true
git clean -fdq .claude/rules/ 2>/dev/null || true

# 2. Drop the generated artifacts (notes, the user guide + its screenshots, db).
rm -f docs/release-notes/v*.md 2>/dev/null || true
rm -f docs/user-guide/img/*.png 2>/dev/null || true
git checkout -- docs/user-guide 2>/dev/null || true
rm -f data.db data.db-shm data.db-wal 2>/dev/null || true
rm -f "$WT"/data.db "$WT"/data.db-shm "$WT"/data.db-wal 2>/dev/null || true

# 3. Remove the feature worktree and its branch.
git worktree remove --force "$WT" 2>/dev/null || true
git branch -D feat/meme-tags 2>/dev/null || true

# 4. Drop throwaway docs/* pipeline branches from earlier takes.
git checkout -q main 2>/dev/null || true
while IFS= read -r b; do
  [[ -n "$b" ]] && git branch -D "$b" >/dev/null 2>&1 || true
done < <(git branch --format='%(refname:short)' | grep -E '^docs/' || true)

# 5. Drop local v0.2.0+ tags, keep the v0.1.0 baseline.
while IFS= read -r t; do
  [[ -n "$t" ]] && git tag -d "$t" >/dev/null 2>&1 || true
done < <(git tag | grep -vx 'v0.1.0' || true)

echo "Reset: on main, only v0.1.0 remains, feature worktree removed."
echo "Re-run ./setup-demo.sh to record again. (Remote PR/Release from a live take: close by hand.)"
