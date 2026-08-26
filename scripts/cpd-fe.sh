#!/usr/bin/env bash
# ONE DOOR — FE CPD entrypoint. Orchestrates the EXISTING tip-lock / tip-gate / LKG path.
# Does not introduce a second production-state authority.
#
# CPD complete only when: deploy+alias succeed AND live bundle verified AND tip locked
# AND tip-gate PASS on apex+www. Anything short → CPD=INCOMPLETE (exit 3 or 2).
#
# Usage:
#   bash scripts/cpd-fe.sh "short note"
#   bash scripts/cpd-fe.sh --lock-only "note"   # after manual alias; lock live tip
set -euo pipefail

ROOT="/Users/andrebarber/Desktop/menubloc"
FE="${ROOT}/menubloc-frontend-main"
GATE="${ROOT}/scripts/assert-menuply-production-tip.sh"
LOCK="${ROOT}/scripts/lock-menuply-production-tip.sh"

NOTE="${1:-cpd}"
SKIP_DEPLOY=0
if [[ "${1:-}" == "--lock-only" ]]; then
  SKIP_DEPLOY=1
  NOTE="${2:-lock-only}"
fi

incomplete() {
  echo "CPD=INCOMPLETE — $1" >&2
  echo "RESULT=INCOMPLETE" >&2
  exit 3
}

unhealthy() {
  echo "CPD=INCOMPLETE — $1" >&2
  echo "RESULT=UNHEALTHY" >&2
  exit 2
}

echo "=== CPD FE START (one door) ==="
cd "$FE"
case "$(pwd)" in
  */menubloc-frontend-main) ;;
  *) echo "FAIL: must use menubloc-frontend-main" >&2; exit 2 ;;
esac
BRANCH=$(git branch --show-current)
[[ "$BRANCH" == "main" ]] || { echo "FAIL: branch must be main (got $BRANCH)" >&2; exit 2; }
if [[ "$SKIP_DEPLOY" -eq 0 && -n "$(git status --porcelain)" ]]; then
  echo "FAIL: working tree must be clean before deploy" >&2
  git status --porcelain >&2
  exit 2
fi
HEAD=$(git rev-parse --short HEAD)
echo "fe_path=${FE}"
echo "branch=${BRANCH}"
echo "head=${HEAD}"

DEPLOY=""
if [[ "$SKIP_DEPLOY" -eq 0 ]]; then
  echo "=== Deploy (vercel --prod) ==="
  OUT=$(mktemp)
  set +e
  vercel --prod --yes 2>&1 | tee "$OUT"
  vc=$?
  set -e
  [[ "$vc" -eq 0 ]] || unhealthy "vercel --prod failed"
  DEPLOY=$(grep -oE 'menubloc-frontend-[a-z0-9]+-menuply\.vercel\.app' "$OUT" | head -1 || true)
  rm -f "$OUT"
  [[ -n "$DEPLOY" ]] || incomplete "could not parse Production deployment URL"

  echo "=== Alias menuply hosts ==="
  vercel alias set "$DEPLOY" menuply.com
  vercel alias set "$DEPLOY" www.menuply.com
  vercel alias set "$DEPLOY" crm.menuply.com
  vercel alias set "$DEPLOY" venues.menuply.com
else
  echo "=== Lock-only mode (no deploy) ==="
fi

echo "=== Verify live apex bundle ==="
BUNDLE=$(curl -sSL -m 25 -H 'Cache-Control: no-cache' "https://menuply.com/?cpd=$(date +%s)" \
  | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1 || true)
[[ -n "$BUNDLE" ]] || unhealthy "no live bundle on menuply.com"
echo "live_bundle=${BUNDLE}"

# Prefer intended deploy when provided; otherwise tip-gate lock --check / lock script
# will use the deploy host from vercel. If lock-only and DEPLOY empty, require caller
# to pass via env INTENDED_DEPLOY or we refuse (cannot invent deploy id from bundle alone).
if [[ -z "$DEPLOY" ]]; then
  if [[ -n "${INTENDED_DEPLOY:-}" ]]; then
    DEPLOY="${INTENDED_DEPLOY#https://}"
  else
    incomplete "lock-only requires INTENDED_DEPLOY=menubloc-frontend-…-menuply.vercel.app (bundle alone is not enough)"
  fi
fi
echo "deploy=${DEPLOY}"

BE=$(curl -sSL -m 15 "https://menubloc-backend-production.up.railway.app/health" \
  | sed -n 's/.*"commit_hash":"\([^"]*\)".*/\1/p' | cut -c1-8 || true)

echo "=== Lock tip-gate + sync existing LKG records ==="
bash "$LOCK" "$DEPLOY" "$BUNDLE" \
  --fe-commit "$HEAD" \
  --be-commit "${BE:-}" \
  --note "$NOTE"

echo "=== Final tip-gate (required for CPD complete) ==="
set +e
bash "$GATE" https://menuply.com
a=$?
bash "$GATE" https://www.menuply.com
w=$?
set -e

if [[ "$a" -eq 2 || "$w" -eq 2 ]]; then
  unhealthy "tip-gate UNHEALTHY after lock (apex exit ${a}, www exit ${w})"
fi
if [[ "$a" -ne 0 || "$w" -ne 0 ]]; then
  incomplete "tip-gate not PASS after lock (apex exit ${a}, www exit ${w}) — do NOT declare CPD done"
fi

echo "=== CPD FE COMPLETE ==="
echo "RESULT=PASS"
echo "deploy=${DEPLOY}"
echo "bundle=${BUNDLE}"
echo "fe_commit=${HEAD}"
echo "be_commit=${BE:-unknown}"
echo "NEXT: commit tip-gate + LKG docs (docs-only). Do not vercel --prod for docs."
exit 0
