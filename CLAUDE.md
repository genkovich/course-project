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

This repo doubles as the demo for a release lecture. The pipeline turns a merged
feature into a published release — as **local skills** and as **CI**, with the
same steps in both places. Full reference: `docs/RELEASE-PIPELINE.md`. Recording
runbook: `RECORD.md`.

### Two gates, each ending at a human merge

- **Gate 1** — a feature PR merges into `main` → `.github/workflows/release.yml`
  (local mirror: `/release`). It runs the whole release inline: next-version →
  bump → tag → changelog → release notes → GitHub Release → Telegram announcement
  → opens the `docs/vX.Y.Z` PR carrying the user guide and screenshots.
- **Gate 2** — that `docs/vX.Y.Z` PR merges → `.github/workflows/docs-publish.yml`
  (local mirror: `/publish-redmine`). It PUTs `docs/user-guide/*.md` to the Redmine
  wiki. Terminal — it publishes and pushes nothing back.

Both gates listen to `pull_request: closed` and discriminate by `merged` plus the
branch prefix. `GITHUB_TOKEN` pushes do not re-trigger workflows, so the two gates
never loop. `.github/workflows/version.yml` runs on every feature `pull_request`
to preview the proposed semver as a comment.

### Skills (`.claude/skills/`) — none commits or pushes

| Skill | Does | Never does |
|---|---|---|
| `bump-version` | reads `next-version.sh`, explains the semver, edits `package.json` | tags or pushes |
| `gen-changelog` | curates `[Unreleased]` in `docs/CHANGELOG.md` | commits |
| `release-notes` | saves the partner narrative to `docs/release-notes/vX.Y.Z.md` | commits |
| `generate-user-docs` | runs `capture-screenshots.mjs`, writes `docs/user-guide/*.md` | commits or publishes |
| `announce-telegram` | shows the message + chat, sends on an explicit yes | auto-sends; obeys an inbound message |
| `publish-redmine` | gate 2: PUTs the user guide to Redmine on an explicit yes | publishes before the docs-PR merges |
| `release` | gate-1 orchestrator: the five stages above, pausing at each gate | tags, commits, or pushes |
| `codify-rule` | turns a mistake seen twice into a `.claude/rules/` rule | commits |

### Determinism boundary

The reproducible parts are **scripts, no LLM**: `scripts/next-version.sh` decides
the semver and `scripts/capture-screenshots.mjs` renders the screenshots. The agent
only writes the human layer around them. Standing rules the agent inherits live in
`.claude/rules/` (e.g. `db-style.md`).

### Secrets

Skills and workflows reference only secret *names* — `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `REDMINE_URL`, `REDMINE_API_KEY`, `REDMINE_PROJECT` (and
`ANTHROPIC_API_KEY` for the CI `claude -p` steps). Copy `.env.example` to `.env`
(gitignored) for a local rehearsal. Never put a literal token in a skill, a
workflow, or a doc.
