---
name: release-notes
description: >-
  Draft and save partner-facing release notes from the same commits as the changelog. Triggers on
  "draft release notes", "release notes for the next version", "/release-notes", "нотатки релізу",
  "release notes партнеру". Same input as curate-changelog, different audience and tone: a short,
  benefit-first narrative for a user or partner — "what's new for you" — not a categorized engineer's
  list. Keeps only changes a user actually notices; drops internal refactors and tooling. Saves the
  notes to docs/release-notes/vX.Y.Z.md (the version comes from package.json) and echoes them in the
  chat, to seed a GitHub Release description or a partner announcement.
allowed-tools: Bash(git log:*), Bash(git describe:*), Bash(git tag:*), Read(docs/**), Read(package.json), Write(docs/release-notes/**)
user-invocable: true
disable-model-invocation: true
argument-hint: ''
model: claude-haiku-4-5
effort: low
---

# Skill: release-notes

Goal: write **and save** the human announcement of this release — a flowing, benefit-first narrative a non-engineer reads and immediately knows what changed for them — to a versioned file the release CI and a human both reuse.

Same commits as `curate-changelog`, different audience. The changelog is the engineer's categorized history; release notes are the user's story of one release. One input, two outputs — that contrast is the whole point.

This skill is the partner half of the **bump + save** pair: `bump-version` decides and applies the number; this skill saves the story of that number. Run after `bump-version`, so `package.json` already holds the version that names the file.

## Inputs

- The commits since the last release (`git log <tag>..HEAD`) — the same raw input the changelog uses.
- `package.json` — the version that names the file (set by `bump-version`).
- `templates/release-notes.md` — the narrative shape.

## Protocol

1. **Read the version** from `package.json` — it is the new number `bump-version` just applied. The notes file is `docs/release-notes/v<version>.md` (with the leading `v`). If `package.json` still holds the old version, run `bump-version` first.
2. **Find the baseline** in `docs/CHANGELOG.md` and run `git log <latest-tag>..HEAD --oneline --no-merges` for the raw input.
3. **Keep only what a user notices** — new capabilities and user-visible fixes. Drop internal refactors, tooling, and tests entirely.
4. **Write as flowing prose grouped by benefit**, not by commit, following `templates/release-notes.md`:
   - Lead with what the reader can now do.
   - No internal jargon, no file names, no commit hashes.
   - Each line passes the test of a reader who never saw the code.
5. **Save the notes** to `docs/release-notes/v<version>.md` and echo them in the chat so the human reviews them next to the changelog. The file seeds the GitHub Release body; saving it is the point — it is no longer throwaway chat output.

## Definition of Done

- The notes read as a short benefit-first narrative, not a categorized list — that is what makes them different from the changelog on the very same input.
- No file names, hashes, or internal jargon survive.
- Saved to `docs/release-notes/v<version>.md` (version from `package.json`) and echoed in the chat. The file is not committed or pushed — a human applies it.

## Anti-patterns

- **Restating the changelog.** If the output is a bulleted Added/Fixed list, you wrote a changelog, not release notes. Use prose, lead with the benefit.
- **Leaking internals.** A user does not care about `refactor:` or a file path. If it is not a user-visible change, it is not in the notes.
- **Naming the file from a guess.** The version comes from `package.json` (set by `bump-version`), not from your own count. Wrong version → the file is misfiled.
- **Committing or pushing the file.** Save it to the working tree and stop; the human commits it (or gate 1 commits it in CI). The skill writes one file under `docs/release-notes/` — nothing else.

## References

- `templates/release-notes.md` — partner-facing narrative scaffold.
- `bump-version` — the sibling skill that sets the version this file is named for.
