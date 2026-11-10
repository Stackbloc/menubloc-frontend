#!/usr/bin/env bash
# ONE DOOR — FE CPD entrypoint (Mac). Since 2026-11-09 this no longer builds:
# GitHub builds every push to main once as a STAGED production deployment
# (Vercel auto-assign of production domains is OFF), and this script promotes the
# build of the exact pushed commit via scripts/release/release-fe.sh, which runs
# the pre-promotion checks, promote, live checks, automatic rollback, and tip lock.
# Cloud sessions use the same release script through GitHub Actions:
#   gh workflow run release-frontend.yml --ref main -f sha=<commit> -f note="…"
#
# CPD complete only when: promote succeeds AND live bundle verified AND tip locked
# AND tip-gate PASS on apex+www. Anything short → CPD=INCOMPLETE (non-zero exit).
#
# Usage:
#   bash scripts/cpd-fe.sh "short note"            # release origin/main (push first)
#   bash scripts/cpd-fe.sh --sha <commit> "note"   # release a specific commit on main
#   bash scripts/cpd-fe.sh --dry-run "note"        # every check, no promotion
#   bash scripts/cpd-fe.sh --lock-only "note"      # re-lock the live tip (INTENDED_DEPLOY=…)
set -euo pipefail

FE="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="${FE}/scripts/release/release-fe.sh"
LOCK="${FE}/scripts/release/lock-tip.sh"
GATE="${FE}/scripts/assert-menuply-production-tip.sh"

MODE="release"; SHA=""; EXTRA=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --lock-only) MODE="lock"; shift ;;
    --dry-run) EXTRA+=(--dry-run); shift ;;
    --sha) SHA="${2:-}"; shift 2 ;;
    *) break ;;
  esac
done
NOTE="${1:-cpd}"

echo "=== CPD FE START (one door: staged promote) ==="
cd "$FE"
BRANCH=$(git branch --show-current)
[[ "$BRANCH" == "main" ]] || { echo "FAIL: branch must be main (got $BRANCH)" >&2; exit 2; }

if [[ "$MODE" == "lock" ]]; then
  [[ -n "${INTENDED_DEPLOY:-}" ]] || { echo "CPD=INCOMPLETE — lock-only requires INTENDED_DEPLOY=menubloc-frontend-…-menuply.vercel.app" >&2; exit 3; }
  BUNDLE=$(curl -sSL -m 25 -H 'Cache-Control: no-cache' "https://menuply.com/?cpd=$(date +%s)" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1 || true)
  [[ -n "$BUNDLE" ]] || { echo "CPD=INCOMPLETE — no live bundle on menuply.com" >&2; exit 2; }
  bash "$LOCK" "${INTENDED_DEPLOY#https://}" "$BUNDLE" --fe-commit "$(git rev-parse --short HEAD)" --note "$NOTE"
  bash "$GATE" https://menuply.com && bash "$GATE" https://www.menuply.com && { echo "RESULT=PASS"; exit 0; }
  echo "CPD=INCOMPLETE — tip-gate not PASS after lock" >&2; exit 3
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "FAIL: working tree must be clean before release" >&2
  git status --porcelain >&2
  exit 2
fi
git fetch --quiet origin main
TARGET="${SHA:-origin/main}"
# Local commits not on origin/main are never released; app commits must be pushed first
# (GitHub builds the staged deployment). Local docs/lock-only commits are fine.
LOCK_MODE=(--push-lock)
if ! git merge-base --is-ancestor HEAD origin/main; then
  if ! bash scripts/release/docs-only-diff.sh origin/main HEAD >/dev/null; then
    echo "FAIL: main has local app commits not on origin/main — git push first" >&2
    exit 2
  fi
  LOCK_MODE=(--commit-lock)   # local lock commits exist: commit the new lock, leave pushing to you
fi

exec bash "$RELEASE" --sha "$TARGET" --note "$NOTE" "${LOCK_MODE[@]}" ${EXTRA[@]+"${EXTRA[@]}"}
