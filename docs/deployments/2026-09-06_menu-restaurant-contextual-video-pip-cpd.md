# CPD — Restaurant menu contextual video PiP

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `d7ed20b6` — `feat(menu): restaurant-scoped contextual video PiP on independent menus` |
| **Live tip** | `menubloc-frontend-oo2q7cbhl-menuply.vercel.app` / `index-BHUgSY6l.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (lock noted `380b2028`) |

## What shipped

- `MenuRestaurantContextualVideo` — fixed PiP from `GET /public/restaurants/:id/videos` (same as profile; removals honored)
- Mounted on `CatalogMenuRenderer` (default on) and `PublicMenuPage` (search / Yellow Browse / public menu)
- Feed Menu Browser overlay sets `enableRestaurantContextualVideo={false}` so Feed remains the video source
- Prefer `highlightItem` / `preferredMenuItemId` match when present

## Verification

- `cpd-fe.sh` → **RESULT=PASS**
- Contracts: `menuRestaurantContextualVideoContract` + `test:menu-experience-contract` PASS pre-ship

## Human smoke

1. Search → open a restaurant menu with profile videos → small PiP bottom-right  
2. Arrows cycle that restaurant’s videos only; mute works; tap opens watch path  
3. Feed → Menu Browser / yellow icon → Feed PiP only (no second restaurant player)

## Docs

Architecture: `docs/architecture/menu-browser-feed-video-quick-invite-2026-09-06.md`  
Tip-gate + LKG locked by `cpd-fe.sh`.
