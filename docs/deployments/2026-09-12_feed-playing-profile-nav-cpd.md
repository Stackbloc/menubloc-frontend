# CPD — Mobile Feed playing → Profile primary nav

**Date:** 2026-09-12  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab + **live tip** mobile `feedHomeToProfileNav.e2e.spec.js` **5/5** (reel visible → Profile → Home/Deals/Waiter/Search; Multiplier dismiss; guest→auth return) |
| Server | **NOT REQUIRED** — FE shell/nav only |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `30528a8b` |
| Tip | `menubloc-frontend-2su74l7ww-menuply.vercel.app` |
| Bundle | `index-BONRqGSP.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `feed-primary-nav-mobile` **PASS** |
| Live tip hop | **PASS** — `PLAYWRIGHT_BASE_URL=https://menuply.com` mobile 5/5 |

## Backend

Unchanged this ship (lock noted `4d3f33f7`).

## Product / fix

Signed-in mobile: Feed starts playing → Profile → primary tabs (Home/Deals/Waiter/Search) stay clickable, not only Share My QR.

- Mobile `FeedPrimaryNav` portaled to `document.body` (z-index 1300)
- Feed-home overlay no longer inherits modal `fixed`/`inset:0`/`100dvh`/z-index 200000
- Leaving Feed tears down `<video>` + `clearStuckMediaChrome` in `useLayoutEffect`
- Related: Deals in-shell no body `touchAction` lock; Share/Invite listen for CLEAR_STUCK; auth/bfcache clearStuck

## Systemic

Audit: `docs/audits/2026-09-12_feed-primary-nav-dead-after-reel-systemic.md` — Deals reel / modal See Who’s Eating siblings remain follow-up.
