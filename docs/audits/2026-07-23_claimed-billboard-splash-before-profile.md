# Claimed restaurant billboard splash before profile

**Date:** 2026-07-23  
**Branch:** local (uncommitted)  
**Agent/session:** Cursor Auto

## Summary

Claimed public restaurant profiles now show an active billboard graphic as a full-screen timed splash before the editorial profile, matching product copy that billboards are “profile splash graphics.”

## Problem Statement

Operators can turn profile splash On via Billboards/Deals, but claimed `/restaurants/:slug` skipped straight to the editorial profile. Billboard creatives only appeared as banner fallback or an in-page strip. Unclaimed listings already had a timed brand splash.

## Root Cause

Splash entrance existed only for unclaimed restaurants (`UnclaimedRestaurantBrandSplash`). Claimed path never consumed `billboard_preview` for an entrance beat.

## Evidence Collected

- Help/operator copy: billboards = profile splash On/Off
- `RestaurantPublicPage` unclaimed path: timed splash → stub
- Claimed path: `RestaurantPublicEditorial` + `billboard_preview` strip only

## Files Examined

- `menubloc-frontend/src/pages/RestaurantPublicPage.jsx`
- `menubloc-frontend/src/components/restaurant/UnclaimedRestaurantBrandSplash.jsx`
- `menubloc-frontend/src/pages/operator/OperatorBillboardsPage.jsx`
- `menubloc-backend/src/routes/publicRestaurant.js` (`billboard_preview`)
- `menubloc-backend/src/services/restaurantBillboardService.js`

## Database Queries Executed

None.

## Changes Made

- Added `ClaimedRestaurantBillboardSplash` + `claimedRestaurantBillboardSplash.js` helpers
- Wired splash on claimed/full_claimable public profile when current `billboard_preview` has image or headline
- Skipped splash for owners (chrome-first) and ordinary unclaimed path
- Contract test for pick/timing/wiring
- Pho N Mo LA chalkboard asset for operator upload: `menubloc-frontend/assets/billboards/pho-n-mo-la-billboard.png`

## Commits

Not committed (awaiting user request).

## Deployment Status

Deployed FE `c9fd879` → `menubloc-frontend-b5f23tfx7-menuply.vercel.app` aliased to menuply.com (`index-ClXyDvjG.js`).

## Verification Results

```
node test/claimedRestaurantBillboardSplashContract.test.js  → ok
node test/unclaimedRestaurantBrandSplashContract.test.js    → ok
menuply.com bundle index-ClXyDvjG.js; Tap to continue present
API: menubloc-backend-production 60 / localhost:3001 6
```

## Remaining Risks

- Splash only appears after profile GET returns `billboard_preview` (loading skeleton still shows first)
- Pho N Mo creative is not auto-attached in DB — operator must upload via Billboards + Splash On

## Follow-Up Work

1. Human smoke on menuply.com
2. Upload Pho N Mo asset on operator Billboards for the LA restaurant and verify splash → profile live

## Final Verdict

CPD complete for claimed billboard entrance splash. Production attach for Pho N Mo remains an operator upload step.
