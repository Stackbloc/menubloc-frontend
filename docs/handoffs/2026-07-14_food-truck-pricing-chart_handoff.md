# Objective

Update consumer-facing Food Truck pricing card/chart to Food Truck / $89/year / Lowest marketplace commission / approved features without changing checkout or backend.

# Current Status

**LOCAL COMPLETE** — awaiting approval to commit / push / deploy.

# Files Changed

- `menubloc-frontend/src/pages/FoodTruckSignup.jsx`
- `menubloc-frontend/src/pages/FoodTrucksPage.jsx`
- `menubloc-frontend/src/pages/operator/OperatorSubscription.jsx` (Food Truck card benefits + CTA text only within a larger dirty file)

Docs:

- `docs/audits/2026-07-14_food-truck-pricing-chart.md`
- `docs/handoffs/2026-07-14_food-truck-pricing-chart_handoff.md`

Artifacts:

- `menubloc-frontend/verification-output/food-truck-pricing/signup-desktop.png`
- `menubloc-frontend/verification-output/food-truck-pricing/signup-mobile.png`
- `menubloc-frontend/verification-output/food-truck-pricing/directory-desktop.png`

# Database Changes

None.

# Decisions Made

- Price continues to render via `CHECKOUT_PRICE_LABELS[food_truck_annual]` (`$89/year`)
- Features remain component-local display arrays
- Plan key stays `food_truck_annual`; no Stripe price IDs in frontend checkout bodies
- Did not add searchable listing/menu-item rows (they were not already on the signup card)
- Did not touch PlanComparisonTable (restaurant chart)

# Remaining Work

1. Approval
2. Commit only the intended Food Truck files (avoid unrelated OperatorSubscription diffs if committing that file)
3. Deploy + menuply.com alias

# Risks / Known Issues

- OperatorSubscription.jsx workspace already had extensive uncommitted changes unrelated to this task
- Signup does not call Stripe on submit; it remembers `food_truck_annual` for later operator checkout

# Verification Status

| Check | Result |
|-------|--------|
| Name Food Truck / $89/year | PASS |
| No monthly / no $69 | PASS |
| Lowest marketplace commission (no %) | PASS |
| Window QR Code included | PASS |
| CTA key `food_truck_annual` | PASS |
| vitest checkout plans | PASS |
| build | PASS |

# Resume Instructions

1. Review screenshots in `verification-output/food-truck-pricing/`
2. Stage: `FoodTruckSignup.jsx`, `FoodTrucksPage.jsx`; for OperatorSubscription, prefer a careful patch/commit that includes only the Food Truck benefit/CTA hunk if possible
3. Recommended commit message below

```
fix(pricing): update consumer Food Truck plan offer copy

Show Food Truck at $89/year with approved features and lowest
marketplace commission; keep food_truck_annual checkout key.
```

# Git Status

- Branch: `stabilize/frontend-safe-baseline`
- Stopped before commit/push/deploy
