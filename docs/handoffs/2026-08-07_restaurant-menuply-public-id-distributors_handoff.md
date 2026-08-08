# Objective

Ship permanent opaque Menuply restaurant display IDs + optional top-3 foodservice distributor usage onboarding, reusing existing contact/type/location fields.

# Current Status

Implementation complete in `menubloc-backend-main` + `menubloc-frontend-main`.  
**Production SQL applied** (0219 + 0220 alphabet fix). Code commit/deploy next.

# Files Changed

## Backend

- `sql/migrations/20260807_0219_restaurant_menuply_public_id_and_distributors.sql`
- `sql/migrations/20260807_0219_restaurant_menuply_public_id_and_distributors_rollback.sql`
- `src/services/restaurants/foodserviceDistributorService.js`
- `src/services/restaurants/ownedRestaurantInformationService.js`
- `src/routes/operator/foodserviceDistributors.js`
- `src/routes/operator/onboardingDistributors.js`
- `src/routes/operator/index.js`
- `src/routes/operator/profile.js`
- `src/routes/ownerMenuConsole.js`
- `test/foodserviceDistributorService.test.js`

## Frontend

- `src/components/restaurant/MenuplyRestaurantIdBadge.jsx`
- `src/components/restaurant/DistributorUsagePicker.jsx`
- `src/components/restaurant/RestaurantInformationForm.jsx`
- `src/lib/restaurantInformationSchema.js`
- `src/lib/operatorApi.js`
- `src/pages/RestaurantOnboardingInformation.jsx`
- `src/pages/FoodTruckOnboardingDetails.jsx`
- `src/pages/operator/OperatorProfileEditor.jsx`
- `src/pages/operator/OperatorMyAccount.jsx`
- `src/pages/owner/OwnerRestaurantContextBar.jsx`
- `src/pages/owner/OwnerProfileManager.jsx`
- `test/restaurantOnboardingInformationContract.test.js`

## Docs

- `docs/audits/2026-08-07_restaurant-menuply-public-id-distributors.md`
- this handoff

# Database Changes

- `restaurants.menuply_public_id` TEXT UNIQUE NOT NULL (backfilled)
- `restaurants.primary_contact_role` TEXT NULL
- `foodservice_distributors` catalog (Sysco…Costco + Other)
- `restaurant_distributor_relationships` with `usage_reported` + `contact_permission_granted` (always false from API)

# Decisions Made

- Canonical identity remains `restaurants.id` BIGINT — no restaurant UUID
- Display codes opaque/non-sequential (`MPL-R-` + 8 Crockford-like chars)
- Distributor outreach consent deferred (flagged); usage only
- Warehouse clubs (Sam’s Club, Costco) included in seed catalog

# Remaining Work

1. Commit + push BE (`menubloc-backend-main` @ `main`) → Railway
2. Commit + deploy FE (`menubloc-frontend-main` @ `main`) → Vercel + alias + tip-gate
3. Probe operator profile API for `menuply_public_id`
4. Legal/product consent for distributor outreach later

# Risks / Known Issues

- Deploy FE that selects `menuply_public_id` before migration → profile/information SQL may fail
- Consent gap intentional

# Verification Status

- Local contract tests: PASS
- Production SQL: PASS (74839 restaurants, all valid MPL-R-XXXXXXXX, 13 distributors, immutable)
- Production BE/FE code deploy: pending

# Resume Instructions

1. Apply `0219` migration on target DB
2. Confirm `SELECT menuply_public_id FROM restaurants LIMIT 5` returns `MPL-R-…`
3. Confirm catalog: `SELECT slug, sort_index FROM foodservice_distributors ORDER BY sort_index`
4. Deploy BE from `menubloc-backend-main` @ clean `main` after merge
5. Deploy FE from `menubloc-frontend-main` @ clean `main` after merge + alias + tip-gate

# Git Status

Uncommitted implementation in authorized worktrees at handoff time.
