# RECORD.md — recording runbook for lecture 9.7 (on this repo)

The 9.7 release lecture is recorded **on this project** — the meme generator.
Each beat is *say it → call the skill → go to the folder → run it → open GitHub →
show this*. The release driver is one feature: **`feat: filter memes by tag`**.

`setup-demo.sh` leaves the repo ready: the release tooling committed and tagged
`v0.1.0`, and the tags feature staged in an isolated **worktree** on branch
`feat/meme-tags`. The releases are generated live on camera.

---

## 0. One-time setup (before recording)

```bash
gh auth status                        # logged in to GitHub (origin: course-project)
export ANTHROPIC_API_KEY=sk-ant-...   # repo Actions secret, set once:
gh secret set ANTHROPIC_API_KEY --body "$ANTHROPIC_API_KEY"
gh api -X PUT "repos/genkovich/course-project/actions/permissions/workflow" \
  -F default_workflow_permissions=write -F can_approve_pull_request_reviews=true

./setup-demo.sh                       # baseline v0.1.0 + feat/meme-tags worktree
cd ../course-project-tags             # the feature worktree
claude                                # open the session you'll record in
```

You now have `v0.1.0` on main and the feature on `feat/meme-tags` in a worktree —
**no release tag yet**. `docs/api.md` already drifted (it doesn't list
`listMemesByTag`).

---

## 1. Worktree flow — the feature lives off to the side

`🎬 worktree`

```bash
git worktree list                     # main + ../course-project-tags (feat/meme-tags)
git -C ../course-project-tags log --oneline -1   # feat: filter memes by tag
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

## 3. Open the PR — the pipeline runs **on the request**

`🎬 live Actions, part 1`

```bash
git push -u origin feat/meme-tags
gh pr create --fill                   # PR feat/meme-tags -> main
```

Then in the browser, on the PR:

- **`version`** comments the proposed bump: `0.1.0 → 0.2.0`, MINOR, naming the feat.
- **`docs-drift`** comments that `listMemesByTag` is missing from `docs/api.md`,
  with the row to paste. *This is "docs drift, as it runs — on the request."*

---

## 4. Changelog + release notes — one input, two outputs

`🎬 curate-changelog + release-notes` (or run them together with `/release`)

```bash
/curate-changelog                     # curate [Unreleased] from the log since v0.1.0
git diff docs/CHANGELOG.md            # fewer lines than the log = curation, not a dump
/release-notes                        # same input, partner narrative (prose, to chat)
```

Put the two side by side: technical categorized changelog vs friendly narrative.

---

## 5. Docs drift — catch it and fix it

`🎬 check-docs-drift`

```bash
node scripts/check-docs-drift.mjs     # flags listMemesByTag (exit 1), deterministic
/check-docs-drift                     # agent adds the docs/api.md row; re-run -> exit 0
git diff docs/api.md
```

> Or run steps 2, 4, 5 in one go: `/release` (bump → changelog → release-notes →
> docs-drift), pausing at each human gate.

---

## 6. Merge + tag — Release-PR and draft Release

`🎬 live Actions, part 2`

```bash
gh pr merge feat/meme-tags --squash   # apply the version + doc fix
git checkout main && git pull
git tag v0.2.0 && git push origin v0.2.0
```

Then in the browser:

- **Actions** → `changelog` and `release-notes` jobs run `claude -p` (~1–2 min).
- **Pull requests** → a `changelog/v0.2.0` **Release-PR** with the changelog diff.
- **Releases** → a **draft** GitHub Release with the partner notes.

The line to say: a human reviews and publishes — agent prepares, human ships.

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

Keeps `v0.1.0`. A Release-PR / draft Release left on GitHub you close by hand:
`gh pr close changelog/v0.2.0 -d` and `gh release delete v0.2.0 -y`.
