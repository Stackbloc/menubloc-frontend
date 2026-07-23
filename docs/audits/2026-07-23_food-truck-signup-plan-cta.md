# Summary

Aligned `/foodtruck/signup` with restaurant signup wiring: plan Select CTA, persist onboarding state, navigate to `/operator/verify-email` with `autoSend: true`, then `/restaurant/pdf-upload?food_truck_onboarding=1`. Playwright E2E passed against local Vite + production API.

# Problem Statement

Food truck plan card lacked a clear Select CTA, and post-signup stopped at an in-page “Account created → login” banner instead of restaurant’s verify-email autoSend path — so users had no working plan signup handoff.

# Root Cause

`FoodTruckSignup.jsx` created the account and remembered `food_truck_annual`, but did not call `persistRestaurantOnboardingState` / navigate to verify-email. Restaurant signup already did.

# Evidence Collected

Playwright (`PLAYWRIGHT_BASE_URL=http://127.0.0.1:5175`, Vite with `VITE_API_BASE_URL` → Railway):

1. Plan **Select Food Truck** CTA focuses `#email` — PASS  
2. Submit → `POST /owner/profile` 200 → URL `/operator/verify-email` with email prefilled → `POST /restaurant-auth/send-email-code` autoSend (not 404) — PASS (2/2 in 9.4s)

# Files Examined / Changed

- `menubloc-frontend/src/pages/FoodTruckSignup.jsx`
- `menubloc-frontend/src/pages/operator/OperatorEmailVerification.jsx`
- `menubloc-frontend/src/pages/PdfUploadPage.jsx`
- `menubloc-frontend/src/lib/__tests__/menuplyCheckoutPlans.test.js`
- `menubloc-frontend/tests/playwright/food-truck-signup-wiring.spec.js`

# Database Queries Executed

None (signup creates rows via live `POST /owner/profile` during E2E).

# Changes Made

- Plan card CTA: **Select Food Truck** → scroll/focus form  
- Submit: persist onboarding + `rememberIntendedCheckoutPlanCode` + navigate verify-email `autoSend` + nextPath menu upload  
- Verify-email preserves `food_truck_onboarding=1` query when handing off  
- Pdf upload detects food-truck onboarding from query/state/plan  

# Commits

Pending CPD this session.

# Deployment Status

Pending.

# Verification Results

- vitest `menuplyCheckoutPlans.test.js`: 18/18 PASS  
- Playwright food-truck-signup-wiring: 2/2 PASS  

# Remaining Risks

- Mailer may return 5xx for disposable addresses; wiring still proven (autoSend called, operator found).  
- Stripe still deferred to `/operator/subscription?onboarding=food_truck` after menu upload (by design).

# Follow-Up Work

CPD frontend + alias `menuply.com`. Human confirms live `/foodtruck/signup`.

# Final Verdict

Restaurant-parity wiring implemented and E2E-proven locally against production API.
