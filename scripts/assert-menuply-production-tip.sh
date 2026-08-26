#!/usr/bin/env bash
# Production FE tip gate — run BEFORE and AFTER any menuply.com alias / vercel --prod.
#
# Results (one door — tip-gate is the authority):
#   RESULT=PASS        exit 0  — live bundle matches LOCKED_* and content health OK
#   RESULT=STALE_LOCK  exit 3  — content health OK but live != lock — do NOT restore
#   RESULT=UNHEALTHY   exit 2  — missing/broken tip or content identity failure
#
# CPD is incomplete until apex+www print RESULT=PASS after lock.
set -euo pipefail

HOST="${1:-https://menuply.com}"
# Locked tip 2026-08-26: menubloc-frontend-dy1boxufn-menuply.vercel.app / index-Wxgt5_-3.js (FE 0546f98;BE 985f1dcb;feed center X video create + plan video attach)
LOCKED_BUNDLE="index-Wxgt5_-3.js"
LOCKED_DEPLOY="menubloc-frontend-dy1boxufn-menuply.vercel.app"

html=$(curl -sSL -m 25 -H 'Cache-Control: no-cache' "${HOST}/?gate=$(date +%s)")
bundle=$(printf '%s' "$html" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)
if [[ -z "$bundle" ]]; then
  echo "host=${HOST}"
  echo "bundle="
  echo "locked_bundle=${LOCKED_BUNDLE}"
  echo "locked_deploy=${LOCKED_DEPLOY}"
  echo "RESULT=UNHEALTHY — no bundle on ${HOST}"
  echo "ACTION: Investigate production HTML. Do not restore from lock mismatch alone."
  exit 2
fi

curl -sSL -m 45 "${HOST}/assets/${bundle}" -o /tmp/menuply-tip-gate.js
js=/tmp/menuply-tip-gate.js

count() { grep -o "$1" "$js" 2>/dev/null | wc -l | tr -d ' ' || true; }

sd=$(count 'subscription-designer')
coming=$(count 'Coming Soon')
qr=$(count 'qr-kits/order')
view=$(count 'restaurant-profile-view-menu')
nonsub=$(count 'NONSUBSCRIBER')
railway=$(count 'menubloc-backend-production')
localn=$(count 'localhost:3001')

door_ct=$(curl -sSL -m 15 -o /dev/null -w '%{content_type}' "${HOST}/marketplace/placeholders/mkt-door-hangers.svg" || true)
tabl_ct=$(curl -sSL -m 15 -o /dev/null -w '%{content_type}' "${HOST}/billboards/tabl-m-la-billboard.jpg" || true)
tabl_sz=$(curl -sSL -m 15 -o /dev/null -w '%{size_download}' "${HOST}/billboards/tabl-m-la-billboard.jpg" || true)

echo "host=${HOST}"
echo "bundle=${bundle}"
echo "locked_bundle=${LOCKED_BUNDLE}"
echo "locked_deploy=${LOCKED_DEPLOY}"
echo "subscription-designer=${sd}"
echo "Coming_Soon=${coming}"
echo "qr-kits/order=${qr}"
echo "restaurant-profile-view-menu=${view}"
echo "NONSUBSCRIBER=${nonsub}"
echo "railway=${railway} localhost=${localn}"
echo "door_hangers_ct=${door_ct}"
echo "tabl_m_ct=${tabl_ct} size=${tabl_sz}"

bundle_mismatch=0
content_fail=0
[[ "$bundle" != "$LOCKED_BUNDLE" ]] && bundle_mismatch=1

mark_content() { echo "$1"; content_fail=1; }
[[ "$sd" -ge 20 ]] || mark_content "FAIL: subscription-designer FE markers missing"
[[ "$coming" -ge 1 ]] || mark_content "FAIL: Marketplace Coming Soon missing"
[[ "$qr" -ge 1 ]] || mark_content "FAIL: qr-kits/order missing"
[[ "$view" -ge 1 ]] || mark_content "FAIL: restaurant-profile-view-menu missing"
[[ "$nonsub" -eq 0 ]] || mark_content "FAIL: NONSUBSCRIBER present"
[[ "$railway" -gt "$localn" ]] || mark_content "FAIL: API base looks wrong"
case "$door_ct" in
  image/svg*) ;;
  *) mark_content "FAIL: door hangers placeholder not SVG (got ${door_ct})" ;;
esac
case "$tabl_ct" in
  image/jpeg*|image/jpg*)
    [[ "$tabl_sz" -gt 50000 ]] || mark_content "FAIL: Tabl M JPEG too small (${tabl_sz})"
    ;;
  *) mark_content "FAIL: Tabl M billboard not JPEG (got ${tabl_ct})" ;;
esac

if [[ "$content_fail" -ne 0 ]]; then
  echo "RESULT=UNHEALTHY — content/identity failure"
  echo "ACTION: Restore only if this tip is bad — alias a known-good deploy from LKG, then lock."
  echo "  npx vercel alias set ${LOCKED_DEPLOY} menuply.com && same for www.menuply.com"
  echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
  exit 2
fi

if [[ "$bundle_mismatch" -eq 1 ]]; then
  echo "RESULT=STALE_LOCK — LIVE healthy but LOCK outdated (do NOT restore)"
  echo "HINT: If apex already serves the INTENDED new tip, locks are stale — do NOT restore."
  echo "HINT: bash scripts/lock-menuply-production-tip.sh <new-deploy> ${bundle}"
  echo "HINT: CPD=INCOMPLETE until lock + tip-gate PASS + LKG sync"
  echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
  exit 3
fi

echo "RESULT=PASS — tip healthy (${LOCKED_DEPLOY} / ${LOCKED_BUNDLE})"
exit 0
