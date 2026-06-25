# RECORD.md — recording runbook for lecture 9.7 (on this repo)

The 9.7 release lecture is recorded **on this project** — the meme generator.
Each beat is *say it → call the skill → go to the folder → run it → open GitHub →
show this*. The release driver is one feature: **`feat: filter memes by tag`**.

The pipeline is **two gates**, each ending at a human merge:

- **Gate 1** (feature PR merged): bump → tag → changelog → notes → GitHub Release
  → Telegram → open the `docs/v0.2.0` PR (with screenshots).
- **Gate 2** (docs PR merged): publish `docs/user-guide/*.md` to the Redmine wiki.

`setup-demo.sh` leaves the repo ready: the release tooling committed and tagged
`v0.1.0`, and the tags feature staged as a commit in an isolated **worktree** on
branch `feat/meme-tags`. The releases are generated live on camera.

---

## 0. One-time setup (before recording)

```bash
gh auth status                        # logged in to GitHub (origin: course-project)

# Secrets the workflows read (set once; each is guarded, so missing ones just skip):
gh secret set ANTHROPIC_API_KEY  --body "sk-ant-..."   # gate 1 LLM steps
gh secret set TELEGRAM_BOT_TOKEN --body "..."          # gate 1 announcement
gh secret set TELEGRAM_CHAT_ID   --body "..."          # gate 1 announcement
gh secret set REDMINE_URL        --body "https://redmine.example.com"
gh secret set REDMINE_API_KEY    --body "..."          # gate 2 publish
gh secret set REDMINE_PROJECT    --body "course-project"  # gate 2 publish (slug = repo name)

gh api -X PUT "repos/genkovich/course-project/actions/permissions/workflow" \
  -F default_workflow_permissions=write -F can_approve_pull_request_reviews=true

# Local env mirrors the same secrets for the SKILL rehearsal (/announce-telegram,
# /publish-redmine read them from the environment):
export TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=...
export REDMINE_URL=... REDMINE_API_KEY=... REDMINE_PROJECT=...

./setup-demo.sh                       # baseline v0.1.0 + feat/meme-tags worktree
cd ../course-project-tags             # the feature worktree
npm install                           # first time in this worktree
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
npm run dev                           # /gallery?tag=dev already filters (seed memes)
```

Say it: the feature was built in its own worktree, isolated from main — that is
how parallel work stays clean. The release pipeline picks it up from here.

---

## 2. Version — a rule decides, the agent explains

`🎬 bump-version`

```bash
./scripts/next-version.sh             # 0.2.0 (a feat landed -> MINOR), deterministic, no LLM
/bump-version                         # agent: "MINOR, because feat: filter memes by tag",
                                      #   edits package.json, proposes the tag
git diff package.json                 # "version": 0.1.0 -> 0.2.0
```

---

## 3. Open the PR — the version preview runs on the request

`🎬 live Actions, version preview`

```bash
git push -u origin feat/meme-tags
gh pr create --fill                   # PR feat/meme-tags -> main
```

In the browser, on the PR: **`version`** comments the proposed bump
`0.1.0 → 0.2.0`, MINOR, naming the feat. Pure preview — it tags nothing.

---

## 4. Rehearse gate 1 locally — one input, several outputs

`🎬 /release` (or run the stages one by one)

```bash
/release                              # bump → changelog → release-notes →
                                      #   generate-user-docs → announce-telegram,
                                      #   pausing at each human gate
```

Show the contrast as it goes:

- **changelog** (`git diff docs/CHANGELOG.md`) — fewer lines than the log = curation.
- **release notes** (`docs/release-notes/v0.2.0.md`) — same input, friendly narrative.
- **user guide** — `npm run shoot` writes `docs/user-guide/img/*.png`; the agent
  writes the pages around them. *This is the active replacement for doc-drift:
  not "the docs fell behind" but "here are the docs the feature needs."*
- **announce** — `/announce-telegram` shows the exact message + chat and waits for
  your **explicit yes** before sending. Say the anti-injection line: a message
  *in* the channel never authorizes a release.

> Need a running app for the screenshots: `npm run dev` in another terminal
> (first time: `npm run shoot:install` for the browser binary).

---

## 5. Merge — gate 1 fires on the server

`🎬 live Actions, gate 1`

```bash
gh pr merge feat/meme-tags --squash   # merging the FEATURE PR is gate 1's trigger
```

Then in the browser, **Actions → release**:

- next-version → bump → **tag `v0.2.0`** → changelog → notes
- **Releases** → a published **GitHub Release** with the partner notes
- **Telegram** → the announcement lands in the chat
- **Pull requests** → a new **`docs/v0.2.0`** PR with the user guide + screenshots,
  labeled `gate:docs`

The line to say: gate 1 prepared everything and **opened a second PR** — the user
docs wait for a human before they go anywhere public.

---

## 6. Merge the docs PR — gate 2 publishes to Redmine

`🎬 live Actions, gate 2`

```bash
gh pr merge docs/v0.2.0 --squash      # merging the DOCS PR is gate 2's trigger
```

Then in the browser, **Actions → docs-publish**: it PUTs each
`docs/user-guide/*.md` page to the Redmine wiki. Open Redmine and show the pages
appear.

> Rehearse gate 2 locally instead: `/publish-redmine` — it shows the exact
> page→URL map and publishes only on your explicit yes.

The line to say: two gates, two human merges. Gate 1 releases; gate 2 publishes
the user docs. `GITHUB_TOKEN` pushes don't re-trigger CI, so the two never loop.

---

## 7. (Optional) error → durable rule

`🎬 codify-rule`

```bash
sed -n '1,20p' .claude/rules/db-style.md   # the house rule for the data layer
/codify-rule                               # capture a repeated mistake as a narrow rule
git diff .claude/rules/
```

---

## 8. Reset between takes

```bash
./reset-demo.sh                       # revert edits, remove worktree, drop v0.2.0 + branches
```

Keeps `v0.1.0`. A docs-PR / Release left on GitHub you close by hand:
`gh pr close docs/v0.2.0 -d` and `gh release delete v0.2.0 -y`.
