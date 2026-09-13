# CPD — JoinMeButton (Connect) + Edit Join Me status per occasion

**Date:** 2026-09-12  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab + live tip `feedHomeToProfileNav.e2e.spec.js` (`per-occasion Join Me`); Edit status line opens event compose |
| Server | **NOT REQUIRED** — FE presentation + existing PATCH/share paths (no new BE routes) |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `54716198` |
| Tip lock commit | (docs-only after tip-gate) |
| Tip | `menubloc-frontend-jowyqbm28-menuply.vercel.app` |
| Bundle | `index-ZnBH7jv2.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `#173404` in live JS |
| Live tip hop | **PASS** — `PLAYWRIGHT_BASE_URL=https://menuply.com` Join Me Edit status |

## Backend

Unchanged this ship (`be_commit` noted by cpd-fe: `237643ca`).

## Product

1. **Connect View / peer:** compact `JoinMeButton` (`#173404`, “Join Me” only) on plan/event cards; Ended + ~55% opacity when ended/closed.  
2. **Edit View:** quiet `JoinMeStatusLine` (“Join Me is On/Off — click to turn…”) so owners set Join Me per occasion.  
3. Craving Connect CTA trigger uses the same `JoinMeButton` (sheet still offers Join Me / Take Me Out modes).

## Regression

Edit View: event with Join Me Off → status line → opens compose. Connect View: joinable cards show Join Me pill (not status line).
