# CPD — Menu Browser PiP (frozen Browse + mini-player)

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only (no BE feature push)

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `be9711e7` — `feat(feed): Menu Browser PiP with frozen browse restaurant` |
| **Live tip** | `menubloc-frontend-29m19o3pi-menuply.vercel.app` / `index-Dy6Tr1Dx.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ `main` |
| BE | unchanged this CPD (`8c1a9020` noted at lock) |

## What shipped

- Menu Browser icon opens restaurant menu as primary surface with Feed video as PiP (audio preferred)
- **Frozen Browse context** (`browseRestaurantRef`) — Feed index may advance independently
- Explicit **Browse this menu** to switch Browse to the playing restaurant
- Hover/aria: **Menu Browser**
- Deals reel parity

## Verification

- Contract: `node --test test/feedMenuBrowserPipContract.test.js test/feedShareContract.test.js test/feedMenuLibraryContract.test.js` PASS
- Live bundle: `feed-menu-browser-pip`, `Browse this menu` present on `index-Dy6Tr1Dx.js`
- Tip-gate: apex + www **PASS**

## Human smoke (recommended)

1. Feed → Menu Browser on Domino’s → menu + PiP  
2. Advance Feed (swipe/keys) → PiP changes, menu stays Domino’s  
3. Tap **Browse this menu** when playing another restaurant  
4. ← Feed / tap PiP → full reel  

## Docs

`docs/architecture/2026-09-06_menu-browser-pip-frozen-browse-context.md`  
Tip-gate + LKG locked after alias.
