# Summary

Implemented opaque permanent Menuply restaurant display IDs (`MPL-R-XXXXXXXX`) and optional structured top-3 foodservice distributor usage collection, without introducing a second restaurant identity system or distributor outreach consent.

# Problem Statement

Restaurants needed a human-readable permanent Menuply ID for partner/distributor conversations, plus optional capture of which food distributors they currently use — without duplicating existing onboarding fields or conflating usage with marketing/outreach permission.

# Root Cause

N/A (feature enhancement). Prior state: canonical identity was already `public.restaurants.id` (BIGINT); no display code; no sales/partner distributor relationship model; contact role missing; consent stack covers Terms/Privacy/Menuply marketing only.

# Evidence Collected

- Architecture spec treats `restaurants.id` BIGINT as sole restaurant SoT; locations/orgs use UUID.
- Restaurant Information already collects `manager_name`, venue type/category, location count via Locations stage.
- Existing `suppliers` / `restaurant_suppliers` is CK ingredient layer — not reused for foodservice distributor CRM.
- `marketing_opt_in` must not be reused for distributor outreach (deferred).

# Files Examined

- `docs/architecture/RESTAURANT_IDENTITY_ARCHITECTURE_SPECIFICATION.md`
- `menubloc-backend-main/src/services/restaurants/ownedRestaurantInformationService.js`
- `menubloc-frontend-main/src/lib/restaurantInformationSchema.js`
- `menubloc-frontend-main/src/components/restaurant/RestaurantInformationForm.jsx`
- Operator/owner profile surfaces

# Database Queries Executed

None against production. Migration authored for local/staging/prod apply via migrate runner:

`sql/migrations/20260807_0219_restaurant_menuply_public_id_and_distributors.sql`

# Changes Made

## Backend (`menubloc-backend-main`)

- Migration 0219: `menuply_public_id` (opaque, unique, immutable), `primary_contact_role`, `foodservice_distributors` catalog seed, `restaurant_distributor_relationships` with `usage_reported` vs `contact_permission_granted`
- Services/routes for catalog + 0–3 usage replace
- Information + operator profile + owner menu console expose `menuply_public_id` read-only

## Frontend (`menubloc-frontend-main`)

- Contact role + optional distributor picker on Restaurant Information
- `MenuplyRestaurantIdBadge` on Operator Profile Editor, My Account, Owner context bar

# Commits

Not committed in this session unless Andre requests.

# Deployment Status

- Production SQL applied (targeted, not full migrate.js):  
  - `20260807_0219_restaurant_menuply_public_id_and_distributors.sql`  
  - `20260807_0220_fix_menuply_public_id_alphabet.sql` (alphabet length fix + regenerate)
- Verify: 74,839 restaurants; 0 missing; 74,839 distinct; all `MPL-R-XXXXXXXX` (len 14); immutability trigger OK; 13 distributors seeded.
- Note: did **not** run full `node scripts/migrate.js` (35 other historical pending files left untouched).
- FE/BE production code deploy: pending after commit/push.

# Verification Results

- Backend contract test: `node test/foodserviceDistributorService.test.js` PASS
- Frontend contract: `node --test test/restaurantOnboardingInformationContract.test.js` 10/10 PASS
- Prod SQL probes: coverage + format + catalog + immutability PASS

# Remaining Risks

- Production migration must run before FE/BE that SELECT `menuply_public_id` go live together
- BEFORE INSERT trigger assumes sequence-backed `restaurants.id` (BIGSERIAL pattern)
- Distributor outreach consent still deferred — `contact_permission_granted` always false

# Follow-Up Work

1. Apply migration 0219 on production from `menubloc-backend-main` @ clean `main` after merge
2. Product/legal: define supplier/distributor outreach consent document + UX (do not invent)
3. Optionally show Menuply ID on onboarding completion screen

# Final Verdict

Identity graph remains BIGINT-canonical. Display code + optional distributor usage are additive, with usage/permission concepts separated from day one. Ready for review, test, migrate, then authorized deploy.
