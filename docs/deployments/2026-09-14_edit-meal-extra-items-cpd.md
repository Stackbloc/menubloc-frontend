# CPD — Edit extras stay on one meal + dish name persists

**Date:** 2026-09-14  
**Status:** **CPD COMPLETE** (tip identity + lab/live-tip UI hop)

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab + live tip `highlightsStageSaveNav.e2e.spec.js` extra-item test: Edit → Add item → PATCH `ensure_meal` + POST `meal_id`. Auth APIs mocked; browser loaded live tip JS. |
| Server | **PASS** — `cpd-be.sh` `RESULT=PASS`; `health_commit=8ca5e548ac81c5820b911ca483fecf591f853df3` matching HEAD; smoke 24/24. |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `ebcd8dc8` |
| Tip | `menubloc-frontend-qyybeixom-menuply.vercel.app` |
| Bundle | `index-B7cwUiVC.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `eating-place-dish-selected-name` in live JS |

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ `main` |
| Commit / health | `8ca5e548` / `8ca5e548ac81c5820b911ca483fecf591f853df3` |
| Smoke | **PASS** `passed=24` |

## Product / fix

1. Adding another menu item to an existing What I'm Eating meal keeps it on the **same post** (`ensure_meal` + extra `meal_id`).  
2. Hub line is `"Spicy Chicken Sandwich, Chili at Wendy's"` — one meal, restaurant once.  
3. Dish picker shows the **selected item name**, not a generic Dish label.

Existing split lunches already saved as two posts do **not** auto-merge.

## Not in this ship

Search-result video strip and Starbucks seed leftovers remain local (stashed). Do **not** restore `nnivtd9no` / `index-B6FYC7Qm.js` unless rolling back this ship.

## Human verify

Edit View → What I'm Eating → Edit a restaurant meal → pick a second dish → Save. One timeline row; dish box shows the chosen name.
