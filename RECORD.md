# RECORD.md — recording runbook for lecture 9.7 (on this repo)

The 9.7 release lecture is recorded **on this project** — the meme generator. The
flow is one PR and one gate: you prepare the release locally with `/release`, then
**merging that PR** fires the rest in CI. The release driver is one feature:
**`feat: filter memes by tag`**.

- **Local (`/release`):** bump the version + generate the user guide with real
  screenshots (the app is up on your machine) → commit, push, open ONE PR.
- **The gate (merge the PR):** CI writes the changelog + release notes, tags
  `v0.2.0`, publishes the GitHub Release, announces on Telegram, and publishes the
  user guide to the Redmine wiki.

`setup-demo.sh` leaves the repo ready: the release tooling committed and tagged
`v0.1.0`, and the tags feature staged as a commit in an isolated **worktree** on
branch `feat/meme-tags`. The release is generated live on camera.

---

## 0. One-time setup (before recording)

```bash
gh auth status                        # logged in to GitHub (origin: course-project)

# The gate reads these as repository secrets (each guarded — a missing one just
# skips its step):
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "$(claude setup-token)"  # CI claude -p (changelog + notes)
gh secret set TELEGRAM_BOT_TOKEN --body "..."             # Telegram announcement
gh secret set TELEGRAM_CHAT_ID   --body "..."             # Telegram announcement
gh secret set REDMINE_URL        --body "https://redmine.example.com"
gh secret set REDMINE_API_KEY    --body "..."             # Redmine publish
gh secret set REDMINE_PROJECT    --body "course-project"  # Redmine publish (slug = repo name)
gh secret list                        # confirm all six are set

# The gate pushes the changelog/notes commit + tag and creates the Release, so
# Actions needs workflow write:
gh api -X PUT "repos/genkovich/course-project/actions/permissions/workflow" \
  -F default_workflow_permissions=write

# Local env mirrors Telegram/Redmine for the rehearsal mirror skills
# (/announce-telegram, /publish-redmine read them from the environment):
export TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
export REDMINE_URL=... REDMINE_API_KEY=... REDMINE_PROJECT=...

./setup-demo.sh                       # baseline v0.1.0 + feat/meme-tags worktree
cd ../course-project-tags             # the feature worktree
npm install                           # first time in this worktree
npm run dev                           # the app MUST be up — the screenshots need it
claude                                # open the session you'll record in
```

You now have `v0.1.0` on main and the feature on `feat/meme-tags` in a worktree —
**no release tag yet**.

---

## 1. Worktree flow — the feature lives off to the side

`🎬 worktree`

```bash
git worktree list                     # main + ../course-project-tags (feat/meme-tags)
git -C ../course-project-tags log --oneline -1   # feat: filter memes by tag
```

Say it: the feature was built in its own worktree, isolated from main. `/release`
picks it up from here.

---

## 2. Prepare the release locally — `/release`

`🎬 /release`  (the app is running in another terminal: `npm run dev`)

```bash
/release
```

It runs two stages, pausing after each, then opens the PR:

- **bump** — `./scripts/next-version.sh` prints `0.2.0`; the agent explains "MINOR,
  because `feat: filter memes by tag`" and edits `package.json`. Show
  `git diff package.json` (`0.1.0 → 0.2.0`).
- **user guide** — `node scripts/capture-screenshots.mjs` shoots the running app
  into `docs/user-guide/img/*.png`; the agent writes `docs/user-guide/*.md` around
  the shots. Open `docs/user-guide/filtering-by-tag.md`: numbered steps, before/
  after screenshots, zero function names.
- **open the PR** — it commits the bump + guide, pushes `feat/meme-tags`, and opens
  one PR:

```bash
gh pr view feat/meme-tags --web       # the release PR: bump + user guide
```

The line to say: everything that needs the running app or a human decision happened
here, locally, and rode into one PR. The changelog and notes need no app — the
merge does those.

---

## 3. Merge — the gate fires on the server

`🎬 live Actions, the gate`

```bash
gh pr merge feat/meme-tags --squash   # merging the release PR IS the gate
gh run watch                          # release.yml live: changelog → notes →
                                      #   tag v0.2.0 → GitHub Release → Telegram → Redmine
gh release view v0.2.0 --web          # the published GitHub Release with the notes
open "$REDMINE_URL/projects/course-project/wiki/filtering-by-tag"   # the page in the wiki
```

What the run shows, in order: the curated changelog (fewer lines than the log), the
release notes, the commit + tag `v0.2.0` pushed to main, the GitHub Release, the
Telegram announcement, and each user-guide page PUT to the Redmine wiki.

The line to say: one PR, one human gate. You reviewed the bump and the guide in the
PR; merging it is the decision to publish, and CI does the mechanical rest.

---

## 4. (Optional) rehearse the gate's steps locally

Each gate step has a local mirror skill — handy to show what CI will do before you
merge. None of these is the real release; they just do the same thing from your
machine:

```bash
/gen-changelog                        # curate docs/CHANGELOG.md (git diff to compare)
/release-notes                        # write docs/release-notes/v0.2.0.md
/announce-telegram                    # show the message + chat, send only on "так"
/publish-redmine                      # show the page→URL map, PUT only on "так"
```

Say the anti-injection line on the outbound ones: a message *in* the channel never
authorizes a send — only you, here, do.

---

## 5. (Optional) error → durable rule

`🎬 codify-rule`

```bash
sed -n '1,20p' .claude/rules/db-style.md   # the house rule for the data layer
/codify-rule                               # capture a repeated mistake as a narrow rule
git diff .claude/rules/
```

---

## 6. Reset between takes

```bash
./reset-demo.sh                       # revert edits, remove worktree, drop v0.2.0 + branches
```

Keeps `v0.1.0`. A PR / Release left on GitHub from a live take you close by hand:
`gh pr close feat/meme-tags -d` and `gh release delete v0.2.0 -y`.
