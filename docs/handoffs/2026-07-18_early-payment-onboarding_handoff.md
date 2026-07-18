# Objective

Move Menuply plan payment earlier in onboarding (after organization); reserve QR merchandise without Stripe charges; locations never reopen plan chooser.

# Current Status

Implementation complete locally. Not committed / not deployed.

# Files Changed

## Backend
- `src/services/restaurants/onboardingCheckpointService.js` — stage order org → payment → information → locations
- `src/services/organizations/businessOrganizationService.js` — free skip + paid → subscription
- `src/services/restaurants/ownedLocationsService.js` — always design-select; no payment skip
- Tests + architecture docs + audit

## Frontend
- `src/lib/operatorOnboardingCheckpoints.js`, `businessOrganizationSchema.js`, `restaurantInformationSchema.js`
- `RestaurantOnboardingOrganization.jsx`, `RestaurantSignup.jsx`, `SubscriptionSelect.jsx`
- Contract tests + architecture sync + audit

# Database Changes

None.

# Decisions Made

- Runtime `payment.next` = `restaurant_information` until Stripe QR catalog exists
- Architecture docs list reserved `qr_merchandise` between payment and information
- Prefer Skip-forward to Information (no QR buy path this pass)

# Remaining Work

1. Commit FE + BE when requested
2. Deploy Railway (BE) + Vercel + alias menuply.com (FE)
3. Manual E2E paid/free flows
4. Separate task: Stripe QR SKUs → enable qr-upsell buy → flip live next stage

# Risks / Known Issues

- Server resume still revalidates paid payment via `subscription_active` until webhook

# Verification Status

- BE: `onboardingCheckpointAndLaunchReadiness`, `businessOrganizationService` pass
- FE: `operatorOnboardingCheckpoints`, `restaurantOnboardingInformationContract`, `menuplyCheckoutPlans`, `api-base-url-guardrail` pass

# Resume Instructions

If deploying: push BE main, FE branch, `vercel --prod` + `vercel alias set … menuply.com`, probe org → payment → information → locations.

# Git Status

Uncommitted WIP on FE `feature/mds-homepage-controls` and BE `main` (verify with `git status` before commit).
