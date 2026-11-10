#!/usr/bin/env bash
# Is BASE..HEAD a docs/release-lock-only change?
#
#   bash scripts/release/docs-only-diff.sh <BASE_SHA> <HEAD_SHA>
#
# exit 0  = every changed path is on the allowlist below (safe to skip a build)
# exit 1  = at least one changed path can affect the built site (must build)
# exit 2  = could not tell (missing commit, git error) -> callers must treat as "must build"
#
# The allowlist is deliberately tiny. Anything not listed builds, including
# every other file under scripts/ (generateBuildInfo, prerender, buildSeoPages…
# run during `npm run build`), vercel.json, middleware.js, public/, src/.
set -uo pipefail

BASE="${1:-}"
HEAD="${2:-}"
[[ -n "$BASE" && -n "$HEAD" ]] || { echo "docs-only-diff: need BASE and HEAD" >&2; exit 2; }

git cat-file -e "${BASE}^{commit}" 2>/dev/null || { echo "docs-only-diff: base ${BASE} not in clone" >&2; exit 2; }
git cat-file -e "${HEAD}^{commit}" 2>/dev/null || { echo "docs-only-diff: head ${HEAD} not in clone" >&2; exit 2; }

if ! files=$(git diff --name-only --no-renames "${BASE}" "${HEAD}" 2>/dev/null); then
  echo "docs-only-diff: git diff failed" >&2
  exit 2
fi

if [[ -z "$files" ]]; then
  echo "docs-only-diff: no file changes"
  exit 0
fi

is_allowed() {
  case "$1" in
    docs/*) return 0 ;;                                    # guardrails, LKG mirror, reports
    .github/*) return 0 ;;                                 # CI config, not part of the site
    scripts/assert-menuply-production-tip.sh) return 0 ;;  # release lock (tip-gate)
    scripts/release/*) return 0 ;;                         # release tooling itself
    */*) return 1 ;;                                       # any other nested path builds
    *.md) return 0 ;;                                      # top-level README/CLAUDE/AGENTS…
    *) return 1 ;;
  esac
}

blocking=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  if is_allowed "$f"; then
    echo "  skip-ok: $f"
  else
    echo "  BUILD:   $f"
    blocking=1
  fi
done <<< "$files"

if [[ "$blocking" -eq 0 ]]; then
  echo "docs-only-diff: docs/lock-only change"
  exit 0
fi
echo "docs-only-diff: app-affecting change"
exit 1
