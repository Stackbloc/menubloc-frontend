# Objective

One meal = Where + meal period + time + N items, shared by manual compose and Multiplier. Month in Food counts meal occasions. No Meal 1/2/3.

# Current Status

**CPD COMPLETE.** Schema 0328 applied. BE `a09498b2` health match + smoke 18/18. FE tip `9r6ukumw1` / `index-DMRlbt9y.js` apex+www PASS. Authenticated E2E PASS.

# Files Changed

## Backend (`menubloc-backend-main`)

- `sql/migrations/20260911_0328_diner_meals_multi_item.sql` (+ rollback)
- `src/services/whatIAteToday/dinerMealGrouping.js` (new)
- `src/services/whatIAteToday/whatIAteTodayService.js` — `createMealWithItems`, auto-wrap, list `meals`
- `src/routes/consumer/whatIAteToday.js` — `POST /what-i-ate-today/meals`
- `src/services/monthInFood/monthInFoodService.js` — grouped meals + counts
- `src/deploymentOps/backendProductionSmokeProbes.js` — `consumer_ate_meals_create`
- `test/dinerMealsMultiItemContract.test.js`
- `test/monthInFoodContract.test.js`
- `test/backendProductionSmokeContract.test.js`

## Frontend (`menubloc-frontend-main`)

- `src/lib/consumerApi.js` — `createWhatIAteMeal`
- `src/lib/groupHubAteMeals.js`
- `src/lib/eatingFeedMerge.js` — pass `meal_id`
- `src/lib/feedVideoCompose.js` — meal create; video on primary item
- `src/pages/consumer/myMenuply/EatingCompose.jsx` — extra items; feed Where
- `src/pages/consumer/MyMenuplyPage.jsx` — `postEating` uses meal API
- `src/pages/consumer/myMenuply/EatingHubSection.jsx` — group by meal
- `src/pages/consumer/myMenuply/DinerActivityScanRow.jsx` — remove Meal n
- `src/pages/consumer/monthInFood/buildMonthInFoodModel.js`
- Contract tests as listed in audit

# Database Changes

`public.diner_meals` + nullable `what_i_ate_today.meal_id`. **Applied on production** and recorded in `schema_migrations` at 2026-09-11T13:28:55Z.

# Decisions Made

- Video remains on first `what_i_ate_today` row (Video Manager `video_kind=ate`).
- Legacy `meal_id IS NULL` = singleton meal.
- Single-item POST still auto-wraps a parent meal when the table exists.
- Guest Feed ate path unchanged (single guest video).
- Compact hub line compose still logs one item (auto-wraps a 1-item meal). Multi-item is on the full EatingCompose sheet (+ Add another item) and Multiplier.

# Remaining Work

1. Human: log a 2-item restaurant meal + Multiplier video on primary in production UI.
2. Calendar `entry_count` still item-based (not this ship).
3. Hub delete still targets primary item only.

# Risks / Known Issues

- Live BE does not expose `POST /meals` until code ships.
- Hub delete targets primary item only.
- Calendar day counts still item-based.

# Verification Status

**CPD COMPLETE.** Contract tests pass. Authenticated create/list/MiF/delete E2E PASS. BE smoke 18/18. Tip-gate apex+www PASS.

# Resume Instructions

Human UI: 2-item restaurant meal + Multiplier video on first item. Video Manager still keys off primary ate id.

# Git Status

FE `d7929078` + docs lock. BE `a09498b2` + LKG mirror. Do not deploy from `menubloc-frontend/` or `menubloc-backend/`.
