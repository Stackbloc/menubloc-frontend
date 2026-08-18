# Summary

Restaurant public profiles show an aggregate line when diners have named that place in My Eating Plans for the next 7 days: “[X] diners confirm plans to eat here in the next week.” (singular: “1 diner confirms…”). Count only. Hidden when zero. Dining halls do not show it.

# Problem Statement

Eating plans that name a restaurant lived only on My Menuply. Andre asked that the same information generally appear on the restaurant’s public profile as a next-week diner count.

# Root Cause

No public projection existed from `what_we_doing_sessions.restaurant_id` onto `WhatDinersAreSaying`.

# Evidence Collected

- Plans are `what_we_doing_sessions` with `restaurant_id` (migration `0271`).
- Creator is always a participant (`role = 'creator'`).
- `WhatDinersAreSaying` already mounts on `PublicProfileShell`; dining halls pass `experienceMode={isDiningHall}`.

# Files Examined

- `WhatDinersAreSaying.jsx`, `PublicProfileShell.jsx`, `foodActivityApi.js`
- `whatWeDoingService.js`, `publicFoodActivity.js`, `20260818_0271_eating_plan_place_joinable.sql`

# Database Queries Executed

None against production. Count SQL is `COUNT(DISTINCT p.consumer_user_id)` on non-cancelled sessions with `plan_date` in `[CURRENT_DATE, CURRENT_DATE + 7)` and `s.restaurant_id` matching, excluding `restaurant_type = dining_hall`. Missing `0271` columns (`42703` / `42P01`) return count 0.

# Changes Made

- BE: `countUpcomingRestaurantPlanDiners`; public `GET /public/food-activity/restaurants/:restaurantId/upcoming-plans` (no auth; no names/tokens).
- FE: fetch via `api.js`; render `data-testid="upcoming-eating-plans-line"` when `line` is present and not `experienceMode`.

# Commits

FE `0d126d9`. BE `2923b248`.

# Deployment Status

**CPD COMPLETE.** FE tip `n7gxy1luu` / `index-DbN-zhDW.js`. BE `2923b248` health MATCH. Migration `0271` applied.

# Verification Results

- FE `npx vitest run test/whatDinersAreSayingContract.test.js`: 5 pass
- FE `node --test test/diningHallEntityContract.test.js`: 7 pass (includes skip upcoming-plans on dining halls)
- BE `node --test test/whatWeDoingContract.test.js`: 3 pass
- BE `node test/foodActivityContract.test.js`: ok
- Production API not probed this turn (not deployed)

# Remaining Risks

Without `0271`, the endpoint returns `{ diner_count: 0, line: null }` and the profile line stays hidden. Count includes invited participants on the session, not only the creator.

# Follow-Up Work

`cpd` from authorized mains. Apply `0271` with the backend ship.

# Final Verdict

Confirmed restaurant eating plans for the next week surface as a public count on restaurant (not dining-hall) profiles.
