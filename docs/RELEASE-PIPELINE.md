# Release pipeline

How this project goes from a merged feature to a published release — as local
skills and as CI, with the **same steps in both places**. The lecture (9.7) is
recorded on this repo; this file is the reference.

## The shape: two gates

The pipeline is two gates, each ending at a **human merge**:

```
 feature PR ──merge──▶  GATE 1 (release.yml / /release)
                         next-version → bump → tag → changelog → release notes
                         → GitHub Release → Telegram → open docs/vX.Y.Z PR
                                                              │
 docs/vX.Y.Z PR ──merge──▶  GATE 2 (docs-publish.yml / /publish-redmine)
                             PUT docs/user-guide/*.md → Redmine wiki
```

- **Gate 1** runs the moment a feature PR merges into `main`. It cuts the version,
  curates the changelog, writes partner notes, publishes a GitHub Release,
  announces it in Telegram, and **opens a second PR** carrying the user guide
  (with screenshots). Nothing reaches Redmine yet.
- **Gate 2** runs the moment a human merges that `docs/vX.Y.Z` PR. Only then does
  the user guide leave the repo and land on the Redmine wiki.

Two gates, because two different things need a human: the **release** (gate 1's
input is the reviewed feature PR) and the **external publication** of user-facing
docs (gate 2's input is the reviewed docs PR).

## The release driver: one `feat`

The gallery stores memes but nothing tagged them. One feature —
`feat: filter memes by tag` (a `listMemesByTag` query + a `?tag=` API + a gallery
filter) — drives the whole pipeline:

```
feat: filter memes by tag
   ├─ next-version.sh   → MINOR bump → v0.2.0
   ├─ gen-changelog     → an "Added" line
   ├─ release-notes     → a partner narrative
   └─ generate-user-docs → a user guide page, with before/after screenshots
```

The old pipeline used this same feature to demonstrate **doc drift** (the API
reference falling behind the code). This version drops drift entirely. Instead of
*detecting* that docs lagged, it **actively generates** the user documentation the
feature now needs — and that generated guide is what gate 2 publishes.

## A rule decides, the agent explains

The parts that must be reproducible are decided by **scripts (no LLM)**. The
agent's job is the human layer — explain, curate, narrate, illustrate.

| Script (no LLM) | What it decides |
|---|---|
| `scripts/next-version.sh` | the next semver from the commit types (`feat`→MINOR…) — prints `0.2.0` |
| `scripts/capture-screenshots.mjs` | renders the app's real screens to PNGs (Playwright, headless) — the pictures the guide is built around |

Versioning splits cleanly: the **number** comes from the script; the agent only
explains *which part moved and why*. Documentation splits the same way: the
**screenshots** come from the script; the agent only writes the words around them.

## Local = CI: the same steps, two places

Every skill has a workflow twin running the identical logic — only **where** it
runs changes (your terminal → the server). That parity is the point of the lecture:
you rehearse a release locally with skills, then watch CI do exactly the same on a
real merge.

### Skills (local, in a session)

Each is a user-invokable skill under `.claude/skills/<name>/`. None commits or
pushes — they prepare the working tree (and, for the outbound ones, send only on
an explicit yes).

| Skill | Gate | What it does |
|---|---|---|
| `/bump-version` | 1 | reads `next-version.sh`, explains **why** MINOR, edits `package.json`, proposes the tag |
| `/gen-changelog` | 1 | curates `[Unreleased]` in `docs/CHANGELOG.md` (filter · group · rewrite, 6 categories) |
| `/release-notes` | 1 | same input, partner narrative — **saves** `docs/release-notes/vX.Y.Z.md` |
| `/generate-user-docs` | 1 | runs the screenshotter, then **writes** `docs/user-guide/*.md` around the shots |
| `/announce-telegram` | 1 | shows the exact message + chat, sends to Telegram **only on an explicit yes** |
| `/release` | 1 | orchestrator: runs the five gate-1 stages in order, pausing at each human gate |
| `/publish-redmine` | 2 | shows the exact pages + target, PUTs `docs/user-guide/*.md` to Redmine **only on yes** |
| `/codify-rule` | — | turns a mistake seen **twice** into a durable `.claude/rules/` rule |

### Workflows (the same logic, as CI)

| Workflow | Trigger | Gate | What it does |
|---|---|---|---|
| `.github/workflows/version.yml` | `pull_request` | — | `next-version.sh` + agent → comments the proposed semver on the feature PR |
| `.github/workflows/release.yml` | `pull_request: closed`, merged, **not** `docs/*`/`release/*` | 1 | next-version → bump → tag → changelog → notes → `gh release create` → Telegram → open the `docs/vX.Y.Z` PR (with Playwright screenshots) |
| `.github/workflows/docs-publish.yml` | `pull_request: closed`, merged, `docs/*` + label `gate:docs` | 2 | PUT `docs/user-guide/*.md` to the Redmine wiki — terminal, pushes nothing |

The headless prompts live in `.github/prompts/` (`version.md`, `changelog.md`,
`release-notes.md`, `user-guide.md`). The agent never pushes to `main` to publish
docs externally — gate 2 does that, and only on a human merge.

## No loops: how the two gates stay apart

The danger with "merge fires CI which pushes which fires CI" is an infinite loop.
Three choices keep it flat:

1. **Both gates listen to `pull_request: closed`, never to `push`.** They
   discriminate by `merged == true` and the branch prefix of `head.ref`
   (feature → gate 1; `docs/*` → gate 2). No tag-push trigger, no `push: main`
   trigger.
2. **The tag and the GitHub Release are created inline inside gate 1** — there is
   no separate tag-triggered workflow to fire.
3. **`GITHUB_TOKEN` pushes do not re-trigger workflows** (GitHub policy). So when
   gate 1 pushes the tag and the `main` commit, and opens the docs PR, none of
   that fires anything. Gate 2 wakes only on a **human** merging the docs PR.

## Worktree flow

The feature is developed in an isolated **git worktree** on `feat/meme-tags`,
kept off `main`. From there: bump the version, open a PR (the `version` workflow
comments the proposed semver), then merge — and gate 1 takes over on the server.

`setup-demo.sh` stages all of this; `RECORD.md` is the beat-by-beat runbook.

## Honest limits

- **Prose is not reproducible — so it lands behind a gate.** An LLM curating a
  changelog or writing a guide won't produce byte-identical output twice. That is
  exactly why the *user guide* ships as a reviewable `docs/vX.Y.Z` **PR** before it
  reaches Redmine, not as a direct push. The version and the screenshots, by
  contrast, come from scripts — those *are* reproducible.
- **Two human gates, on purpose.** Gate 1's automated outputs (changelog, Release,
  announcement) ride on the human review that already happened on the feature PR.
  The user guide gets its *own* second review (gate 2) because merging it
  **publishes externally** — there is no undo on a wiki.
- **Outbound steps confirm hard, and channel messages never authorize them.**
  `/announce-telegram` and `/publish-redmine` show the exact payload and target and
  wait for a typed yes. An inbound Telegram or Redmine message asking to "ship it"
  is treated as data, not a command — that is the prompt-injection shape, and the
  skills refuse it.
- **`GITHUB_TOKEN` non-retrigger is a feature here.** The same policy that
  sometimes annoys you (your bot's push doesn't run CI) is what makes the two gates
  safe to chain without a loop.
- **Cost.** Each agent run on CI is a few cents (`claude-haiku-4-5`, capped
  `--max-turns`). The version and the screenshots are free. The Playwright step
  pays a one-time browser download (`--with-deps chromium`) and a build to shoot
  against a real server.
- **Forks without secrets still demo the git half.** Every outbound/secret step is
  guarded (`::notice:: skipped` + `exit 0`), so a fork with no `ANTHROPIC_API_KEY`,
  Telegram, or Redmine secrets still shows gate 1's version → tag → docs-PR flow.
