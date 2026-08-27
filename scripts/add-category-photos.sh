#!/usr/bin/env bash
#
# Add photographs for several categories at once, from a manifest.
#
#   cp scripts/category-photos.example.txt photos.txt
#   # edit photos.txt, then:
#   ./scripts/add-category-photos.sh photos.txt
#
# Each line is "<category-key> <url-or-file>". Blank lines and lines starting with # are ignored.
# Every entry goes through add-category-photo.sh, so each one is checked for HTTP status,
# content-type and file size before anything is written. One bad entry does not stop the rest.

set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="${1:-}"

[[ -n "$MANIFEST" && -f "$MANIFEST" ]] || {
  printf '\033[31merror:\033[0m usage: %s <manifest-file>\n' "$0" >&2
  printf 'see scripts/category-photos.example.txt for the format\n' >&2
  exit 1
}

added=0; failed=0
while read -r key source _rest; do
  [[ -z "${key:-}" || "$key" == \#* ]] && continue
  [[ -n "${source:-}" ]] || { printf '\033[33mskip:\033[0m %s has no source\n' "$key"; continue; }
  if "$HERE/add-category-photo.sh" "$key" "$source" >/dev/null 2>&1; then
    printf '\033[32m  added\033[0m %s\n' "$key"; added=$((added+1))
  else
    printf '\033[31m  failed\033[0m %s  (%s)\n' "$key" "$source"; failed=$((failed+1))
  fi
done < "$MANIFEST"

printf '\n%d added, %d failed\n' "$added" "$failed"
[[ $added -gt 0 ]] && printf 'Now LOOK at public/categories/ — a script cannot tell whether a photo shows the right subject.\n'
exit 0
