#!/usr/bin/env bash
#
# setup-demo.sh — make the 9.7 release demo recordable ON THIS repo.
#
# From a clean checkout, `main` already carries the release tooling (skills,
# workflows, scripts, docs) as the v0.1.0 baseline — WITHOUT the feature. This
# script lands the release driver — feat: filter memes by tag — as a real commit
# in an isolated git WORKTREE on branch feat/meme-tags, by applying the tracked
# patch scripts/feature-tags.patch. Keeping the feature in a patch (not in the
# working tree) is what lets the demo survive a fresh `git clone`.
#
# After this you record the one-gate pipeline:
#
#   worktree (feat/meme-tags) -> /release: bump + user guide (real screenshots),
#      then push + open ONE PR
#   -> merge that PR -> THE GATE (release.yml): changelog + notes + tag + GitHub
#      Release + Telegram + Redmine wiki.
#
# Usage:  ./setup-demo.sh [worktree-path]
#   worktree-path  default: ../course-project-tags
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

WT="${1:-../course-project-tags}"
BRANCH="feat/meme-tags"
PATCH="scripts/feature-tags.patch"

command -v git >/dev/null || { echo "git required" >&2; exit 1; }
[[ -f "$PATCH" ]] || { echo "missing $PATCH (the feature patch)" >&2; exit 1; }

# --- 1. Point the v0.1.0 baseline tag at the current main -----------------------
# The tooling baseline is already committed on main; (re)tag it so next-version.sh
# has a baseline to count from. There is no feature here yet — that lives in the
# worktree below, so the only release-worthy commit after v0.1.0 is the feat.
echo "› tagging the current main as the v0.1.0 baseline"
git tag -f v0.1.0 >/dev/null
echo "  v0.1.0 -> $(git rev-parse --short HEAD)"

# --- 2. Isolated worktree for the feature (the worktree flow) ------------------
echo "› creating worktree $WT on branch $BRANCH"
git worktree remove --force "$WT" 2>/dev/null || true
git branch -D "$BRANCH" 2>/dev/null || true
git worktree add -q -b "$BRANCH" "$WT"

# --- 3. Land the feature as a real commit in the worktree (from the patch) ------
echo "› applying $PATCH and committing the feature in the worktree"
git -C "$WT" apply "$PATCH"
git -C "$WT" add lib/db.ts lib/seed.ts app/api/memes/route.ts app/gallery/page.tsx
git -C "$WT" commit -q -m "feat: filter memes by tag"

# --- 4. Seed the worktree's database -------------------------------------------
# data.db is gitignored and auto-seeds on first boot (templates, captions, and
# the pre-tagged SEED_MEMES in lib/seed.ts). Clear any stale copy so the gallery
# and the /gallery?tag=dev screenshot come up seeded the first time you run it.
rm -f "$WT"/data.db "$WT"/data.db-shm "$WT"/data.db-wal 2>/dev/null || true

cat <<EOF

Ready. Baseline v0.1.0 is on main; the feature lives in an isolated worktree:

    cd $WT                 # the feat/meme-tags worktree
    npm install            # first time in this worktree
    ./scripts/next-version.sh        # 0.2.0 (a feat landed -> MINOR)
    npm run dev            # seeds data.db; /gallery?tag=dev already filters

Record from there: with the app running (npm run dev), call /release — it bumps the
version, generates the user guide with real screenshots, and opens ONE PR. Merge
that PR to fire THE GATE (release.yml): changelog + notes + tag + GitHub Release +
Telegram + Redmine. See RECORD.md for the full beat-by-beat runbook.
Reset with ./reset-demo.sh.
EOF
