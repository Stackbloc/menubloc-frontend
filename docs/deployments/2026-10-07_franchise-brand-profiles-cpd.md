# CPD — Franchise brand profiles (canonical menu first, one brand card per chain)

**Date:** 2026-10-07
**Approved by:** Andre Barber (session)

## What shipped

| Layer | Commit | Proof |
|-------|--------|-------|
| BE | `ae7c0ed4` | `cpd-be.sh` RESULT=PASS, smoke passed=32, `health_commit=ae7c0ed443506285f83badbfbd210f76264463c3` |
| FE | `e13a4f52` | `menubloc-frontend-1n1wro604-menuply.vercel.app` / `index-_Wj45xaw.js`; content probe `Nearest of` PASS; tip-gate apex + www RESULT=PASS |

- Franchise stores + brand records serve the chain canonical menu (`menus.is_franchise_canonical`) plus store overlays (`franchise_location_menu_overlays`); leftover per-store CK copies no longer win.
- Pure brand-name search: one brand card per chain (canonical parent) with `nearest_location` + `nearby_location_count` (distinct addresses); fails open to store cards.
- FE: brand card opens the brand menu with `?location=<nearest store>`; menu page loads that store under the brand URL; "See all locations" switches `?location=`.

## Production data (ops scripts, applied before code)

- `applyFranchiseBrandProfiles.js` — 70 brand records: corporate address + brand slug (old slug in `legacy_slug`, no lat/lng); 33 canonical menus flagged; Starbucks menu 15877: 20 prices from list A + 7 items added. 351 audit events. Snapshot `scripts/ops/output/franchiseBrandProfiles_snapshot_1791400923368.json` (local).
- `applyStarbucksStoreCleanup.js` — linked 3 unlinked Starbucks (3007, 3534, 3535) to chain 4; deactivated 19 (8 unlinked no-address + 11 duplicate-address incl. velo-coffee 1452). Nothing deleted. 28 audit events. Snapshot `scripts/ops/output/starbucksStoreCleanup_snapshot_1791402964718.json` (local).
- Both scripts: dry run → `--rehearse` (ROLLBACK) → `--apply`; identity fields via `restaurantMutationService.updateRestaurantIdentity`.

## Verification

- Branch backend against production data (pre-deploy): starbucks-7 / brand / starbucks-9 menus = 179 items, Cold Brew $4.75; `burger` LA (24) and Dothan (9, AL only) identical to production; `in n out` LA = 1 brand card.
- Pre-commit search protection regression 11/11; `test/franchiseBrandProfile.test.js` 9/9; related suites 49/49; `test:routes` route contract 8/8 (same as main).
- Live after BE CPD: `GET /search?q=starbucks` @USC → 1 result, Starbucks brand card (nearest 3201 Hoover St, 59 locations); `GET /public/restaurants/664/menu` → canonical menu 15877, 179 items, Cold Brew $4.75.
- E2E: read-only paths (no mutation UI) — verified via live API above.

## Notes

- `cpd-fe.sh` alias step hit the recurring http-01 cert error (same as 2026-10-05/06); apex already served the new bundle → finished with `--lock-only`.
- BE `main` had unrelated uncommitted WIP (hamburger synonym + Starbucks probes); stashed for the CPD and restored unchanged afterwards.

## Follow-ups

- Address backfill for 16,698 address-less Starbucks store records (reverse geocode from lat/lng) — approved as "keep + backfill"; not done.
- Brand page without `?location=` does not auto-select the nearest store; profile page (not menu page) has no location picker yet.
- The Blue Plate (chain 105) → MLE conversion.
- Pre-existing: `launchReadinessService` requires missing `./menuLocationAssignmentOwnership` (also on main).

## Follow-up CPD (same day): franchise page shows the franchise, not a store

| Layer | Commit | Proof |
|-------|--------|-------|
| BE | `682e8d6e` | `cpd-be.sh` RESULT=PASS, smoke 32, `health_commit=682e8d6e45c2ad8205366e4f351688b05b56f921` |
| FE | `e2413fd0` | `menubloc-frontend-jbe7k0pvl-menuply.vercel.app` / `index-BHGpdt-Y.js`; content probe `Menu for location` PASS; tip-gate apex + www RESULT=PASS (alias http-01 cert error → `--lock-only`) |

- Brand record is never swapped for a store by market; `?franchise_location=<store>` applies that store's overlays + centres the picker; header = corporate address.
- Search brand card: corporate address, no distance, "N locations nearby"; links preselect nearest store.
- Live: `/public/restaurants/78947/menu?franchise_location=1386` → Starbucks, 2401 Utah Ave S, Seattle WA; location 3201 Hoover St; 179 items; picker 25. `/search?q=starbucks` @USC → 1 brand card (Seattle address, 59 nearby, nearest 1386).

## Follow-up CPD (same day): location picker — addressed stores only, brand profile picker

| Layer | Commit | Proof |
|-------|--------|-------|
| BE | `fe41cc5a` | `cpd-be.sh` RESULT=PASS, smoke 32, `health_commit=fe41cc5a36b73572ade8b0823f1eaf36715d7acd` |
| FE | `84d9f0bd` | `menubloc-frontend-b106e2qy9-menuply.vercel.app` / `index-Cdcv03IU.js`; content probe `Locations near you` PASS; tip-gate apex + www RESULT=PASS (alias http-01 cert error → `--lock-only`) |

- Pickers (chain locations endpoint, menu sheet, brand-card preselect) list only active, non-brand stores with a street address — live queries, so stores appear as addresses are added (e.g. SimpleMaps Comprehensive backfill).
- Brand profile shows "Locations near you" (nearest first); tap → brand menu with `?location=`.
- Fixed: `/restaurants/washington/seattle/starbucks` resolved by slug alone to LA store 658 (now prefers route state/city + active rows).
- Fixed: picker dropped when selected store outside 25 nearest; 0,0 coords; null distance rendered as 0 / "< 0.1 mi" / 7,836 mi.
- Live: `/public/restaurants/starbucks?route_state=washington&route_city=seattle` → 78947 Seattle (chain 4, brand record); `/chains/4/locations` @USC → 20, all addressed, nearest 3201 Hoover St 0.2 mi.
- Pre-existing FE contract failures (also on main): MenuHeaderNameWithActions, PublicMenuItemCard row order, operatorPublicProfileContract followSource.
