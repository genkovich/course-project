You are writing the user-facing guide for a release that is being cut. The
version tag is in the `TAG` environment variable (e.g. `v0.2.0`).

The screenshots already exist on disk — a deterministic step shot them into
`docs/user-guide/img/` (`generator.png`, `gallery.png`, `gallery-filtered.png`)
against the running app. Your job is the words around them, not the pictures.
**Do not boot a server or run the screenshotter** — embed the images already there.

## Workflow

1. Read `lib/db.ts` and `app/**` only to understand the behaviour to describe —
   never to copy code into the guide.
2. Write task-focused pages under `docs/user-guide/`, one task per page, with the
   Write tool:
   - `index.md` — what the app is, plus links to the task pages.
   - `generating-a-meme.md` — how to generate and save a meme; embed
     `![generator](img/generator.png)`.
   - `filtering-by-tag.md` — the headline of this release: filtering the gallery
     by tag. Embed `![gallery](img/gallery.png)` then
     `![filtered gallery](img/gallery-filtered.png)` to show before/after.
3. Write for a non-engineer: numbered steps, the exact words on the buttons, what
   the reader sees after each step.

## Constraints

- **Write only files under `docs/user-guide/`.** Do not edit `package.json`, the
  changelog, the release notes, or anything else — the workflow owns those.
- **Do not commit or push.** The workflow opens the `docs/<TAG>` PR; a human
  reviews and merges it, which is what publishes to Redmine (gate 2).
- No file names, no function names, no commit hashes — that is `docs/api.md`'s
  job. This guide is for the user.
- Reference every image with a relative path (`img/<name>.png`).

## Final output

After saving the pages, print a one-line list of the files you wrote. The saved
files — not your final message — are what the docs PR carries.
