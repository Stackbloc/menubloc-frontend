#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json ignoreCommand).
# Vercel semantics: exit 0 = SKIP the build (deployment marked CANCELED), exit 1 = BUILD.
#
# Skips only when BOTH hold:
#   - branch is main (branch previews always build)
#   - every file changed since the last successful main deployment is docs/release-lock only
# Every uncertain case builds.
set -uo pipefail

REF="${VERCEL_GIT_COMMIT_REF:-}"
SHA="${VERCEL_GIT_COMMIT_SHA:-}"
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"

echo "ignore-step: ref=${REF} sha=${SHA} previous=${PREV}"

if [[ "$REF" != "main" ]]; then
  echo "ignore-step: BUILD (not main; previews always build)"; exit 1
fi
if [[ -z "$SHA" || -z "$PREV" ]]; then
  echo "ignore-step: BUILD (no previous successful deployment SHA)"; exit 1
fi

# Vercel clones shallow; fetch the previous SHA if it is not present (public repo).
if ! git cat-file -e "${PREV}^{commit}" 2>/dev/null; then
  git fetch --quiet --depth=200 origin "$PREV" 2>/dev/null || true
fi

bash "$(dirname "$0")/docs-only-diff.sh" "$PREV" "$SHA"
rc=$?
if [[ "$rc" -eq 0 ]]; then
  echo "ignore-step: SKIP (docs/release-lock only since ${PREV})"; exit 0
fi
echo "ignore-step: BUILD (rc=${rc})"
exit 1
