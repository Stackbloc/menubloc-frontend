# Summary

Customer-facing restaurant plan labels renamed: free tier Published/Verified → **Starter**; paid mid-tier Starter → **Pro**. Internal plan codes and Stripe lookup keys unchanged. Stripe Dashboard product/price names are owner-owned (not changed in this task).

# Problem Statement

Signup, comparison chart, FAQ, and operator subscription UI used inconsistent free-tier names (Published vs Verified) and labeled the $20/$199 mid-tier as Starter. Product required Starter (free) and Pro (paid mid).

# Root Cause

Display names drifted from product naming; FAQ still said “Verified plan” after the free tier had been marketed as Published.

# Evidence Collected

- `/restaurant/signup` cards and `PlanComparisonTable` used Published / Starter / Founder's.
- Backend `menuplyPlanCatalog.js` exposed `public_name`/`display_name` Published and Starter.
- FAQ `onboarding.faq.q1.a2` and Founders FAQ referenced Verified plan.

# Files Examined

- `menubloc-backend/src/services/payments/menuplyPlanCatalog.js`
- `menubloc-backend/src/services/payments/paypalPlanCatalog.js`
- `menubloc-frontend/src/pages/RestaurantSignupEntry.jsx`
- `menubloc-frontend/src/pages/SubscriptionSelect.jsx`
- `menubloc-frontend/src/components/PlanComparisonTable.jsx`
- `menubloc-frontend/src/pages/operator/OperatorSubscription.jsx`
- `menubloc-frontend/src/pages/operator/OperatorMyAccount.jsx`
- `menubloc-frontend/src/i18n/onboardingOperatorLabels.js`
- `menubloc-frontend/src/components/founders/FoundersFaqAccordion.jsx`
- `menubloc-frontend/src/pages/operator/RestaurantHelpCenter.jsx`

# Database Queries Executed

None.

# Changes Made

Display-only renames in catalog + UI/FAQ/i18n. Codes `published_free`, `starter_monthly`, `starter_annual`, legacy `verified` unchanged. Legacy blocked `pro_monthly`/`pro_annual` (“Pro Partner”) left alone.

# Commits

Not committed in this session (await user request).

# Deployment Status

Local only — not deployed.

# Verification Results

- `node --test test/menuplyPlanCatalog.test.js` — pass
- `vitest run` restaurantClaimPlans + menuplyCheckoutPlans — 19 pass

# Remaining Risks

- Stripe Dashboard names may still say Published/Starter until owner updates them.
- Public profile badge / locked-message copy that still says “Verified” (non-plan-marketing surfaces) was out of scope per plan.
- ES/ZH mid-tier prices in i18n may still show legacy $49/$399 amounts (label rename only).

# Follow-Up Work

- Owner: rename Stripe products/prices to Starter / Pro.
- Optional: align ES/ZH price strings; update public profile “Verified” badge if product wants full consistency.

# Final Verdict

Display rename complete locally. Checkout still submits unchanged plan codes.
