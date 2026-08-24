#!/usr/bin/env bash
# Production FE tip gate — run BEFORE and AFTER any menuply.com alias / vercel --prod.
set -euo pipefail

HOST="${1:-https://menuply.com}"
# Locked tip 2026-08-24: menubloc-frontend-89jj1mz2b-menuply.vercel.app / index-6lPa6XN2.js (FE ef4420d;BE d15c9260;diner video record Stop blob URL fix)
LOCKED_BUNDLE="index-6lPa6XN2.js"
LOCKED_DEPLOY="menubloc-frontend-89jj1mz2b-menuply.vercel.app"

html=$(curl -sSL -m 25 -H 'Cache-Control: no-cache' "${HOST}/?gate=$(date +%s)")
bundle=$(printf '%s' "$html" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)
if [[ -z "$bundle" ]]; then
  echo "FAIL: no bundle on ${HOST}"
  exit 1
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

fail=0
bundle_mismatch=0
content_fail=0
if [[ "$bundle" != "$LOCKED_BUNDLE" ]]; then
  echo "FAIL: bundle != locked tip"
  echo "HINT: If apex already serves the INTENDED new tip, locks are stale — do NOT restore."
  echo "HINT: bash scripts/lock-menuply-production-tip.sh <new-deploy> ${bundle}"
  echo "HINT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
  bundle_mismatch=1
  fail=1
fi
mark_content() { echo "$1"; content_fail=1; fail=1; }
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

if [[ "$fail" -ne 0 ]]; then
  if [[ "$bundle_mismatch" -eq 1 && "$content_fail" -eq 0 ]]; then
    echo "RESULT=FAIL — likely STALE LOCKS (not automatic restore). Lock live tip then re-run tip-gate."
    echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
    exit 1
  fi
  echo "RESULT=FAIL — health/content failure or unexpected tip. Restore only if new tip is bad:"
  echo "  npx vercel alias set ${LOCKED_DEPLOY} menuply.com && same for www.menuply.com"
  echo "CONTRACT: docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md"
  exit 1
fi
echo "RESULT=PASS — tip healthy (${LOCKED_DEPLOY} / ${LOCKED_BUNDLE})"
exit 0
