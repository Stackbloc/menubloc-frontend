# Objective

Show active billboard creatives as a full-screen splash before claimed restaurant public profiles, and prepare Pho N Mo LA chalkboard creative for upload.

# Current Status

**LOCAL COMPLETE** — code + contract tests + asset. Awaiting commit, deploy, and operator upload for Pho N Mo.

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

1. Commit FE (user request)
2. Deploy Vercel prod + `vercel alias set … menuply.com`
3. Operator: upload `assets/billboards/pho-n-mo-la-billboard.png` for Pho N Mo LA, Splash On
4. Human smoke: claimed with splash → profile; no splash → profile only; unclaimed splash still works

# Risks / Known Issues

- Without an active deal billboard row, splash will not show even if asset exists on disk
- Large PNG (~2.8 MB) may need compression before upload (5 MB billboard limit)

# Verification Status

- `node test/claimedRestaurantBillboardSplashContract.test.js` — ok
- `node test/unclaimedRestaurantBrandSplashContract.test.js` — ok
- Live UI / production — not run

# Resume Instructions

1. Commit FE splash files + asset if desired
2. Deploy FE; alias menuply.com
3. Upload Pho N Mo graphic via `/operator/billboards`
4. Visit public restaurant URL as diner (not owner session) and confirm splash then profile

# Git Status

Uncommitted local FE changes for splash + asset (do not commit unless user asks).
