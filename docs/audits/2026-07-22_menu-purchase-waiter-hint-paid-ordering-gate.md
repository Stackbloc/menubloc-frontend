# Summary

Gated `MenuPurchaseWaiterHint` (tap-to-order coach) so it renders only when the restaurant has a **paid** subscription **and** `order_acceptance_status === accepting_orders`. Sticky wiring unchanged when shown.

# Problem Statement

The Waiter face message “To select items for purchase…” appeared on all public menus, including restaurants without online ordering.

# Root Cause

`PublicMenuPage` and `CatalogMenuRenderer` always mounted `MenuPurchaseWaiterHint` (aside from intake preview), with no paid/ordering gate.

# Evidence Collected

- Green status light already required paid + accepting (`restaurantStatusLight.js`).
- Contract suite `test:menu-experience-contract` PASS after gate.

# Files Examined

- `MenuPurchaseWaiterHint.jsx`, `PublicMenuPage.jsx`, `CatalogMenuRenderer.jsx`
- `restaurantStatusLight.js` (`hasPaidSubscriptionPlan`, `hasOnlineOrderingEnabled`)
- `docs/guardrails/2026-07-06_menu-purchase-waiter-hint-sticky-guardrail.md`

# Database Queries Executed

None.

# Changes Made

- Added `shouldShowMenuPurchaseWaiterHint(data)`
- Gated both public menu surfaces; kept `sticky` + `stickyBackground` when mounted
- Extended `menuPurchaseWaiterHintContract.test.js`

# Commits

Not committed in this session.

# Deployment Status

Local only — not deployed.

# Verification Results

`npm run test:menu-experience-contract` — PASS

# Remaining Risks

Menus missing `order_acceptance_status` / paid flags in API payload will hide the hint (fail closed).

# Follow-Up Work

Deploy FE when ready; spot-check a paid accepting restaurant vs Standard/nonsubscriber menu.

# Final Verdict

**LOCAL COMPLETE.** Sticky coach preserved; visibility gated to paid online ordering.
