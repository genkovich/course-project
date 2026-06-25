## Build & Dev Commands

- `npm run dev` — start Next.js dev server
- `npm run build` — production build
- `npm start` — start production server
- `npm run lint` — run ESLint

No test framework is configured.

## Architecture

Full-stack **Next.js 16 App Router** meme generator with **SQLite** (better-sqlite3) backend.

### Tech Stack

- React 19 + TypeScript (strict) + Tailwind CSS 4
- SQLite with WAL mode and foreign keys via better-sqlite3
- Next.js API Routes for backend

### Key Paths

- `app/page.tsx` — client component: canvas-based meme generator (generate/save)
- `app/gallery/page.tsx` — server component: grid display of saved memes
- `app/api/memes/route.ts` — GET all memes, POST save meme
- `app/api/memes/random/route.ts` — GET random template + captions
- `lib/db.ts` — singleton DB instance, all database queries (getRandomTemplate, getRandomCaption, saveMeme, listMemes)
- `lib/seed.ts` — seed data: 5 meme templates, 20 captions

### Data Flow

Home page → "Generate" fetches `/api/memes/random` → canvas renders meme client-side → "Save" POSTs to `/api/memes` → stored in SQLite → viewable at `/gallery`

### Database Schema

Three tables: `templates` (name, image_path), `captions` (text), `memes` (template_id FK, top_text, bottom_text, created_at). DB file is `data.db` at project root (gitignored).

### Patterns

- `getDb()` uses singleton pattern — one DB connection per process
- Database seeding runs inside a transaction on first connection
- API routes use `force-dynamic` export for runtime data
- Path alias: `@/*` maps to project root

## Release pipeline

This repo doubles as the demo for a release lecture. The pipeline turns a finished
feature into a published release: you prepare it locally and one **merge** finalizes
it. Full reference: `docs/RELEASE-PIPELINE.md`. Recording runbook: `RECORD.md`.

### Prepare locally, finalize on merge — one gate

- **Locally, `/release`** does the two steps that need a human and the running app:
  it bumps the version and generates the user guide with **real screenshots** (the
  app is up on your machine; CI can't boot it). Then it commits both, pushes the
  branch, and opens **one** PR. Nothing is tagged or sent.
- **The gate is the merge.** Merging that PR runs `.github/workflows/release.yml`,
  which does the parts that need no app — changelog and release notes from the
  merged history — then tags `vX.Y.Z`, publishes the GitHub Release, announces on
  Telegram, and publishes the user guide to the Redmine wiki.

The gate listens to `pull_request: closed`, never `push`; the version in
`package.json` (bumped locally) is the release signal — a merge that bumped nothing
is a no-op. `GITHUB_TOKEN` pushes don't re-trigger workflows, so the gate's own
commit + tag can't loop it.

### Skills (`.claude/skills/`) — none commits or pushes, except `/release` opens the PR

| Skill | Does |
|---|---|
| `bump-version` | reads `next-version.sh`, explains the semver, edits `package.json` |
| `generate-user-docs` | runs `capture-screenshots.mjs` against the running app, writes `docs/user-guide/*.md` |
| `release` | local orchestrator: bump + user guide, then commits, pushes, and opens the release PR |
| `gen-changelog` | curates `[Unreleased]` in `docs/CHANGELOG.md` — local mirror of the gate's changelog step |
| `release-notes` | saves the partner narrative to `docs/release-notes/vX.Y.Z.md` — mirror of the gate's notes step |
| `announce-telegram` | shows the message + chat, sends on an explicit yes — mirror of the gate's Telegram step |
| `publish-redmine` | shows the pages + target, PUTs to Redmine on an explicit yes — mirror of the gate's wiki step |
| `codify-rule` | turns a mistake seen twice into a `.claude/rules/` rule |

### Determinism boundary

The reproducible parts are **scripts, no LLM**: `scripts/next-version.sh` decides
the semver and `scripts/capture-screenshots.mjs` renders the screenshots (both run
locally). The agent only writes the human layer around them. Standing rules the
agent inherits live in `.claude/rules/` (e.g. `db-style.md`).

### Secrets (GitHub repository secrets)

The gate reads only secret *names* — `CLAUDE_CODE_OAUTH_TOKEN` (the CI `claude -p`
changelog + notes steps), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `REDMINE_URL`,
`REDMINE_API_KEY`, `REDMINE_PROJECT`. Each is guarded: a missing one skips its step.
Copy `.env.example` to `.env` (gitignored) to give the local mirror skills the
Telegram/Redmine values. Never put a literal token in a skill, a workflow, or a doc.
