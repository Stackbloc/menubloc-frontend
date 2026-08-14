# Windows In-N-Out-only + compact frame — CPD

**Date:** 2026-08-14  
**Checkout:** `menubloc-frontend-main` @ `main`

## Product

- Public **Windows** section is temporary for **In-N-Out only** (legacy active creatives).
- All other restaurants: no Windows section (brand splash, hero, and deal billboards do not fill it).
- Compact thumb frame (88px mobile / 104px desktop); no caption under photos.
- Dedicated `content_type=window` splash exclusion retained for a future owner path.

## Deploy path

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| Branch | `main` |
| Commit | _(filled after push)_ |
| Deployment | _(filled after vercel)_ |
| Bundle | _(filled after alias)_ |
| Tip-gate | _(filled after assert)_ |
| Exception | none |

## Files

- `src/lib/profileWindows.js`
- `src/components/restaurant/publicProfile/ProfileBillboardBlock.jsx`
- `src/components/restaurant/publicProfile/PublicProfileShell.jsx`
- `src/lib/claimedRestaurantBillboardSplash.js`
- `src/pages/operator/OperatorBillboardsPage.jsx`
- `src/pages/operator/OperatorProfileEditor.jsx`
- `test/profileWindowsContract.test.js` (+ related contract updates)
