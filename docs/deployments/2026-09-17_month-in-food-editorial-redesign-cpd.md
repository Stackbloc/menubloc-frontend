# CPD — Month in Food editorial redesign

**Date:** 2026-09-17  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — `monthInFoodContract.test.js` 18/18; live tip content probe `Restaurant spend`; route `https://menuply.com/my-menuply/month-in-food` serves tip bundle; redesign strings in live JS |
| Server | **NOT REQUIRED** — FE presentation redesign only |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `bd693d90` |
| Tip | `menubloc-frontend-91o6htxck-menuply.vercel.app` |
| Bundle | `index-J45buQ-y.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `Restaurant spend` **PASS** |

## Backend

Unchanged this ship (`be_commit` noted by cpd-fe: `75c05a37`).

## Product

Editorial single-column Month in Food per `docs/architecture/2026-09-17_month-in-food-redesign-spec.md`:

1. No orphan full-bleed hero — optional 2-photo Moments collage (text-only if &lt;2).  
2. Exactly **6** stats (3×2); Restaurant spend on Food Mood.  
3. Sidebar/donut removed; Cravings + Plans two-up.  
4. Visited monograms (no empty gray photo tiles).  
5. Moments 2-col grid with captions; Fraunces + Public Sans cream/forest tokens.

## Verify

Hard-refresh https://menuply.com/my-menuply/month-in-food — single column, 6-stat grid, spend on mood card, no giant unrelated hero.
