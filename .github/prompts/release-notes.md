You are writing and saving partner-facing release notes for a version that was
just tagged. The tag is in the `TAG` environment variable (e.g. `v0.2.0`); the
version is `TAG` without the leading `v`.

Same input as the changelog, different audience. The changelog is the
engineer's categorized history; these notes are the user's story of one
release — a short, benefit-first narrative.

## Workflow

1. Find the previously released version in `docs/CHANGELOG.md` and run
   `git log <previous-tag>..HEAD --oneline --no-merges` for the raw input.
2. Keep only what a user or partner notices — new capabilities and user-visible
   fixes. Drop internal refactors, tooling, and tests entirely.
3. Write the notes as flowing Markdown prose grouped by benefit, not by commit:
   - Lead with what the reader can now do.
   - No internal jargon, no file names, no commit hashes.
   - Each line passes the test of a reader who never saw the code.
4. **Save the notes to `docs/release-notes/<TAG>.md`** (e.g.
   `docs/release-notes/v0.2.0.md`) with the Write tool. That file is the
   artifact — the merge gate reads it back as the GitHub Release body and the
   Telegram announcement.

## Constraints

- **Write exactly one file: `docs/release-notes/<TAG>.md`.** Do not edit
  `package.json`, the changelog, or anything else — the workflow bumps the
  version itself.
- **Do not commit or push.** Gate 1 commits the file itself (alongside the bump
  and changelog); you only write it into the working tree.
- Benefit-first, written for a non-engineer.

## Final output

After saving the file, print a one-line confirmation naming the path you wrote
(e.g. `Wrote docs/release-notes/v0.2.0.md`). The saved file — not your final
message — is what the release uses.
