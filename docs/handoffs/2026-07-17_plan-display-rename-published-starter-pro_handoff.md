# Objective

Rename customer-facing plan labels: Published/Verified → Starter (free), Starter → Pro (paid mid). Keep plan codes and Stripe lookup keys unchanged. Stripe Dashboard renames are owner-owned.

# Current Status

**LOCAL COMPLETE** — display rename implemented; not committed/deployed.

# Files Changed

**Backend**
- `menubloc-backend/src/services/payments/menuplyPlanCatalog.js` — public/display/checkout labels
- `menubloc-backend/src/services/payments/paypalPlanCatalog.js` — free `verified` display_name → Starter

**Frontend**
- `RestaurantSignupEntry.jsx`, `SubscriptionSelect.jsx`, `PlanComparisonTable.jsx`
- `OperatorSubscription.jsx`, `OperatorMyAccount.jsx`, `paymentHelpers.js`, `menuplyCheckoutPlans.js`
- `onboardingOperatorLabels.js` (EN/ES/ZH), `FoundersFaqAccordion.jsx`, `RestaurantHelpCenter.jsx`
- `src/lib/__tests__/restaurantClaimPlans.test.js` fixtures

**Docs**
- `docs/audits/2026-07-17_plan-display-rename-published-starter-pro.md`
- this handoff

# Database Changes

None.

# Decisions Made

- Display names only; codes `published_free` / `starter_*` / legacy `verified` unchanged.
- Legacy blocked `pro_*` (“Pro Partner”) unchanged.
- “Fully Searchable, Verified Menu” bullet left as menu-quality wording.
- Stripe product/price names: owner will change in Stripe Dashboard.

# Remaining Work

1. Commit when requested.
2. Deploy backend + frontend; alias menuply.com if frontend prod.
3. Owner: update Stripe Dashboard names.
4. Optional: public profile “✓ Verified” badge / locked messages.

# Risks / Known Issues

Stripe Dashboard may still show old names until owner updates. Checkout sessions use Price IDs / lookup keys — unaffected by display rename.

# Verification Status

- Backend `menuplyPlanCatalog` tests: pass
- Frontend claim/checkout plan unit tests: pass (19)
- Manual `/restaurant/signup` visual check: not run in browser this session

# Resume Instructions

1. Spot-check `/restaurant/signup` cards + comparison table + FAQ.
2. Confirm checkout body still sends `starter_monthly` / `starter_annual` / `published_free`.
3. Commit/deploy when approved.

# Git Status

Uncommitted local changes at end of task (await user commit request).
