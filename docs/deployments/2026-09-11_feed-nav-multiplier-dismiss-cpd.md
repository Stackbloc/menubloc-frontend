# CPD — Feed Profile bottom nav + Multiplier same-route dismiss

**Date:** 2026-09-11  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab + **live tip** `feedHomeToProfileNav.e2e.spec.js` (2 tests: Feed→Profile nav; Multiplier closes on same-route Profile tap) |
| Server | **NOT REQUIRED** — FE shell/nav only |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `8ba8ae2e` |
| Tip | `menubloc-frontend-kje99iug1-menuply.vercel.app` |
| Bundle | `index-m8TAwyJp.js` |
| Tip-gate apex/www | **PASS** |
| Content proof | live JS has `document.body.style.touchAction=""` in restoreDocumentScroll (minify stripped `closeShellOverlays` name — first door INCOMPLETE then `--lock-only`) |
| Live tip hop | **PASS** — `PLAYWRIGHT_BASE_URL=https://menuply.com` |

## Backend

Unchanged this ship (`be_commit` noted by lock: `8dc1a91d` docs tip sync may push separately).

## Product / fix

1. Feed home does **not** lock `body.touchAction` (modal reel still does).  
2. `restoreDocumentScroll` / `clearStuckMediaChrome` clears `touchAction`.  
3. All primary tabs use **button + `navigate()`** (same path as Share My QR).  
4. Feed reel bottom inset includes iPhone **safe-area**.  
5. **Multiplier:** `CLEAR_STUCK` closes create/compose even when pathname unchanged (Profile while Multiplier open).

## Note

First `cpd-fe.sh` aliased production then failed content probe on minified symbol `closeShellOverlays`. Tip was correct (`kje99iug1` / `m8TAwyJp`); finished with `--lock-only` after verifying touchAction restore in live JS.
