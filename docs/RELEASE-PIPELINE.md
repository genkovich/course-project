# Release pipeline

How this project goes from a merged feature to a release — as local skills and
as CI. The lecture (9.7) is recorded on this repo; this file is the reference.

## The release driver: one `feat`

The gallery already stores memes, but nothing tags them. One feature —
`feat: filter memes by tag` (a `listMemesByTag` query + a `?tag=` API + a gallery
filter) — drives the whole pipeline:

```
feat: filter memes by tag
   ├─ next-version.sh  → MINOR bump → v0.2.0
   ├─ curate-changelog → an "Added" line
   ├─ release-notes    → a partner narrative
   └─ docs/api.md never mentioned listMemesByTag → real docs drift the tool catches
```

## Two halves: a rule decides, the agent explains

The version and the doc gap are **decided deterministically by scripts** (no
LLM). The agent's job is the human-readable layer — explain the bump, curate the
prose, propose the doc fix.

| Script | What it decides (no LLM) |
|---|---|
| `scripts/next-version.sh` | the next semver from the commit types (`feat`→MINOR…) — prints `0.2.0` |
| `scripts/check-docs-drift.mjs` | which data functions in `lib/db.ts` are missing from `docs/api.md` — flags `listMemesByTag` |

## Skills (local, in a session)

Each is a user-invokable skill under `.claude/skills/<name>/`. None commits or
pushes — they prepare the working tree; a human applies it.

| Skill | What it does |
|---|---|
| `/bump-version` | reads `next-version.sh`, explains **why** MINOR, edits `package.json`, proposes the tag |
| `/curate-changelog` | curates `[Unreleased]` in `docs/CHANGELOG.md` (filter · group · rewrite, 6 categories) |
| `/release-notes` | same input, partner-facing narrative — prints to chat |
| `/check-docs-drift` | runs `check-docs-drift.mjs`, proposes the `docs/api.md` fix |
| `/codify-rule` | turns a mistake seen **twice** into a durable `.claude/rules/` rule |
| `/release` | orchestrator: runs the four release stages in order, pausing at each human gate |

## Workflows (the same logic, as CI)

Four workflows, each fired by its own event. The curation logic is identical to
the skills — only **where** it runs changes (your terminal → the server).

| Workflow | Trigger | What it does |
|---|---|---|
| `.github/workflows/version.yml` | `pull_request` | `next-version.sh` + agent → comments the proposed semver |
| `.github/workflows/docs-drift.yml` | `pull_request`, `push: main` | `check-docs-drift.mjs` + agent → comments if `docs/api.md` lagged |
| `.github/workflows/changelog.yml` | `push: tags ['v*']` | `claude -p` curates `[Unreleased]` → **Release-PR** |
| `.github/workflows/release-notes.yml` | `push: tags ['v*']` | `claude -p` writes notes → **draft GitHub Release** |

The headless prompts live in `.github/prompts/`. The agent never pushes to main
or publishes a release — it prepares a reviewable PR / draft; a human ships.

## Worktree flow

The feature is developed in an isolated **git worktree** on `feat/meme-tags`,
kept off main. From there: bump the version, open a PR (the `version` and
`docs-drift` workflows comment on it), curate the changelog and notes, fix the
doc drift, then merge and tag `v0.2.0` to fire the release workflows.

`setup-demo.sh` stages all of this; `RECORD.md` is the beat-by-beat runbook.

## Honest limits

- **Determinism.** An LLM curating prose is not bit-for-bit reproducible — two
  runs may word a bullet differently. That is why the output lands as a
  reviewable PR + draft, not a direct push. The version and the doc gap, by
  contrast, come from scripts — those *are* reproducible.
- **Cost.** Each agent run on CI is a few cents (`claude-haiku-4-5`, capped
  `--max-turns`). The version/drift detection is free.
- **Human gate.** Everything a user or partner reads passes a human before
  publication. The agent is the draft, not the printing press.
