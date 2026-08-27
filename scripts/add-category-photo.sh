#!/usr/bin/env bash
#
# Add a real photograph for a category, from a URL or a local file.
#
#   ./scripts/add-category-photo.sh electronics https://example.com/headphones.jpg
#   ./scripts/add-category-photo.sh tools ~/Pictures/our-wrench-set.jpg
#
# WHY THIS SCRIPT EXISTS
# ----------------------
# The repository ships an SVG illustration per category so no card is ever empty, and a raster file
# beats the SVG automatically. Adding a photograph is therefore just "put a correctly named file in
# public/categories/" — but two things went wrong the last time images were added by hand, and this
# script exists to make both impossible:
#
#   1. A URL that 404s. Next's image optimiser then logs an upstream error on every request and the
#      card falls back silently. This script refuses to write a file unless the download returned
#      HTTP 200 with an image content-type and a plausible size.
#   2. A file whose SUBJECT is wrong — a photograph of coffee beans saved as the kitchen appliance.
#      No script can catch that, so this one prints the path and tells you to look at it. That is the
#      one step that has to be human.
#
# It writes nothing outside public/categories/ and never overwrites without saying so.

set -euo pipefail

KEYS=(electronics home-kitchen accessories beauty tools office fitness fashion)
DEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/public/categories"

die() { printf '\033[31merror:\033[0m %s\n' "$1" >&2; exit 1; }
note() { printf '\033[36m%s\033[0m\n' "$1"; }
ok()   { printf '\033[32m%s\033[0m\n' "$1"; }

[[ $# -eq 2 ]] || die "usage: $0 <category-key> <url-or-file>
valid keys: ${KEYS[*]}"

KEY="$1"
SOURCE="$2"

# shellcheck disable=SC2076
[[ " ${KEYS[*]} " =~ " ${KEY} " ]] || die "'${KEY}' is not a category key.
valid keys: ${KEYS[*]}"

[[ -d "$DEST_DIR" ]] || die "missing $DEST_DIR — run this from inside the repository"

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

if [[ "$SOURCE" =~ ^https?:// ]]; then
  note "downloading $SOURCE"
  # -f so an HTTP error is a failure rather than a saved error page, -L to follow redirects.
  HTTP_CODE="$(curl -fsSL -o "$TMP" -w '%{http_code}' --max-time 45 "$SOURCE" || true)"
  [[ "$HTTP_CODE" == "200" ]] || die "download failed (HTTP ${HTTP_CODE:-none}). Nothing written.
This is exactly the failure that put a 404 in the dev log before — the file is not saved."
else
  [[ -f "$SOURCE" ]] || die "no such file: $SOURCE"
  cp "$SOURCE" "$TMP"
fi

# Content sniffing, so an HTML error page or a PDF cannot land in the image folder.
MIME="$(file --brief --mime-type "$TMP")"
case "$MIME" in
  image/jpeg) EXT="jpg" ;;
  image/png)  EXT="png" ;;
  image/webp) EXT="webp" ;;
  image/avif) EXT="avif" ;;
  *) die "that is not a supported image (detected: $MIME). Nothing written." ;;
esac

BYTES="$(wc -c < "$TMP" | tr -d ' ')"
[[ "$BYTES" -gt 4096 ]] || die "file is only ${BYTES} bytes — almost certainly an error page, not a photo."

# Remove any other raster for this key so precedence stays unambiguous.
for existing in "$DEST_DIR/$KEY".{jpg,jpeg,png,webp,avif}; do
  [[ -f "$existing" ]] || continue
  note "replacing $(basename "$existing")"
  rm -f "$existing"
done

DEST="$DEST_DIR/$KEY.$EXT"
cp "$TMP" "$DEST"

ok "wrote public/categories/$KEY.$EXT  (${MIME}, ${BYTES} bytes)"
cat <<EOF

Now LOOK at it: $DEST

A script can prove a file is a valid image. It cannot prove the image shows what the
category says it shows, and a plausible photograph of the wrong subject is worse than a
broken one — it mislabels the category and misdescribes it to screen readers.

The dev server picks this up on the next refresh; no restart needed.
EOF
