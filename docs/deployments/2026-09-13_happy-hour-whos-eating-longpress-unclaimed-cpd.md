# CPD — Happy Hour → Who’s Eating, long-press Edit, unclaimed copy

**Date:** 2026-09-13  
**Status:** **CPD COMPLETE** (tip identity + content probe)

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS (contracts)** — `happyHourWhosEatingAndLongPressEditContract`, `dinerActivityScanRowContract`, unclaimed profile/distributor contracts (29/29). Authenticated Edit-save mutation hop on live tip **not newly run** this turn (Edit opens existing compose/navigate surfaces). |
| Server | **NOT REQUIRED for tip ship** — no BE push. Events Edit opens existing social-event compose (prior API). Diary Edit selects meal clock / existing paths. |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `b1999255` |
| Tip | `menubloc-frontend-ndcsy374u-menuply.vercel.app` |
| Bundle | `index-BAHKA4en.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `This is an unclaimed profile` in live JS |

## Backend

Unchanged this ship (`be_commit` noted by cpd-fe: `225e15b7`).

## Product

1. **Happy Hour** strips from What I’m Eating meal timeline → **Who’s Eating** with Edit “You are going to Happy Hour…” / Profile “{Name} is going to Happy Hour…”.
2. **Long-press** shows **Edit + Delete** together (`HubLongPressActions`) on What I’m Eating, Happy Hour Who’s Eating, Events, Crews, @home.
3. **Unclaimed profiles** share `ProfileClaimBanner`: bold “This is an unclaimed profile” + directory disclaimer + claim CTA (restaurants + distributors).

## Regression spot-checks

- My Menuply Edit: Happy Hour not in meal journal; appears under Who’s Eating.
- Long-press any wired row → Edit and Delete both visible.
- Unclaimed restaurant / distributor public page → new three-part claim copy.
