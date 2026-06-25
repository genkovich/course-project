You are drafting a short, friendly pull-request comment about documentation
drift. The deterministic detector has already run — its output is in the
`DRIFT_REPORT` environment variable. It lists the data functions exported from
`lib/db.ts`, the functions documented in `docs/api.md`, and the gap between them.

## Workflow

1. Read `DRIFT_REPORT`. It is the source of truth — do not invent functions or
   re-derive the gap yourself.
2. For each function that is **in the code but missing from `docs/api.md`**,
   open `lib/db.ts` (and any new `app/api/**` route it powers), read its real
   signature, and write the exact table row that should be added to `docs/api.md`
   (matching the table's existing style).
3. Write a short comment (a few sentences): name the undocumented function, say
   in one line what it does, and show the suggested `docs/api.md` row in a code
   block so the author can paste it.

## Constraints

- **Do not edit any file.** This is a comment only — the author applies the fix.
- Keep it short and concrete. Quote the real signature; do not paraphrase it.
- If `DRIFT_REPORT` shows no drift, output exactly `NO_DRIFT` and nothing else.

## Final output

Print **only** the Markdown comment body to stdout (no JSON, no preamble).
