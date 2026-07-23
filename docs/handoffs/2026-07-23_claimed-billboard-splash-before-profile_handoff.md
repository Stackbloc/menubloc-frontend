# Objective

Show active billboard creatives as a full-screen splash before claimed restaurant public profiles, and prepare Pho N Mo LA chalkboard creative for upload.

# Current Status

**CPD COMPLETE** — FE `c9fd879` on `feature/mds-homepage-controls`; menuply.com `index-ClXyDvjG.js`. Awaiting human smoke + Pho N Mo operator upload.

# Files Changed

**Frontend (`menubloc-frontend`)**

- `src/lib/claimedRestaurantBillboardSplash.js` — **new** timing + `pickClaimedBillboardSplashPost`
- `src/components/restaurant/ClaimedRestaurantBillboardSplash.jsx` — **new** full-screen splash UI
- `src/pages/RestaurantPublicPage.jsx` — splash gate before editorial; explicit `billboard_preview` merge
- `test/claimedRestaurantBillboardSplashContract.test.js` — **new**
- `assets/billboards/pho-n-mo-la-billboard.png` — **new** operator-upload creative

# Database Changes

None.

# Decisions Made

- Reuse existing `billboard_preview` from profile GET (no new API)
- Prefer `status === "current"` posts with `image_url`/`photo_url` or headline/title
- ~2000ms handoff (400ms reduced motion); tap dismisses early
- Owners skip splash so PublicProfileOwnerChrome is immediate
- Unclaimed brand splash path unchanged

# Remaining Work

1. Human smoke: claimed with splash → profile; no splash → profile only; unclaimed splash still works
2. Operator: upload `assets/billboards/pho-n-mo-la-billboard.png` for Pho N Mo LA, Splash On

# Risks / Known Issues

- Without an active deal billboard row, splash will not show even if asset exists on disk
- Large PNG (~2.8 MB) may need compression before upload (5 MB billboard limit)

# Verification Status

- `node test/claimedRestaurantBillboardSplashContract.test.js` — ok
- `node test/unclaimedRestaurantBrandSplashContract.test.js` — ok
- Production: menuply.com serves `index-ClXyDvjG.js` with splash copy; API Railway counts OK
- Human UI smoke — pending

# Resume Instructions

1. Human smoke checklist above
2. Upload Pho N Mo graphic via `/operator/billboards`
3. Visit public restaurant URL as diner (not owner session) and confirm splash then profile

# Git Status

- Commit: `c9fd879` on `feature/mds-homepage-controls` (pushed)
- Deploy: `menubloc-frontend-b5f23tfx7-menuply.vercel.app` aliased to menuply.com
