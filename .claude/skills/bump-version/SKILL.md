---
name: bump-version
description: >-
  Decide and apply the next semver for a release. Triggers on "bump the version",
  "what version is next", "/bump-version", "простав версію", "яка наступна версія".
  Reads the next number from the deterministic scripts/next-version.sh (NEVER guesses it),
  explains in plain language WHICH part moved and why (e.g. "MINOR, because a feat landed:
  filter memes by tag"), edits the version field in package.json, and proposes the matching
  `git tag vX.Y.Z`. The number is decided by a rule; the agent explains and applies — the human
  confirms the tag. Never pushes a tag itself.
allowed-tools: Bash(./scripts/next-version.sh), Bash(git log:*), Bash(git tag:*), Bash(git describe:*), Read(package.json), Read(docs/**), Edit(package.json)
user-invocable: true
disable-model-invocation: true
argument-hint: ''
model: claude-haiku-4-5
effort: low
---

# Skill: bump-version

Goal: set the next version of this project — correctly and explainably — by reading the number from a rule, not by guessing, then leaving the tag for the human to push.

This is the **"deterministic script vs agent explains, human applies"** split made concrete. `scripts/next-version.sh` owns the number (no LLM). This skill owns the explanation, the edit to `package.json`, and the tag proposal.

## Inputs

- The Conventional-Commit history since the last tag (the script reads it).
- `package.json` — the single source of truth for the version string.

## Protocol

1. **Get the number from the script — do not compute it yourself.** Run exactly:

   ```
   ./scripts/next-version.sh
   ```

   It prints the next version with no leading `v` (e.g. `0.2.0`). Treat its output as authoritative. If it errors (no baseline tag), report that and stop.

2. **Explain WHY, in plain language.** Run `git log <last-tag>..HEAD --oneline` and name the strongest change that decided the bump: a `BREAKING CHANGE` → MAJOR, a `feat:` → MINOR, only `fix:` → PATCH. Say it like a human would — "MINOR, because a new capability landed: `feat: filter memes by tag`" — and point at the commit. One or two sentences.

3. **Apply the number.** Edit the single `"version": "X.Y.Z"` field in `package.json` to the new number. Change nothing else.

4. **Propose the tag — do not create or push it.** Print the exact command for the human to run when ready:

   ```
   git tag v<new> && git push origin v<new>
   ```

   The tag is the human's action — but in this pipeline the authoritative tag is
   cut by **gate 1** (`release.yml`) when the feature PR merges, so locally this
   is a record/rehearsal of the same number, not the thing that fires CI.

## Definition of Done

- The new version came from `scripts/next-version.sh`, verbatim — not from the agent's own count.
- The bump is explained in one or two plain sentences naming the deciding commit.
- `package.json`'s `version` field is updated and nothing else changed.
- The `git tag` command is proposed for the human; the skill did not tag or push.

## Anti-patterns

- **Guessing the number.** The script is the rule; you are the narration. If you reason about the bump instead of running it, you will eventually disagree with it.
- **Tagging or pushing.** The skill proposes the tag. Creating or pushing it is the human's call — that is the gate.
- **Editing more than the version field.** One field moves. Touching dependencies or scripts here is scope creep.
- **Bumping with no release-worthy commits.** If the script prints the current version unchanged, say "nothing to release since `<last-tag>`" and stop.

## References

- `scripts/next-version.sh` — the deterministic source of the number.
