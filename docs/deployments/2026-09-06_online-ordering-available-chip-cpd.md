# CPD — Online Ordering Available chip invert

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `2ffef241` — `feat(menu): show green Online Ordering Available chip only when applicable` |
| **Live tip** | `menubloc-frontend-kpbpt1y36-menuply.vercel.app` / `index-rqKCRCBk.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (lock noted `a3997be8`) |

## What shipped

- Yellow “unavailable / paused / closed” ordering callouts **removed**
- Compact green chip **Online Ordering Available** only when `isOnlineOrderingAvailable`
- Otherwise no ordering status chip

## Verification

- `cpd-fe.sh` → **RESULT=PASS**
- `orderingUnavailableBannerContract` + `test:menu-experience-contract` PASS pre-ship

## Human smoke

1. Menu without online ordering → no yellow unavailable banner  
2. Menu with online ordering → green “Online Ordering Available” chip  

## Docs

Tip-gate + LKG locked by `cpd-fe.sh`.
