---
name: release
description: >-
  Prepare a release locally and open the release PR. Triggers on "run the release",
  "prepare a release", "/release", "зроби реліз", "підготуй реліз". Does the two steps that need a
  human and a running app: bumps the version (bump-version) and generates the user guide with real
  screenshots (generate-user-docs, against your locally running app — CI can't boot it). Then
  commits both, pushes the branch, and opens ONE pull request. Merging that PR is the gate: CI
  writes the changelog and release notes, tags, publishes the GitHub Release, announces on Telegram,
  and publishes the guide to the Redmine wiki. This skill never writes the changelog or notes, never
  tags, and never sends anything outbound — the merge does all of that.
allowed-tools: Bash(./scripts/next-version.sh), Bash(node scripts/capture-screenshots.mjs), Bash(npm run shoot), Bash(npm run shoot:install), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(git branch:*), Bash(git rev-parse:*), Bash(gh pr create:*), Bash(gh pr view:*), Read(lib/**), Read(app/**), Read(docs/**), Read(package.json), Edit(package.json), Write(docs/user-guide/**)
user-invocable: true
disable-model-invocation: true
argument-hint: ''
model: claude-haiku-4-5
effort: medium
---

# Skill: release (local prep, then open the release PR)

Goal: do the part of a release that has to happen locally — decide the version and
generate the user guide from the **running app** — then open one PR. Merging that
PR is the single gate; CI does the rest (changelog, notes, tag, GitHub Release,
Telegram, Redmine). You review two small things locally (the bump, the guide) and
one thing on GitHub (the PR), then merge.

Why these two steps are local: the user guide is built around **real screenshots
of the running app**, and CI can't reliably boot the app to shoot them — but you
already have it up (`npm run dev`). So the screenshot-and-guide step runs here,
where the app runs, and rides into the PR. The changelog and notes need no app —
they read the merged history — so they run in CI on the merge.

## Inputs

- The Conventional-Commit history since the last tag.
- A **running app** at `http://localhost:3000` for the screenshots — start `npm run dev` first.
- `bump-version`, `generate-user-docs` — the two stage skills this sequences.

## Protocol

Run the two stages in order, pausing after each for review. Then push and open the PR.

1. **Version.** Follow `bump-version`: run `./scripts/next-version.sh`, explain which part moved and why, edit `version` in `package.json`. → **Pause:** show the `package.json` diff.
2. **User guide.** Follow `generate-user-docs`: run `node scripts/capture-screenshots.mjs` against the running app, then write `docs/user-guide/*.md` around the shots. → **Pause:** show `ls docs/user-guide` and the new images; you skim the guide.
3. **Open the release PR.** Commit the bump and the guide on the current feature branch, push it, and open one PR to the base branch:

   ```
   git add package.json docs/user-guide
   git commit -m "release: v<new> (version + user guide)"
   git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
   gh pr create --fill
   ```

   Show the PR url with `gh pr view --web`. → **Stop here.** Merging this PR is the gate that fires the release in CI.

At the end, restate the one human action left: review and **merge the PR** — that runs `.github/workflows/release.yml`, which writes the changelog and notes, tags `v<new>`, publishes the GitHub Release, announces on Telegram, and publishes the guide to Redmine.

## Definition of Done

- `package.json` holds the new version (from `next-version.sh`), with a one-line explanation of which part moved.
- `docs/user-guide/**` holds the guide with **real** screenshots of the running app.
- Both are committed, the branch is pushed, and exactly one PR is open.
- Nothing else happened: no changelog, no release notes, no tag, no Telegram, no Redmine. The merge does all of that.

## Anti-patterns

- **Writing the changelog or notes here.** Those are the merge gate's job (CI), from the merged history. Doing them locally duplicates work and drifts from what CI will produce.
- **Tagging or sending anything outbound.** No tag, no Telegram, no Redmine in this skill. The merge fires those.
- **Skipping the guide because the app is not up.** Start `npm run dev` and shoot — a guide built on real screenshots is the whole reason this step is local.
- **Opening more than one PR.** One PR carries the bump and the guide; merging it is the single gate.

## References

- `bump-version`, `generate-user-docs` — the two local stages this skill sequences.
- `.github/workflows/release.yml` — the merge gate: changelog + notes + tag + GitHub Release + Telegram + Redmine, on the PR merge.
