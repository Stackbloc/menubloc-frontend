# CPD — Feed Yellow Browser icon → restaurant menu

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only (no BE push)

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `9acd41d9` — `feat(feed): Yellow Browser icon opens current video restaurant menu` |
| **Live tip** | `menubloc-frontend-pu7obcw0a-menuply.vercel.app` / `index-DBmDN1zE.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (`1341b5a2` noted at lock) |

## What shipped

- Feed reel (`SeeWhosEatingFullscreen`) and Deals reel (`DealVideoSwipe`): `BrowseMenusIcon` beside Share & Invite
- Tap records `recordFeedMenuOpen` and navigates via `menuPathFromRestaurantRef` to that restaurant’s public menu
- Shown only when restaurant ref exists (same gate as Share & Invite)

## Verification

- Contract: `node --test test/feedShareContract.test.js test/feedMenuLibraryContract.test.js` PASS (pre-ship)
- Live bundle: `feed-video-yellow-browser` present on `index-DBmDN1zE.js`
- `cpd-fe.sh` → **RESULT=PASS**

## Human smoke (recommended)

1. Open Feed → video with restaurant (e.g. Domino’s)  
2. Tap yellow menu icon next to Share & Invite → that restaurant’s menu  

## Docs

Tip-gate + LKG locked by `cpd-fe.sh` / `lock-menuply-production-tip.sh`.
