# Summary

Updated consumer-facing Food Truck pricing display to plan name **Food Truck**, price **$89/year**, commission wording **Lowest marketplace commission**, and the approved feature list. Checkout plan key remains `food_truck_annual`. Not committed/pushed/deployed.

# Problem Statement

Food Truck signup/marketing copy listed obsolete features (analytics, QR menu, billboard tools) and inconsistent plan naming (“Menuply Food Truck Plan”), while directory CTA briefly summarized older benefits.

# Root Cause

Display copy lived in component-local feature arrays and marketing blurbs, separate from the already-correct `$89/year` / `food_truck_annual` checkout helpers.

# Evidence Collected

- Worktree: `menubloc-frontend` / Vercel `menubloc-frontend`
- Routes: `/foodtruck/signup`, `/foodtrucks`, operator Food Truck card on `/operator/subscription`
- Price label: `CHECKOUT_PRICE_LABELS.food_truck_annual` → `$89/year`
- CTA: `rememberIntendedCheckoutPlanCode(FOOD_TRUCK_ANNUAL_PLAN_CODE)` on signup; operator card calls `handleStripeCheckout(FOOD_TRUCK_ANNUAL_PLAN_CODE)`

# Files Examined

- `src/pages/FoodTruckSignup.jsx`
- `src/pages/FoodTrucksPage.jsx`
- `src/pages/operator/OperatorSubscription.jsx`
- `src/lib/menuplyCheckoutPlans.js`
- `src/lib/__tests__/menuplyCheckoutPlans.test.js`
- `src/components/payments/paymentHelpers.js`
- `src/pages/operator/OperatorMyAccount.jsx`
- `src/pages/SubscriptionSelect.jsx` (restaurant “QR menu” row — out of scope)

# Database Queries Executed

None.

# Changes Made

- `FoodTruckSignup.jsx`: plan name Food Truck; approved `PLAN_FEATURES`; description/footnote copy
- `FoodTrucksPage.jsx`: directory CTA blurb aligned to $89/year + approved benefits language
- `OperatorSubscription.jsx`: Food Truck card benefit bullets + CTA label `Choose Food Truck` (checkout key unchanged)

# Commits

None (awaiting approval).

# Deployment Status

Not deployed. Local preview screenshots under `verification-output/food-truck-pricing/`.

# Verification Results

- vitest `menuplyCheckoutPlans.test.js`: 16/16 PASS
- eslint `FoodTruckSignup.jsx`: PASS
- `npm run build`: PASS
- Playwright signup desktop/mobile assertions: PASS

# Stale References Found

| Reference | Location | Disposition |
|-----------|----------|-------------|
| Former `$39/year` Food Truck price | HEAD `FoodTruckSignup.jsx` | Updated (already uncommitted to `$89` via labels; features rewritten) |
| “Menuply Food Truck Plan” / analytics / QR menu feature list | `FoodTruckSignup.jsx` | Updated |
| Directory “QR tools” blurb | `FoodTrucksPage.jsx` | Updated |
| Operator short benefits list | `OperatorSubscription.jsx` | Updated |
| `checkout_label: "Food Truck Annual"` | `menuplyCheckoutPlans.js` | Retained — internal checkout display label, not chart |
| `Food Truck Annual` status labels | `paymentHelpers.js`, `OperatorMyAccount.jsx` | Retained — account/status strings |
| “QR menu access for customers” | `SubscriptionSelect.jsx` Published restaurant features | Outside scope — restaurant plan, not Food Truck |
| Help-center QR kit copy | `RestaurantHelpCenter.jsx` | Outside scope — separate paid QR kit product |
| No `$69/year` found in active frontend src | — | N/A |

# Remaining Risks

- `OperatorSubscription.jsx` has large pre-existing dirty diff; Food Truck benefit change is a small slice — commit carefully.
- Signup CTA creates account then remembers `food_truck_annual` for later operator checkout; it does not open Stripe immediately (existing design).

# Follow-Up Work

Commit/deploy after approval. Optional: align account status label “Food Truck Annual” → “Food Truck” if product wants naming consistency beyond pricing cards.

# Final Verdict

Consumer-facing Food Truck offer copy updated locally; checkout key integrity preserved.
