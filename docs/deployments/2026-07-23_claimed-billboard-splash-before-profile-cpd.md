# CPD — Claimed Billboard Splash Before Profile

**Date:** 2026-07-23  
**Feature:** Active deal billboard graphic plays as a full-screen splash before claimed restaurant public profiles; Pho N Mo LA chalkboard asset for operator upload.

## Commits

| Repo | Branch | Commit | Notes |
|------|--------|--------|-------|
| menubloc-frontend | `feature/mds-homepage-controls` | `c9fd879` | Splash component + public page gate + contract + asset |
| menubloc-backend | — | — | No BE change (reuses `billboard_preview`) |

## Deploy steps

1. **Backend** — skipped (no change)
2. **Frontend** — `npx vercel --prod --yes` from clean worktree `/tmp/menubloc-fe-billboard-splash-cpd` @ `c9fd879`  
   Deployment: `https://menubloc-frontend-b5f23tfx7-menuply.vercel.app` (`dpl_DLRZkA5e1pVLqsBnyMQFytiSH3yL`)
3. **Alias** — `npx vercel alias set menubloc-frontend-b5f23tfx7-menuply.vercel.app menuply.com`  
   (grubbid.com also pointed at this deployment)

## Verification

| Check | Result |
|-------|--------|
| Contract tests | `claimedRestaurantBillboardSplashContract` + `unclaimedRestaurantBrandSplashContract` ok |
| menuply.com bundle | `index-ClXyDvjG.js` (matches Vite build) |
| Bundle contains splash copy | `Tap to continue` present |
| Bundle API | `menubloc-backend-production` 60 / `localhost:3001` 6 |
| Stripe / production payment env | **unchanged** |

## Human verify (required)

- Visit a claimed restaurant with an active billboard (Splash On) as a diner (not owner session): splash → profile
- Claimed restaurant with no billboard: profile only
- Unclaimed: existing brand splash still works
- Upload `assets/billboards/pho-n-mo-la-billboard.png` via `/operator/billboards` for Pho N Mo LA when ready

## Stripe mode statement

Stripe production configuration was **not** modified. Production remains live.
