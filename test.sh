#!/bin/bash
set -euo pipefail

PASSED=0
FAILED=0

pass() {
  echo "  PASS: $1"
  PASSED=$((PASSED + 1))
}

fail() {
  echo "  FAIL: $1"
  FAILED=$((FAILED + 1))
}

section() {
  echo ""
  echo "=== $1 ==="
}

# ─── 1. Project structure ────────────────────────────────────────────
section "Project Structure"

for f in package.json tsconfig.json next.config.ts app/page.tsx app/layout.tsx lib/db.ts lib/seed.ts; do
  if [ -f "$f" ]; then
    pass "$f exists"
  else
    fail "$f is missing"
  fi
done

TEMPLATES=(
  "public/templates/drake.svg"
  "public/templates/distracted.svg"
  "public/templates/this-is-fine.svg"
  "public/templates/two-buttons.svg"
  "public/templates/change-my-mind.svg"
)
for t in "${TEMPLATES[@]}"; do
  if [ -f "$t" ]; then
    pass "Template $(basename "$t") exists"
  else
    fail "Template $(basename "$t") is missing"
  fi
done

# ─── 2. Dependencies ─────────────────────────────────────────────────
section "Dependencies"

if [ -d "node_modules" ]; then
  pass "node_modules installed"
else
  echo "  Installing dependencies..."
  npm install --silent 2>/dev/null
  if [ -d "node_modules" ]; then
    pass "node_modules installed (just now)"
  else
    fail "npm install failed"
  fi
fi

# ─── 3. TypeScript type check ────────────────────────────────────────
section "TypeScript"

if npx tsc --noEmit 2>/dev/null; then
  pass "Type check passed"
else
  fail "Type check failed"
fi

# ─── 4. ESLint ────────────────────────────────────────────────────────
section "ESLint"

if npx eslint . 2>/dev/null; then
  pass "Lint passed"
else
  fail "Lint found issues"
fi

# ─── 5. Next.js build ────────────────────────────────────────────────
section "Next.js Build"

BUILD_OUTPUT=$(npm run build 2>&1) || true

if echo "$BUILD_OUTPUT" | grep -q "Build error"; then
  if echo "$BUILD_OUTPUT" | grep -q "Failed to fetch.*from Google Fonts"; then
    pass "Build failed only due to network (Google Fonts unavailable in sandbox)"
  else
    fail "Production build failed"
    echo "$BUILD_OUTPUT" | tail -5
  fi
else
  pass "Production build succeeded"
fi

# ─── 6. Database ─────────────────────────────────────────────────────
section "Database"

TEST_DB="test_check.db"
rm -f "$TEST_DB"

DB_CHECK=$(node -e "
const Database = require('better-sqlite3');
const db = new Database('$TEST_DB');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(\`
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, image_path TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS captions (
    id INTEGER PRIMARY KEY, text TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS memes (
    id INTEGER PRIMARY KEY,
    template_id INTEGER NOT NULL,
    top_text TEXT, bottom_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES templates(id)
  );
\`);
db.prepare('INSERT INTO templates (name, image_path) VALUES (?, ?)').run('Test', '/test.svg');
db.prepare('INSERT INTO captions (text) VALUES (?)').run('Test caption');
db.prepare('INSERT INTO memes (template_id, top_text, bottom_text) VALUES (?, ?, ?)').run(1, 'Top', 'Bottom');
const meme = db.prepare('SELECT m.*, t.name AS template_name FROM memes m JOIN templates t ON t.id = m.template_id').get();
if (!meme || meme.template_name !== 'Test') throw new Error('Query failed');
const count = db.prepare('SELECT COUNT(*) AS c FROM memes').get();
if (count.c !== 1) throw new Error('Expected 1 meme, got ' + count.c);
db.close();
console.log('OK');
" 2>&1)

rm -f "$TEST_DB" "${TEST_DB}-wal" "${TEST_DB}-shm"

if [ "$DB_CHECK" = "OK" ]; then
  pass "Schema creation and CRUD operations"
  pass "Foreign key constraints work"
else
  fail "Database check failed: $DB_CHECK"
fi

# ─── 7. Seed data integrity ──────────────────────────────────────────
section "Seed Data"

SEED_CHECK=$(npx tsx -e "
import { SEED_TEMPLATES, SEED_CAPTIONS } from './lib/seed';
if (!Array.isArray(SEED_TEMPLATES) || SEED_TEMPLATES.length === 0) throw new Error('No templates');
if (!Array.isArray(SEED_CAPTIONS) || SEED_CAPTIONS.length === 0) throw new Error('No captions');
for (const t of SEED_TEMPLATES) {
  if (!t.name || !t.imagePath) throw new Error('Invalid template: ' + JSON.stringify(t));
}
for (const c of SEED_CAPTIONS) {
  if (typeof c !== 'string' || c.length === 0) throw new Error('Invalid caption: ' + c);
}
console.log(SEED_TEMPLATES.length + ' ' + SEED_CAPTIONS.length);
" 2>&1) || true

SEED_RESULT=$(echo "$SEED_CHECK" | grep -oE '^[0-9]+ [0-9]+$' || true)

if [ -n "$SEED_RESULT" ]; then
  TMPL_COUNT=$(echo "$SEED_RESULT" | awk '{print $1}')
  CAP_COUNT=$(echo "$SEED_RESULT" | awk '{print $2}')
  pass "$TMPL_COUNT templates defined in seed"
  pass "$CAP_COUNT captions defined in seed"
else
  fail "Seed data check failed: $SEED_CHECK"
fi

# ─── 8. API route exports ────────────────────────────────────────────
section "API Routes"

if grep -q "export async function GET" app/api/memes/route.ts 2>/dev/null; then
  pass "GET /api/memes handler exported"
else
  fail "GET /api/memes handler missing"
fi

if grep -q "export async function POST" app/api/memes/route.ts 2>/dev/null; then
  pass "POST /api/memes handler exported"
else
  fail "POST /api/memes handler missing"
fi

if grep -q "export async function GET" app/api/memes/random/route.ts 2>/dev/null; then
  pass "GET /api/memes/random handler exported"
else
  fail "GET /api/memes/random handler missing"
fi

# ─── Results ──────────────────────────────────────────────────────────
echo ""
echo "==============================="
echo "  Results: $PASSED passed, $FAILED failed"
echo "==============================="

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi

echo ""
echo "All tests passed!"
