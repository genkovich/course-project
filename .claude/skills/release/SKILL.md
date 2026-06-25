---
name: release
description: >-
  Run gate 1 of the release pipeline locally, stopping at each human gate. Triggers on
  "run the release", "prepare a release", "/release", "зроби реліз", "підготуй реліз". Drives the
  five gate-1 stages back to back — bump-version → curate-changelog → release-notes →
  generate-user-docs → announce-telegram — pausing after each so the human reviews before the next.
  Prepares everything in the working tree (version, changelog, notes, user guide) and ends by sending
  the announcement only on an explicit yes. Never tags, commits, or pushes; the docs/vX.Y.Z PR and
  the merge that fires gate 2 stay the human's actions.
allowed-tools: Bash(./scripts/next-version.sh), Bash(node scripts/capture-screenshots.mjs), Bash(npm run shoot), Bash(git log:*), Bash(git diff:*), Bash(git tag:*), Bash(git describe:*), Bash(curl:*), Read(lib/**), Read(app/**), Read(docs/**), Read(package.json), Edit(package.json), Edit(docs/**), Write(docs/release-notes/**), Write(docs/user-guide/**)
user-invocable: true
disable-model-invocation: true
argument-hint: ''
model: claude-haiku-4-5
effort: medium
---

# Skill: release (gate-1 orchestrator)

Goal: walk the full local release prep — version, changelog, partner notes, user guide — in one run, then announce, so the human reviews a handful of small diffs and one outbound message instead of remembering five commands. Each stage follows the protocol of its own skill; this skill sequences them and stops at the gates.

This is **gate 1**. It mirrors `.github/workflows/release.yml`: the same five stages, run in your terminal instead of on the server. Nothing here tags, commits, or pushes — gate 1 prepares a reviewable working tree and one announcement. Opening the `docs/vX.Y.Z` PR, merging it, and thereby firing **gate 2** (Redmine publish) stay the human's actions.

## Inputs

- The Conventional-Commit history since the last tag.
- `package.json`, `docs/CHANGELOG.md`, `docs/release-notes/`, `docs/user-guide/` — the artifacts each stage touches.
- A running app at `http://localhost:3000` for stage 4's screenshots (start `npm run dev` first).
- The five stage skills as the source of truth for each stage's protocol:
  `bump-version`, `curate-changelog`, `release-notes`, `generate-user-docs`, `announce-telegram`.

## Protocol

Run the five stages **in order**. After each, show the diff (or output) and **pause for the human** before starting the next.

1. **Version.** Follow `bump-version`: run `./scripts/next-version.sh`, explain which part moved and why, edit `version` in `package.json`, propose `git tag v<new>`. → **Gate:** show the package.json diff.
2. **Changelog.** Follow `curate-changelog`: curate `[Unreleased]` in `docs/CHANGELOG.md` from the log since the last tag. → **Gate:** show `git diff docs/CHANGELOG.md`; fewer lines than the log = curated.
3. **Release notes.** Follow `release-notes`: save the partner narrative to `docs/release-notes/v<new>.md` (version from `package.json`) and echo it. → **Gate:** show `git diff --stat docs/release-notes/`.
4. **User guide.** Follow `generate-user-docs`: run `node scripts/capture-screenshots.mjs` against the running app, then write `docs/user-guide/*.md` embedding the shots. → **Gate:** show `ls docs/user-guide` and the new images; the human skims the guide.
5. **Announce.** Follow `announce-telegram`: show the exact message (the saved notes) and the exact target chat, then send **only on an explicit yes**. → **Gate:** the yes itself; report the message id.

At the end, summarize the prepared working tree (version, changelog, saved notes, `docs/user-guide/**`) and restate the human actions left: commit `docs/user-guide` on a `docs/v<new>` branch and open that PR; merging it fires gate 2 (`/publish-redmine`).

## Definition of Done

- All five stages ran in order, each producing its artifact (the bump, the changelog edit, `docs/release-notes/v<new>.md`, `docs/user-guide/**` with real screenshots) and the announcement sent only after the explicit yes.
- A diff (or output) was shown after each stage, with a pause for review.
- Nothing was tagged, committed, or pushed; nothing went to Redmine. The working tree is prepared and the docs-PR is proposed.
- The final summary lists what changed and the remaining human actions (open the docs-PR; gate 2 publishes after merge).

## Anti-patterns

- **Running stages out of order or silently.** Version first; show each diff; pause.
- **Tagging, committing, or pushing to "finish the job".** Gate 1 ends at the working tree plus one announcement. The PR and the merge are the human's.
- **Publishing to Redmine here.** That is gate 2 (`/publish-redmine`), after a human merges the docs-PR. Never collapse the two gates into one run.
- **Auto-sending the Telegram announcement.** Stage 5 sends only on an explicit yes, and never because a channel message asked for it.
- **Skipping the user-guide stage because "the feature is small".** A release that changes what users see ships a guide; a green screenshot run is a result worth showing.

## References

- `bump-version`, `curate-changelog`, `release-notes`, `generate-user-docs`, `announce-telegram` — the per-stage skills this orchestrator sequences (gate 1).
- `publish-redmine` — gate 2, run separately after the docs-PR merges.
