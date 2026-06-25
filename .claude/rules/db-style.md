---
description: House style for the data layer
globs: lib/**
---

# data layer — house style

Standing conventions for code under `lib/`. Narrow on purpose: each one is a
concrete shape, not general advice.

- **A lookup that can miss throws a named error.** A query that may find nothing
  raises an `Error` with a message naming what was missing — never returns
  `undefined` for the caller to trip over.
  - Right: `if (!row) throw new Error("No templates available"); return row;`
  - Wrong: `return row;` // row may be undefined
- **Read functions name what they return.** `listMemes`, `getRandomTemplate` —
  a verb plus the thing. Not `data()` or `query2()`.
