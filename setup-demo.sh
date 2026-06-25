#!/usr/bin/env bash
#
# setup-demo.sh — make the 9.7 release demo recordable ON THIS repo.
#
# It commits the release tooling (skills, workflows, scripts, docs) as the
# v0.1.0 baseline, then stages the "tags" feature in an isolated git WORKTREE on
# branch feat/meme-tags — the release driver, developed off to the side. After
# this you record the full pipeline:
#
#   worktree (feat/meme-tags) -> /bump-version -> open PR (version + docs-drift
#   comment) -> /curate-changelog + /release-notes -> /check-docs-drift -> merge
#   -> git tag v0.2.0 -> changelog Release-PR + draft Release.
#
# Usage:  ./setup-demo.sh [worktree-path]
#   worktree-path  default: ../course-project-tags
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WT="${1:-../course-project-tags}"
BRANCH="feat/meme-tags"

command -v git >/dev/null || { echo "git required" >&2; exit 1; }

# --- 1. Commit the release tooling as the v0.1.0 baseline (no feature yet) ----
echo "› committing release tooling as the v0.1.0 baseline"
git add .claude/skills .claude/rules .github docs scripts setup-demo.sh reset-demo.sh RECORD.md
git commit -q -m "chore: add release pipeline (skills, workflows, scripts, docs)"
git tag -f v0.1.0
echo "  tagged v0.1.0 at $(git rev-parse --short HEAD)"

# --- 2. Isolated worktree for the feature (the worktree flow) ----------------
echo "› creating worktree $WT on branch $BRANCH"
git worktree remove --force "$WT" 2>/dev/null || true
git branch -D "$BRANCH" 2>/dev/null || true
git worktree add -q -b "$BRANCH" "$WT"

# --- 3. Apply the tags feature in the worktree and commit the release driver --
echo "› applying the tags feature in the worktree"
git -C "$WT" apply "$(pwd)/scripts/feature-tags.patch"
git -C "$WT" add lib app
git -C "$WT" commit -q -m "feat: filter memes by tag"

cat <<EOF

Ready. Baseline v0.1.0 is on main; the feature lives in an isolated worktree:

    cd $WT                 # the feat/meme-tags worktree
    ./scripts/next-version.sh        # 0.2.0 (a feat landed -> MINOR)
    node scripts/check-docs-drift.mjs  # flags listMemesByTag undocumented

Record from there: /bump-version, push the branch + open a PR (the version and
docs-drift workflows comment on it), /curate-changelog + /release-notes,
/check-docs-drift, then merge and 'git tag v0.2.0 && git push origin v0.2.0'.
See RECORD.md for the full beat-by-beat runbook. Reset with ./reset-demo.sh.
EOF
