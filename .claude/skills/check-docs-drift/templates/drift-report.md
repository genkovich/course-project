<!-- Doc-drift report. Fill from scripts/check-docs-drift.mjs output — quote its
findings, do not invent. Keep every section even if empty (write "none"). -->

# Doc drift report — `docs/api.md`

**Checked:** data functions exported from `lib/db.ts` vs the documented surface (`docs/api.md`).

## In the code but missing from the doc (doc fell behind)

- `<function>(<signature>)` — <one line of what it does>

## In the doc but gone from the code (ghost)

- none

## Proposed fix

- Add a row to the `## Data functions` table in `docs/api.md` for each
  undocumented function (and the HTTP route it powers, if any), matching its
  real signature.
- Re-run `node scripts/check-docs-drift.mjs` — exit 0 confirms the doc is back in sync.
