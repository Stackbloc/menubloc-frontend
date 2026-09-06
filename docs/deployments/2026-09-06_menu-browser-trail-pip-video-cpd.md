# CPD — Menu Browser trail swipe + PiP video advance

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `5de9cf86` — `feat(feed): Menu Browser trail swipe, Full Feed, PiP video advance` |
| **Live tip** | `menubloc-frontend-ic3mqqx1s-menuply.vercel.app` / `index-BxOqMFHx.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (`6a88aa87` noted at lock) |

## What shipped

- Horizontal **menu trail** from open clip → current Feed restaurants
- **Prev/Next video** on PiP (+ swipe) while Browse stays independent
- **Full Feed** exit (header, PiP button, tap PiP)
- Explicit **Browse this menu** still required to jump trail to playing restaurant

## Verification

- `cpd-fe.sh` → **RESULT=PASS**
- Pre-ship contracts: `feedMenuBrowserPipContract` + feed share/library PASS
- Live strings expected: `feed-menu-browser-trail-next`, `feed-menu-browser-pip-next-video`, `Full Feed`

## Human smoke

1. Open Menu Browser → advance PiP video → menu unchanged until trail swipe / Browse this menu  
2. Swipe menus through discussed restaurants  
3. Full Feed restores reel  

## Docs

Architecture: `docs/architecture/2026-09-06_menu-browser-pip-menu-trail-and-pip-video.md`  
Tip-gate + LKG locked by `cpd-fe.sh`.
