# Objective

Show sticky MenuPurchaseWaiterHint only for paid restaurants accepting online orders.

# Current Status

**LOCAL COMPLETE** — contract tests PASS; await commit/deploy.

# Files Changed

- `menubloc-frontend/src/lib/restaurantStatusLight.js` — `shouldShowMenuPurchaseWaiterHint`
- `menubloc-frontend/src/pages/PublicMenuPage.jsx`
- `menubloc-frontend/src/components/menuCatalog/CatalogMenuRenderer.jsx`
- `menubloc-frontend/test/menuPurchaseWaiterHintContract.test.js`
- `docs/audits/2026-07-22_menu-purchase-waiter-hint-paid-ordering-gate.md`

# Database Changes

None.

# Decisions Made

- Gate = paid plan AND `accepting_orders` (same as green status light)
- Fail closed when fields missing
- Sticky props unchanged when hint mounts
- Did not touch `/waiter` Waiter page files

# Remaining Work

- Commit + Vercel deploy + menuply.com alias when requested
- Human verify paid accepting vs unpaid menu

# Risks / Known Issues

API payloads without ordering/paid fields hide the coach.

# Verification Status

`npm run test:menu-experience-contract` — PASS

# Resume Instructions

1. Open a paid restaurant with `accepting_orders` — hint visible and sticky
2. Open Standard / nonsubscriber menu — hint absent
3. Confirm sticky still present when hint shows

# Git Status

Uncommitted local FE changes.
