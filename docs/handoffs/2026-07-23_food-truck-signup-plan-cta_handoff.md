# Objective

Align Food Truck signup with restaurant signup wiring (Select plan → account → verify-email autoSend → menu upload) and prove E2E.

# Current Status

**LOCAL E2E PASS** — CPD in progress.

# Files Changed

- `src/pages/FoodTruckSignup.jsx`
- `src/pages/operator/OperatorEmailVerification.jsx`
- `src/pages/PdfUploadPage.jsx`
- `src/lib/__tests__/menuplyCheckoutPlans.test.js`
- `tests/playwright/food-truck-signup-wiring.spec.js`
- `docs/audits/2026-07-23_food-truck-signup-plan-cta.md`

# Database Changes

None (live signup creates operator/restaurant via existing `POST /owner/profile`).

# Decisions Made

- Match restaurant post-signup: persist onboarding + `/operator/verify-email` + `autoSend: true`
- Next path: `/restaurant/pdf-upload?food_truck_onboarding=1` (Stripe still later on operator subscription)
- Plan card CTA label: **Select Food Truck** (parity with Select Pro / Select Founder's)

# Remaining Work

1. Commit / push / `vercel --prod` / alias menuply.com
2. Human verify on production `/foodtruck/signup`

# Risks / Known Issues

Mailer can 5xx for some domains; wiring still proven when autoSend is called and operator is found.

# Verification Status

- vitest menuplyCheckoutPlans: 18/18 PASS
- Playwright food-truck-signup-wiring: 2/2 PASS (local Vite + Railway API)

# Resume Instructions

If deploy incomplete: from `menubloc-frontend`, deploy only the food-truck wiring commit and alias.

# Git Status

Uncommitted until CPD commit this session.
