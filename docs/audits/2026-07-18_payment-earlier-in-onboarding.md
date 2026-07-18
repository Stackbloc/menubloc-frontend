# Summary

Moved Menuply plan payment earlier in restaurant onboarding (after business organization). Locations no longer open `/restaurant/subscription`. Optional QR merchandise is reserved in architecture but not charged — Stripe QR catalog is not live.

# Problem Statement

Paid operators who already chose a plan at signup saw `/restaurant/subscription` again after Locations Continue, with the three-plan chooser and no auto-checkout.

# Root Cause

1. `completeLocationsCheckpoint` set `next_route` to `/restaurant/subscription` for paid plans and recorded free-plan payment skip on locations complete.
2. `resolvePostLocationsPath` / signup `post_locations_path` pointed paid users at the plan page.
3. Checkpoint order put `payment` after `locations`.
4. `SubscriptionSelect` showed the chooser without auto-starting Stripe when a plan was already preset; production API fallback risked same-origin HTML.

# Evidence Collected

- User URL: `menuply.com/restaurant/subscription?…&plan=founders_annual` after Locations.
- Prior architecture docs listed payment after locations.
- Jul-15 auto-checkout work was documented but not shipped for this early-payment reorder.

# Files Examined

- `onboardingCheckpointService.js`, `ownedLocationsService.js`, `businessOrganizationService.js`
- `operatorOnboardingCheckpoints.js`, `businessOrganizationSchema.js`, `restaurantInformationSchema.js`
- `RestaurantOnboardingOrganization.jsx`, `RestaurantSignup.jsx`, `SubscriptionSelect.jsx`
- Architecture + contract tests

# Database Queries Executed

None.

# Changes Made

- **Checkpoint order (FE+BE):** `business_organization` → `payment` → `restaurant_information` → `locations` → `public_profile_review`. Runtime `payment.next` = information (QR reserved, not live).
- **Org complete:** free → record `payment` skip (`free_plan`) → information; paid → `/restaurant/subscription`.
- **Locations complete:** always `public_profile_review` / design-select; never subscription; never payment skip.
- **SubscriptionSelect:** Railway `DEFAULT_PROD_API_BASE`; auto-checkout when paid plan preset; success → `/restaurant/onboarding/information` (not qr-upsell purchase).
- **Signup:** `post_locations_path` always design-select.
- **Docs + contract tests** updated; QR merchandise documented as deferred until Stripe catalog.

# Commits

Not committed in this session (awaiting user request).

# Deployment Status

Local only until FE Vercel + BE Railway deploy.

# Verification Results

- Contract / unit tests run in this session (see task completion).
- Live Stripe E2E not run here.

# Remaining Risks

- Paid `payment` stage revalidation still requires `subscription_active` on server resume until webhook confirms — same race as before.
- Mid-flow restaurants that completed locations under the old order may still need payment repair via resume.

# Follow-Up Work

1. Create Stripe Products/Prices for QR kits; enable qr-upsell buy path; flip live `payment.next` → `qr_merchandise`.
2. Deploy FE + alias `menuply.com`; deploy BE.
3. Manual E2E: paid org → Stripe plan → information → locations → design-select (no plan cards).

# Final Verdict

**Early Menuply plan payment is wired; locations never reopen the plan chooser; QR merchandise remains reserved/skip-only until Stripe catalog exists.**
