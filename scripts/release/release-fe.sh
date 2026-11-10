#!/usr/bin/env bash
# Staged FE release: promote the GitHub-built production deployment of ONE exact commit.
#
# GitHub builds every push to main once, as a staged production deployment (the project's
# "Auto-assign Custom Production Domains" is OFF, so nothing goes live on push).
# This script is the only thing that puts a build on menuply.com:
#
#   1. resolve the exact commit -> its own Ready git production deployment (never "latest")
#   2. validate commit + deployment metadata, then run the tip-gate content checks
#      against that deployment before it is live
#   3. vercel promote (reuses the build, no rebuild)
#   4. verify every production host now serves it, wait out the Cloudflare switch,
#      smoke-test the live site, lock the tip, tip-gate apex + www must PASS
#   5. any failure after promotion -> vercel rollback to the deployment that was live
#      before, verify, and re-lock to it
#
# Usage:
#   bash scripts/release/release-fe.sh [--sha <commit>] [--note "text"] [--dry-run]
#                                      [--commit-lock] [--push-lock]
#   --sha          commit on origin/main to release (default: origin/main)
#   --dry-run      stop after all pre-promotion checks; changes nothing
#   --commit-lock  commit the updated tip-gate + LKG mirror in this repo
#   --push-lock    also push that commit (docs-only: the Vercel ignore step skips the build)
#
# Auth: the logged-in Vercel CLI, or VERCEL_TOKEN + VERCEL_ORG_ID + VERCEL_PROJECT_ID (CI).
#
# Exit: 0 PASS (or already live) · 1 refused before promotion (production untouched)
#       2 promoted, failed checks, ROLLED BACK · 4 ROLLBACK FAILED (act now)
set -uo pipefail

SCOPE="menuply"
PROJECT="menubloc-frontend"
GIT_ORG="Stackbloc"
GIT_REPO="menubloc-frontend"
HOSTS=(menuply.com www.menuply.com crm.menuply.com venues.menuply.com)
BACKEND_HEALTH="https://menubloc-backend-production.up.railway.app/health"
WAIT_FOR_BUILD_SECS="${WAIT_FOR_BUILD_SECS:-1200}"
CDN_SETTLE_SECS="${CDN_SETTLE_SECS:-120}"   # see memory: never fetch a new bundle right after the HTML switches

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "${SCRIPT_DIR}/../.." && pwd)"
GATE="${REPO}/scripts/assert-menuply-production-tip.sh"
LOCK="${SCRIPT_DIR}/lock-tip.sh"
DOCS_ONLY="${SCRIPT_DIR}/docs-only-diff.sh"

SHA_IN=""; NOTE="release"; DRY=0; COMMIT_LOCK=0; PUSH_LOCK=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --sha) SHA_IN="${2:-}"; shift 2 ;;
    --note) NOTE="${2:-}"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    --commit-lock) COMMIT_LOCK=1; shift ;;
    --push-lock) COMMIT_LOCK=1; PUSH_LOCK=1; shift ;;
    -h|--help) sed -n 2,28p "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

cd "$REPO"
log()    { echo "[release] $*"; }
refuse() { echo "RESULT=REFUSED — $1 (production untouched)" >&2; exit 1; }

api() { vercel api "$1" --scope "$SCOPE" 2>/dev/null; }
jq_py() { python3 -c "import json,sys; d=json.load(sys.stdin); $1"; }

alias_target() { api "/v4/aliases/$1" | jq_py "print(d.get('deploymentId') or '')" 2>/dev/null; }
live_bundle() { curl -sSL -m 25 -H 'Cache-Control: no-cache' "https://menuply.com/?release=$(date +%s)" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1; }

for bin in vercel git python3 curl; do command -v "$bin" >/dev/null || refuse "missing $bin"; done
[[ -f "$GATE" && -f "$LOCK" && -f "$DOCS_ONLY" ]] || refuse "release scripts missing in $REPO"

# ---------------------------------------------------------------- 1. commit
log "=== 1. Commit ==="
git fetch --quiet origin main || refuse "git fetch failed"
TARGET=$(git rev-parse --verify "${SHA_IN:-origin/main}^{commit}" 2>/dev/null) || refuse "unknown commit ${SHA_IN}"
git merge-base --is-ancestor "$TARGET" origin/main || refuse "commit ${TARGET} is not on origin/main (push it first)"
log "target=${TARGET} ($(git log -1 --format=%s "$TARGET" | cut -c1-70))"
[[ "$TARGET" == "$(git rev-parse origin/main)" ]] || log "WARN: target is not the newest commit on origin/main ($(git rev-parse --short origin/main))"

# deployments of one exact commit, filtered to the GitHub production build of main in this repo
deployments_for() {
  api "/v6/deployments?projectId=${PROJECT}&target=production&limit=20&sha=$1" | python3 -c "
import json,sys
sha=sys.argv[1]
for x in json.load(sys.stdin).get('deployments',[]):
    m=x.get('meta') or {}
    if x.get('source')!='git': continue
    if m.get('githubCommitSha')!=sha or m.get('githubCommitRef')!='main': continue
    if m.get('githubCommitOrg')!='${GIT_ORG}' or m.get('githubCommitRepo')!='${GIT_REPO}': continue
    print(x['uid'], x['state'], x['url'], x['created'])
" "$1"
}

# Resolve the deployment: the target commit's own build; if that commit's build was skipped
# by the ignore step (docs/lock-only), step back one commit at a time — only across
# docs/lock-only commits — to the nearest commit that has its own build.
resolve() {
  local c="$1" waited=0 hops=0 rows ready building
  while :; do
    rows=$(deployments_for "$c")
    ready=$(echo "$rows" | awk '$2=="READY"' | sort -k4 -nr | head -1)
    building=$(echo "$rows" | awk '$2=="BUILDING"||$2=="QUEUED"||$2=="INITIALIZING"' | head -1)
    if [[ -n "$ready" ]]; then echo "$c $ready"; return 0; fi
    if [[ -n "$building" ]]; then
      [[ "$waited" -lt "$WAIT_FOR_BUILD_SECS" ]] || { echo "TIMEOUT building ${c}" >&2; return 1; }
      log "build for ${c:0:8} is still running… (${waited}s)" >&2
      sleep 20; waited=$((waited+20)); continue
    fi
    if echo "$rows" | awk '$2=="ERROR"' | grep -q .; then echo "build FAILED for ${c}" >&2; return 1; fi
    if echo "$rows" | awk '$2=="CANCELED"' | grep -q . || [[ "$hops" -gt 0 || "$waited" -ge 300 ]]; then
      # skipped/none: only step back across a docs/lock-only commit
      local parent; parent=$(git rev-parse "${c}^" 2>/dev/null) || { echo "no parent for ${c}" >&2; return 1; }
      if bash "$DOCS_ONLY" "$parent" "$c" >/dev/null; then
        log "${c:0:8} is docs/lock-only (no own build) -> checking ${parent:0:8}" >&2
        c="$parent"; hops=$((hops+1)); waited=300
        [[ "$hops" -le 30 ]] || { echo "too many docs-only hops" >&2; return 1; }
        continue
      fi
      echo "no production build for app commit ${c}" >&2; return 1
    fi
    # nothing yet for the target: GitHub webhook may still be creating it
    log "no deployment for ${c:0:8} yet… (${waited}s)" >&2
    sleep 20; waited=$((waited+20))
  done
}

R=$(resolve "$TARGET") || refuse "could not resolve a Ready build for ${TARGET}"
read -r BUILT_SHA DEP_ID DEP_STATE DEP_URL _ <<< "$R"
log "deployment=${DEP_ID} url=${DEP_URL} built_from=${BUILT_SHA}"
if [[ "$BUILT_SHA" != "$TARGET" ]]; then
  bash "$DOCS_ONLY" "$BUILT_SHA" "$TARGET" >/dev/null || refuse "build ${BUILT_SHA} differs from ${TARGET} in app files"
  log "target differs from the built commit only in docs/lock files"
fi

# ---------------------------------------------------------------- 2. validate
log "=== 2. Pre-promotion validation ==="
api "/v13/deployments/${DEP_ID}" | python3 -c "
import json,sys
d=json.load(sys.stdin); m=d.get('meta') or {}
probs=[]
if d.get('readyState')!='READY': probs.append('not READY')
if d.get('target')!='production': probs.append('target is not production')
if d.get('source')!='git': probs.append('not a GitHub build')
if m.get('githubCommitSha')!=sys.argv[1]: probs.append('commit mismatch')
if m.get('githubCommitRef')!='main': probs.append('branch is not main')
if d.get('projectId') is None: probs.append('no project')
print('deployment checks:', 'OK' if not probs else '; '.join(probs))
sys.exit(1 if probs else 0)
" "$BUILT_SHA" || refuse "deployment metadata check failed"

PREV_ID=$(alias_target menuply.com)
[[ -n "$PREV_ID" ]] || refuse "cannot read current production deployment"
PREV_URL=$(api "/v13/deployments/${PREV_ID}" | jq_py "print(d['url'])")
PREV_BUNDLE=$(live_bundle)
log "currently live: ${PREV_ID} ${PREV_URL} (${PREV_BUNDLE})"
for h in "${HOSTS[@]}"; do
  t=$(alias_target "$h"); [[ "$t" == "$PREV_ID" ]] || log "WARN: ${h} serves ${t}, not ${PREV_ID}"
done

if [[ "$PREV_ID" == "$DEP_ID" ]]; then
  log "this deployment is already live; nothing to promote"
  bash "$GATE" https://menuply.com | tail -1
  exit 0
fi

TIP_GATE_DEPLOYMENT="$DEP_ID" bash "$GATE" > /tmp/release-pregate.$$ 2>&1
pre=$?; tail -3 /tmp/release-pregate.$$; rm -f /tmp/release-pregate.$$
[[ "$pre" -eq 0 ]] || refuse "content checks failed on ${DEP_URL}"

for path in /demo /sitemap.xml /clusters/california/los-angeles/usc /search; do
  code=$(vercel curl "$path" --deployment "$DEP_ID" -- -s -o /dev/null -w '%{http_code}' 2>/dev/null)
  log "staged ${path} -> ${code}"
  [[ "$code" == "200" ]] || refuse "staged ${path} returned ${code}"
done
be=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "$BACKEND_HEALTH"); log "backend health -> ${be}"
[[ "$be" == "200" ]] || refuse "backend health ${be}"

if [[ "$DRY" -eq 1 ]]; then
  echo "RESULT=DRY_RUN_OK — would promote ${DEP_ID} (${DEP_URL}) from ${BUILT_SHA:0:8}; live stays ${PREV_ID}"
  exit 0
fi

# ---------------------------------------------------------------- rollback
rollback() {
  local why="$1"
  echo "!!! ${why} — rolling back to ${PREV_ID}" >&2
  vercel rollback "$PREV_ID" --yes --timeout 5m --scope "$SCOPE" 2>&1 | tail -3
  local ok=0
  for _ in $(seq 1 18); do
    [[ "$(alias_target menuply.com)" == "$PREV_ID" ]] && { ok=1; break; }; sleep 10
  done
  if [[ "$ok" -ne 1 ]]; then
    echo "RESULT=ROLLBACK_FAILED — menuply.com does not serve ${PREV_ID}." >&2
    echo "ACT NOW: vercel rollback ${PREV_ID} --scope ${SCOPE}  (or the Vercel dashboard: Deployments -> ${PREV_URL} -> Instant Rollback)" >&2
    exit 4
  fi
  bash "$LOCK" "$PREV_URL" "$PREV_BUNDLE" --note "rollback after failed release of ${BUILT_SHA:0:8}" >/dev/null 2>&1 || true
  git -C "$REPO" checkout -- scripts/assert-menuply-production-tip.sh docs/guardrails 2>/dev/null || true
  echo "RESULT=ROLLED_BACK — production is back on ${PREV_URL} (${PREV_BUNDLE}). Release of ${BUILT_SHA} failed: ${why}" >&2
  exit 2
}

# ---------------------------------------------------------------- 3. promote
log "=== 3. Promote ${DEP_ID} ==="
vercel promote "$DEP_ID" --yes --timeout 5m --scope "$SCOPE" 2>&1 | tail -3
promoted=0
for _ in $(seq 1 18); do
  [[ "$(alias_target menuply.com)" == "$DEP_ID" ]] && { promoted=1; break; }; sleep 10
done
if [[ "$promoted" -ne 1 ]]; then
  now=$(alias_target menuply.com)
  [[ "$now" == "$PREV_ID" ]] && refuse "promote did not take effect; ${PREV_ID} is still live"
  rollback "menuply.com points at unexpected ${now}"
fi

# ---------------------------------------------------------------- 4. verify live
log "=== 4. Verify live ==="
for h in "${HOSTS[@]}"; do
  t=$(alias_target "$h"); log "${h} -> ${t}"
  [[ "$t" == "$DEP_ID" ]] || rollback "${h} did not move to the new deployment"
done
NEW_BUNDLE=""
for _ in $(seq 1 18); do
  NEW_BUNDLE=$(live_bundle); [[ -n "$NEW_BUNDLE" && "$NEW_BUNDLE" != "$PREV_BUNDLE" ]] && break; sleep 10
done
[[ -n "$NEW_BUNDLE" ]] || rollback "no bundle in live HTML"
[[ "$NEW_BUNDLE" != "$PREV_BUNDLE" ]] || log "note: bundle name unchanged (${NEW_BUNDLE}); identical app build"
log "live bundle ${NEW_BUNDLE}; waiting ${CDN_SETTLE_SECS}s before fetching it (Cloudflare)"
sleep "$CDN_SETTLE_SECS"

bash "$GATE" https://menuply.com > /tmp/release-live.$$ 2>&1; g=$?
tail -2 /tmp/release-live.$$; rm -f /tmp/release-live.$$
# 3 = content healthy but lock not yet updated (expected here)
[[ "$g" -eq 0 || "$g" -eq 3 ]] || rollback "live content checks failed (gate exit ${g})"
code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "https://menuply.com/assets/${NEW_BUNDLE}")
[[ "$code" == "200" ]] || rollback "live bundle returned ${code}"

# ---------------------------------------------------------------- 5. lock
log "=== 5. Lock tip ==="
BE_SHA=$(curl -sSL -m 15 "$BACKEND_HEALTH" | sed -n 's/.*"commit_hash":"\([^"]*\)".*/\1/p' | cut -c1-8)
bash "$LOCK" "$DEP_URL" "$NEW_BUNDLE" --fe-commit "${BUILT_SHA:0:8}" --be-commit "${BE_SHA:-}" --note "$NOTE" | tail -4
[[ "${PIPESTATUS[0]}" -eq 0 ]] || rollback "tip lock failed"
bash "$GATE" https://menuply.com | tail -1; a=${PIPESTATUS[0]}
bash "$GATE" https://www.menuply.com | tail -1; w=${PIPESTATUS[0]}
[[ "$a" -eq 0 && "$w" -eq 0 ]] || rollback "tip-gate not PASS after lock (apex ${a}, www ${w})"

if [[ "$COMMIT_LOCK" -eq 1 ]]; then
  git add scripts/assert-menuply-production-tip.sh docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md
  if ! git diff --cached --quiet; then
    git commit -q -m "CPD tip-lock: ${NOTE} ${NEW_BUNDLE}" -m "Release of ${BUILT_SHA} as ${DEP_URL}." && log "lock committed $(git rev-parse --short HEAD)"
    if [[ "$PUSH_LOCK" -eq 1 ]]; then
      for _ in 1 2 3; do
        git pull --quiet --rebase origin main && git push --quiet origin HEAD:main && { log "lock pushed"; break; }
        sleep 5
      done
    fi
  fi
fi

echo "RESULT=PASS"
echo "deploy=${DEP_URL}"
echo "deployment_id=${DEP_ID}"
echo "bundle=${NEW_BUNDLE}"
echo "fe_commit=${BUILT_SHA}"
echo "be_commit=${BE_SHA:-unknown}"
echo "previous=${PREV_URL} (${PREV_BUNDLE}) — rollback: vercel rollback ${PREV_ID} --scope ${SCOPE}"
exit 0
