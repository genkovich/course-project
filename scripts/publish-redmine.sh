#!/usr/bin/env bash
# publish-redmine.sh — publish docs/user-guide/*.md to the Redmine wiki.
# Deterministic, NO LLM. One wiki page per file (the file stem is the page name).
#
# Raw markdown does not render on the wiki as-is, so before PUTting each page it:
#   - uploads every screenshot it references and attaches it to the page, so
#     ![alt](img/foo.png) actually shows (Redmine resolves an inline image to a
#     page attachment by its bare filename)
#   - rewrites image paths   img/foo.png  -> foo.png   (the attachment basename)
#     Only successfully uploaded images are rewritten; failed uploads keep their
#     original path so the breakage is visible rather than silently mislinked.
#   - strips the .md from sibling wiki links: [x](page.md) -> [x](page), so the
#     link points at the wiki page, not a "page.md" that does not exist. Links
#     with a slash (e.g. ../api.md) point outside the wiki and are left alone.
#
# Reads REDMINE_URL, REDMINE_API_KEY, REDMINE_PROJECT from the environment — the
# same names the merge gate (release.yml) reads as repository secrets, and the
# publish-redmine skill reads from a local .env. Missing any of them: it stops.
#
# Usage:  REDMINE_URL=… REDMINE_API_KEY=… REDMINE_PROJECT=… bash scripts/publish-redmine.sh
set -euo pipefail

: "${REDMINE_URL:?REDMINE_URL is required}"
: "${REDMINE_API_KEY:?REDMINE_API_KEY is required}"
: "${REDMINE_PROJECT:?REDMINE_PROJECT is required}"

# Always resolve docs/ relative to this script's location, regardless of cwd.
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_DIR="${SCRIPT_DIR}/../docs/user-guide"

# Emit a GitHub Actions annotation when running in CI; plain echo otherwise.
notice() { if [ -n "${GITHUB_ACTIONS:-}" ]; then echo "::notice::$*"; else echo "$*"; fi; }

content_type_for() {
  case "${1##*.}" in
    png)      echo "image/png" ;;
    jpg|jpeg) echo "image/jpeg" ;;
    gif)      echo "image/gif" ;;
    *)        echo "application/octet-stream" ;;
  esac
}

shopt -s nullglob
pages=("$DOCS_DIR"/*.md)
if [ ${#pages[@]} -eq 0 ]; then
  notice "no docs/user-guide/*.md to publish"
  exit 0
fi

for f in "${pages[@]}"; do
  page="$(basename "$f" .md)"

  # 1. Upload every img/… screenshot this page references, collecting Redmine
  #    upload tokens into an array of {token,filename,content_type} for the PUT.
  #    Also build a list of successfully-uploaded basenames so that only those
  #    paths are rewritten in step 2 (avoiding broken references on upload failure).
  uploads="[]"
  uploaded_fnames=()
  imgs="$(grep -oE '\(img/[^)]+\)' "$f" | sed -E 's/^\(//; s/\)$//' | sort -u || true)"
  img_count=0
  while IFS= read -r rel; do
    [ -n "$rel" ] || continue
    src="$DOCS_DIR/$rel"
    if [ ! -f "$src" ]; then
      echo "  ! missing image $src" >&2
      continue
    fi
    fname="$(basename "$rel")"
    ctype="$(content_type_for "$fname")"
    # Use || true so a network failure (curl non-zero exit) doesn't abort the
    # whole script via set -e / pipefail; the empty-token guard below handles it.
    token="$(curl -sS -X POST \
      -H "Content-Type: application/octet-stream" \
      -H "X-Redmine-API-Key: ${REDMINE_API_KEY}" \
      --data-binary @"$src" \
      "${REDMINE_URL}/uploads.json?filename=${fname}" \
      | jq -r '.upload.token // empty' \
      || true)"
    if [ -z "$token" ]; then
      echo "  ! upload failed for $fname (image path left unchanged)" >&2
      continue
    fi
    uploads="$(printf '%s' "$uploads" | jq -c \
      --arg t "$token" --arg fn "$fname" --arg ct "$ctype" \
      '. + [{token:$t, filename:$fn, content_type:$ct}]')"
    uploaded_fnames+=("$fname")
    img_count=$((img_count + 1))
  done <<EOF
$imgs
EOF

  # 2. Rewrite the markdown for Redmine:
  #    a) Replace img/…/foo.png with foo.png (attachment basename) — but ONLY for
  #       images that were actually uploaded, so broken uploads stay visible.
  #    b) Strip .md from sibling wiki links.
  #
  #    We apply the image rewrite as a sequence of individual sed expressions, one
  #    per uploaded file, so we only touch paths whose uploads succeeded and we
  #    correctly handle nested subdirectories (e.g. img/screenshots/foo.png ->
  #    foo.png, matching the basename used when uploading).
  text="$(cat "$f")"
  for fname in "${uploaded_fnames[@]}"; do
    # Replace any (img/…/fname) or (img/fname) with (fname).
    text="$(printf '%s' "$text" | sed -E "s#\\(img/[^)]*$(printf '%s' "$fname" | sed 's/[.[\*^$]/\\&/g')\\)#(${fname})#g")"
  done
  # Strip .md from sibling wiki links (no slash in the stem).
  text="$(printf '%s' "$text" | sed -E 's#\]\(([A-Za-z0-9._-]+)\.md\)#](\1)#g')"

  # 3. PUT the page text plus the upload tokens that attach the screenshots.
  code="$(jq -n --arg text "$text" --argjson uploads "$uploads" \
      '{wiki_page:{text:$text, uploads:$uploads}}' \
    | curl -sS -o /dev/null -w "%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "X-Redmine-API-Key: ${REDMINE_API_KEY}" \
        --data-binary @- \
        "${REDMINE_URL}/projects/${REDMINE_PROJECT}/wiki/${page}.json")"
  echo "→ ${page}: HTTP ${code} (${img_count} image(s) attached)"

  # Treat anything outside 2xx as a failure so CI doesn't silently pass on
  # auth errors, wrong project names, or server-side validation failures.
  if [[ ! "$code" =~ ^2 ]]; then
    echo "  ! PUT failed for page '${page}' (HTTP ${code})" >&2
    exit 1
  fi
done
