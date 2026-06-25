#!/usr/bin/env node
// check-docs-drift.mjs — find where docs/api.md fell behind the code. NO LLM.
//
// The deterministic half of the docs-drift tool. It reads the data-access
// functions exported from lib/db.ts and the function names documented in
// docs/api.md, and prints the gap both ways:
//
//   * exported in the code but missing from the doc  (the doc fell behind)
//   * documented but gone from the code              (the doc describes a ghost)
//
// The `check-docs-drift` skill calls this for the facts, then proposes the doc
// edit in human language. The gap itself is found here, by parsing the source —
// not guessed by a model. Exit code 1 on drift, 0 when in sync, so a CI step
// (.github/workflows/docs-drift.yml) can branch on it.
//
// Usage:  node scripts/check-docs-drift.mjs
import { readFileSync } from "node:fs";

const SRC = "lib/db.ts";
const DOC = "docs/api.md";

// Infra accessors that are not part of the data-access surface a consumer documents.
const INFRA = new Set(["getDb", "createDb", "initDb", "seedIfEmpty"]);

function codeFunctions(srcPath) {
  const src = readFileSync(srcPath, "utf8");
  const names = new Set();
  for (const m of src.matchAll(/export\s+function\s+([a-zA-Z_][\w]*)/g)) {
    if (!INFRA.has(m[1])) names.add(m[1]);
  }
  return names;
}

function docFunctions(docPath) {
  const text = readFileSync(docPath, "utf8");
  const names = new Set();
  // `name(` inside backticks is the documented shape.
  for (const m of text.matchAll(/`([a-z][a-zA-Z0-9_]*)\s*\(/g)) names.add(m[1]);
  return names;
}

const inCode = codeFunctions(SRC);
const inDoc = docFunctions(DOC);

const undocumented = [...inCode].filter((n) => !inDoc.has(n)).sort();
const ghost = [...inDoc].filter((n) => !inCode.has(n)).sort();

console.log(`data functions exported in ${SRC}: ${[...inCode].sort().join(", ")}`);
console.log(`functions documented in ${DOC}: ${[...inDoc].sort().join(", ")}`);
console.log("");

if (undocumented.length === 0 && ghost.length === 0) {
  console.log("✓ no drift — docs/api.md matches the code");
  process.exit(0);
}

if (undocumented.length) {
  console.log("✗ in the code but missing from the doc (doc fell behind):");
  for (const n of undocumented) console.log(`    - ${n}()`);
}
if (ghost.length) {
  console.log("✗ in the doc but gone from the code (doc describes a ghost):");
  for (const n of ghost) console.log(`    - ${n}()`);
}
process.exit(1);
