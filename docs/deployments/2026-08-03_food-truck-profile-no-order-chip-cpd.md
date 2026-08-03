# Food truck profile: remove unauthorized Order chip (CPD)

**Date:** 2026-08-03  
**Checkout:** `menubloc-frontend-main` @ `main`

## Purpose

Remove the floating **Order** primary-action chip from food-truck public profiles (`/foodtrucks/...`). That chip is not part of the authorized food-truck design (hero View Menu + Menu Preview / Full Menu).

## Files changed

- `src/components/restaurant/publicProfile/ProfilePrimaryActions.jsx` — skip Order when `profileType === "food_truck"`
- `src/components/restaurant/publicProfile/PublicProfileShell.jsx` — pass `profileType`
- `test/foodTruckDemoDisplayOnlyContract.test.js`
- `test/operatorPublicProfileContract.test.js`

## Deployment

Pending this CPD turn.
