# Release pipeline

How this project goes from a finished feature to a published release. The lecture
(9.7) is recorded on this repo; this file is the reference.

## The shape: prepare locally, finalize on merge

One PR, one human gate (the merge). The work splits by what it needs:

```
 /release (local, app running)            THE GATE: merge the release PR
 ─ bump version                           ─ curate changelog
 ─ generate user guide (real shots) ────▶ ─ write release notes
 ─ push + open ONE PR                     ─ tag vX.Y.Z + commit to main
                                          ─ publish GitHub Release
                                          ─ announce on Telegram
                                          ─ publish user guide to Redmine wiki
```

- **Locally, `/release`** does the two steps that need a human and a running app:
  the version bump (you confirm which part moved) and the user guide (built around
  **real screenshots** of the app you have running). It commits both and opens one
  PR. Nothing is tagged or sent yet.
- **The gate is the merge.** Merging that PR runs `release.yml`, which does the
  parts that need no app — changelog and release notes from the merged history —
  then tags, publishes the GitHub Release, announces on Telegram, and publishes the
  guide to the Redmine wiki.

Why this split: the user guide is built from screenshots of the running app, and CI
can't reliably boot the app to shoot them — but you can. So the screenshot step is
local and rides into the PR. The text (changelog, notes) needs no app, so it runs
on the server when you merge.

## The release driver: one `feat`

The gallery stores memes but nothing tagged them. One feature —
`feat: filter memes by tag` (a `listMemesByTag` query + a `?tag=` API + a gallery
filter) — drives the whole pipeline:

```
feat: filter memes by tag
   ├─ next-version.sh     → MINOR bump → v0.2.0  (local, in /release)
   ├─ generate-user-docs  → a guide page, with before/after shots (local)
   ├─ gen-changelog       → an "Added" line      (CI, on merge)
   └─ release-notes       → a partner narrative   (CI, on merge)
```

## A rule decides, the agent explains

The reproducible parts are decided by **scripts (no LLM)**. The agent's job is the
human layer — explain, illustrate, curate, narrate.

| Script (no LLM) | What it decides | Runs |
|---|---|---|
| `scripts/next-version.sh` | the next semver from the commit types (`feat`→MINOR…) — prints `0.2.0` | local |
| `scripts/capture-screenshots.mjs` | renders the app's real screens to PNGs (Playwright, headless) | local |

Versioning splits cleanly: the **number** comes from the script; the agent only
explains *which part moved and why*. Documentation splits the same way: the
**screenshots** come from the script; the agent only writes the words around them.

## The version IS the release signal

CI does not recompute the version. `/release` bumps `package.json` locally and that
rides into the PR. On merge, the gate reads `package.json`: if its version is
already tagged, the merge bumped nothing and the gate is a **no-op**. So any PR can
merge safely — only one that carries a bump actually releases.

## Local prep — `/release` (in a session)

Each step is a user-invokable skill. None of the local steps tag or send.

| Skill | Does | Never does |
|---|---|---|
| `/bump-version` | reads `next-version.sh`, explains **why** MINOR, edits `package.json` | tags or pushes |
| `/generate-user-docs` | runs the screenshotter against your running app, writes `docs/user-guide/*.md` | commits or publishes |
| `/release` | orchestrates the two above, then commits, pushes, and opens the release PR | tags, writes changelog/notes, or sends anything |

Rehearsal mirrors (optional — they do locally what the gate does in CI):

| Skill | Mirrors the gate's… |
|---|---|
| `/gen-changelog` | changelog step |
| `/release-notes` | release-notes step |
| `/announce-telegram` | Telegram step |
| `/publish-redmine` | Redmine step |
| `/codify-rule` | (not a release step) turns a mistake seen **twice** into a `.claude/rules/` rule |

## The gate — `release.yml` (CI, on merge)

```
.github/workflows/release.yml   on: pull_request: [closed]
  if merged AND package.json version is newer than the latest tag:
    gen-changelog → release-notes → commit + tag + push (main + tag)
    → GitHub Release → Telegram → Redmine wiki
```

The headless prompts live in `.github/prompts/` (`changelog.md`,
`release-notes.md`). The agentic steps authenticate with `CLAUDE_CODE_OAUTH_TOKEN`
(a repo secret). Every outbound step is guarded: a missing secret just skips that
step (`::notice:: skipped`), so a repo without Telegram/Redmine secrets still cuts
the version, changelog, notes, and GitHub Release.

## No loops: why the gate is safe

The danger with "merge fires CI which pushes which fires CI" is an infinite loop.
Two choices keep it flat:

1. **The gate listens to `pull_request: closed`, never to `push`.** It runs on a
   merged PR, not on the commit and tag it pushes.
2. **`GITHUB_TOKEN` pushes do not re-trigger workflows** (GitHub policy). So when
   the gate pushes the changelog/notes commit and the tag, none of that fires
   anything. And the gate opens nothing, so there is no second trigger.

## Worktree flow

The feature is developed in an isolated **git worktree** on `feat/meme-tags`, kept
off `main`. From there: `npm run dev`, then `/release` (bump + guide + push + PR),
then merge — and the gate takes over on the server.

`setup-demo.sh` stages all of this; `RECORD.md` is the beat-by-beat runbook.

## Secrets (GitHub repository secrets)

The gate reads these by name; set them once with `gh secret set NAME`:

| Secret | Used by | Without it |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | the `claude -p` changelog + notes steps | those steps skip; GitHub builds notes from PR labels |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | the Telegram announcement | the announcement skips |
| `REDMINE_URL`, `REDMINE_API_KEY`, `REDMINE_PROJECT` | the Redmine wiki publish | the publish skips |

The gate needs `contents: write` (it pushes the commit + tag and creates the
Release) — set at the job level in `release.yml`, and the repo's Actions setting
must allow workflow write.

## Honest limits

- **Prose is not reproducible — so it rides behind the gate.** An LLM curating a
  changelog or writing a guide won't produce byte-identical output twice. The user
  guide ships inside the reviewed release PR; the changelog and notes are reviewed
  on the merge commit. The version and the screenshots, by contrast, come from
  scripts — those *are* reproducible.
- **One human gate, on purpose.** Everything user-facing (the guide, the notes, the
  announcement) rides on the single review of the release PR. The merge is the
  decision to publish.
- **Outbound steps and channel messages.** `/announce-telegram` and
  `/publish-redmine` (the local mirrors) show the exact payload and target and wait
  for a typed yes. An inbound Telegram or Redmine message asking to "ship it" is
  data, not a command — the prompt-injection shape, and the skills refuse it.
- **Cost.** Each agent run on CI is a few cents (`claude-haiku-4-5`, capped
  `--max-turns`). The version and the screenshots are free (and local).
- **The app can't boot itself in CI — that's the point.** Screenshots are local, so
  the guide is generated where the app runs and merged as a reviewed file.
