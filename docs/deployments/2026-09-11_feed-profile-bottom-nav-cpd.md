# CPD — Feed→Profile bottom nav (reel portal leftover)

**Date:** 2026-09-11  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab + **live tip** `feedHomeToProfileNav.e2e.spec.js` (Feed → Profile → Home/Deals/Search/Waiter; feedHome reel count 0) |
| Server | **NOT REQUIRED** — FE overlay/nav only (no mutation API) |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `10622dfa` |
| Tip | `menubloc-frontend-fyn0g7m4b-menuply.vercel.app` |
| Bundle | `index-DLpbgaqP.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `zIndex:400` in live JS |
| Live tip hop | **PASS** — `PLAYWRIGHT_BASE_URL=https://menuply.com` |

## Backend

Unchanged this ship (`be_commit` noted by cpd-fe: `2d03a27d`).

## Product / fix

1. Feed home `SeeWhosEatingFullscreen` renders **inside** the shell (no `document.body` portal).  
2. Route change clears stuck media chrome + closes create/compose/More/QR sheets.  
3. `FeedPrimaryNav` z-index **400** (above stuck compose ~350–360).

## Regression

Start on Feed → My Menuply → Home / Waiter / Deals / Search / X all clickable (Share My QR still works).
