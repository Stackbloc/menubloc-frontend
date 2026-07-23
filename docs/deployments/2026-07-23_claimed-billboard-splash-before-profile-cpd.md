# CPD — Claimed Billboard Splash Before Profile

**Date:** 2026-07-23  
**Feature:** Active deal billboard graphic plays as a full-screen splash before claimed restaurant public profiles; Pho N Mo LA chalkboard asset for operator upload.

## Commits

| Repo | Branch | Commit | Notes |
|------|--------|--------|-------|
| menubloc-frontend | `feature/mds-homepage-controls` | _(fill after commit)_ | Splash component + public page gate + contract + asset |
| menubloc-backend | — | — | No BE change (reuses `billboard_preview`) |

## Deploy steps

1. **Backend** — skipped (no change)
2. **Frontend** — `npx vercel --prod --yes` from clean worktree at splash commit
3. **Alias** — `npx vercel alias set <deployment-url> menuply.com`

## Verification

| Check | Result |
|-------|--------|
| Contract tests | `claimedRestaurantBillboardSplashContract` + `unclaimedRestaurantBrandSplashContract` ok |
| menuply.com bundle | _(fill after deploy)_ |
| Bundle API | _(fill after deploy)_ |
| Stripe / production payment env | **unchanged** |

## Human verify (required)

- Visit a claimed restaurant with an active billboard (Splash On) as a diner (not owner session): splash → profile
- Claimed restaurant with no billboard: profile only
- Unclaimed: existing brand splash still works
- Upload `assets/billboards/pho-n-mo-la-billboard.png` via `/operator/billboards` for Pho N Mo LA when ready

## Stripe mode statement

Stripe production configuration was **not** modified. Production remains live.
