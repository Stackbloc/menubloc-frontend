# CPD — Quiet Join Me status line (no green pills)

**Date:** 2026-09-12  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab mobile: `named-share-join-me-status` → “Join Me is Off — click to turn On” → event sheet |
| Server | **NOT REQUIRED** — FE presentation; PATCH already on `4df68ce2` |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `7830c702` |
| Tip | `menubloc-frontend-pe8kr8sfj-menuply.vercel.app` |
| Bundle | `index-BGO7e3Nn.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `named-share-join-me-status` — **PASS** |
| `cpd-fe.sh` | **RESULT=PASS** (deploy then `--lock-only`) |

## Backend

Unchanged this ship (`be_commit` noted by cpd-fe: `811d9eb8`).

## Product

Per-plan / per-event Join Me uses the same quiet StatusToggle text as Join Crew / Take Me Out:

**Join Me is Off — click to turn On** / **Join Me is On — click to turn Off**

Removed fat green Join Me pills from What’s cookin’ rows and event cards.
