---
name: generate-user-docs
description: >-
  Generate the user-facing guide for this release, with real screenshots. Triggers on
  "generate the user docs", "write the user guide", "/generate-user-docs", "згенеруй документацію",
  "користувацька документація". Runs the deterministic scripts/capture-screenshots.mjs (Playwright —
  NO LLM renders the picture) to shoot the app's key screens into docs/user-guide/img/, then WRITES
  the guide pages under docs/user-guide/*.md, embedding those shots. The screenshotter is the rule;
  the agent writes the words around it. This is a gate-1 step: it prepares docs/user-guide/** in the
  working tree for the docs/vX.Y.Z PR — it never commits, pushes, or publishes to Redmine.
allowed-tools: Bash(node scripts/capture-screenshots.mjs), Bash(npm run shoot), Bash(npm run shoot:install), Bash(ls docs/user-guide/**), Read(lib/**), Read(app/**), Read(docs/**), Read(package.json), Write(docs/user-guide/**)
user-invocable: true
disable-model-invocation: true
argument-hint: ''
model: claude-haiku-4-5
effort: medium
---

# Skill: generate-user-docs

Goal: produce the **user's** documentation for this release — short task-focused pages a non-engineer follows, each anchored by a real screenshot of the running app. This is the active counterpart to the old drift check: instead of detecting that docs fell behind, it *generates* the docs the feature now needs.

This is the **"deterministic script vs agent writes"** split again. `scripts/capture-screenshots.mjs` renders the pictures (Playwright, no LLM). This skill writes the words around them. The screenshots are facts; the prose is the explanation.

It is the fourth stage of gate 1 (`/release`). It only prepares `docs/user-guide/**` in the working tree — the `docs/vX.Y.Z` PR carries it, and gate 2 (`/publish-redmine`) publishes it later. This skill never commits, pushes, or talks to Redmine.

## Inputs

- A **running app** at `http://localhost:3000` (set `BASE_URL` to point elsewhere). The script probes it — it does **not** boot the server. Start `npm run dev` (or `npm run build && npm start`) first.
- `scripts/capture-screenshots.mjs` — the deterministic screenshotter.
- `lib/db.ts`, `app/**` — the real behaviour the guide describes.
- `docs/release-notes/v<version>.md` (if present) — the same release in the partner's words; align the guide's framing with it.
- `templates/page.md` — the shape of one guide page.

## Protocol

1. **Shoot the screens first — do not hand-write or invent images.** Run exactly:

   ```
   node scripts/capture-screenshots.mjs
   ```

   It writes `docs/user-guide/img/generator.png`, `gallery.png`, and `gallery-filtered.png`, and prints the list. If it exits non-zero, the server is not up — start it and re-run. (The first run on a clean machine needs the browser binary: `npm run shoot:install`.)

2. **Write the guide pages** under `docs/user-guide/`, following `templates/page.md`. One page per task a user actually does:
   - `index.md` — what the app is, and links to the task pages.
   - `generating-a-meme.md` — embeds `img/generator.png`.
   - `filtering-by-tag.md` — the headline of this release; embeds `img/gallery.png` and `img/gallery-filtered.png`.
   Reference each image with a relative path (`![...](img/gallery-filtered.png)`).

3. **Write for the user, not the engineer.** Numbered steps, the words on the actual buttons, what the reader sees after each step. No file names, no function names, no commit hashes — that is what `docs/api.md` is for.

4. **Leave it in the working tree.** Show `ls docs/user-guide` and a short summary. Do not commit, push, or publish. The `docs/vX.Y.Z` PR (gate 1) carries these files; a human merges it, which is what fires gate 2.

## Definition of Done

- `scripts/capture-screenshots.mjs` ran and wrote the PNGs into `docs/user-guide/img/` — the images are captures of the real app, not placeholders.
- Each guide page under `docs/user-guide/*.md` embeds its screenshot and reads as user-facing prose.
- `filtering-by-tag.md` shows the before/after of the tag filter (`gallery.png` → `gallery-filtered.png`) — the headline of the release.
- Nothing was committed, pushed, or sent to Redmine. The working tree holds `docs/user-guide/**`.

## Anti-patterns

- **Writing the guide without running the screenshotter.** The pictures come from the script against the live app. A guide with no shots, or with invented shots, is not this skill's output.
- **Booting the server from inside the skill.** The script only probes `:3000`; if it is down, ask the human to start it. Long-running `npm run dev` is not the skill's job.
- **Leaking internals.** `listMemesByTag`, `route.ts`, SQL — none of that belongs in a user guide. Describe the button and the result.
- **Committing, pushing, or publishing to Redmine.** Gate 1 ends at the working tree; the PR carries it; gate 2 publishes. Crossing that line collapses the two gates this pipeline exists to separate.

## References

- `scripts/capture-screenshots.mjs` — the deterministic screenshotter.
- `templates/page.md` — user-guide page scaffold.
- `publish-redmine` — the gate-2 skill that ships these pages to the Redmine wiki after the docs-PR merges.
