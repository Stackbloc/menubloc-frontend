# CPD — Search-result video projection

**Date:** 2026-09-15  
**Status:** **CPD COMPLETE** (held 2026-09-13 work shipped)

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — `railway run … node scripts/e2eSearchVideoProjection.js` `RESULT=PASS` (managed clip 23 / restaurant 617 / CK 14363, `attached_rows=2`). Live `GET /search?q=Wendy's&city=Los%20Angeles&state=CA` returns `videos[]` on restaurant-only card 617 (`managed:23`). |
| Server | **PASS** — `cpd-be.sh` `RESULT=PASS`; `health_commit=64152d39e4a245412eea14676fe9c2ddf04dc91d` matching HEAD; smoke 24/24. |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `0696a09d` (strip `1ab20793` + Similar/Compare approval) |
| Tip | `menubloc-frontend-nmo65rblc-menuply.vercel.app` |
| Bundle | `index-C4OsNX37.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `search-result-video-strip` in live JS |

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ `main` |
| Commit / health | `64152d39` / `64152d39e4a245412eea14676fe9c2ddf04dc91d` |
| Smoke | **PASS** `passed=24` |
| Franchise seeds | `no_targets` |

## Product / fix

Existing tagged videos attach to ranked `/search` presentation rows after `finalizeSearchResponse`. Dish cards match CK `menu_item_id` only. Restaurant-only cards match `restaurant_id`. Grouped restaurant+matches do not inherit restaurant-wide clips. Never kinds: `event`, `plan`. Fail-open if projection SQL errors.

Live dish search for “Spicy Chicken Sandwich” uses franchise `cmi:` ids (e.g. Wendy's `cmi:63` on restaurant 616), so those dish cards correctly have no CK-tagged strip. Brand `Wendy's` restaurant-only card **617** shows the managed sandwich clip.

## Not in this ship

- §5 per-viewer social-activity layer (reserved)
- MKS / `cmi:` fan-out so franchise dish cards inherit CK tags
- Starbucks screenshot seed leftovers (stashed)
- Video upload / CSP / Video Manager upload wiring
- Waiter / HomeNext

Do **not** restore `qyybeixom` / `index-B7cwUiVC.js` unless rolling back this ship.

## Human verify

Search `Wendy's` in Los Angeles. Restaurant-only cards that have tagged videos show a strip. Combined dish queries must not put all restaurant clips on the grouped header.
