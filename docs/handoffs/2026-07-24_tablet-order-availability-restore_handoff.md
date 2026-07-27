# Objective

Restore tablet/sales order availability controls (timed pause + temporary close) and wire store-hours auto open/close + checkout enforcement, reusing existing `order_acceptance_*` / `operating_hours` systems.

# Current Status

Phase 2 implementation complete locally. **CPD recorded 2026-07-26** — still **not deployed**.

CPD: `docs/deployments/2026-07-26_tablet-order-availability-restore-cpd.md`

Migration `20260724_0212_order_closed_expires_at.sql` applied to the DB pointed at by `menubloc-backend/.env` (column verified present). Production tip unchanged: BE `8b150e6b…`, FE `index-Bet0pO-X.js`.

# Files Changed

## Backend
- `sql/migrations/20260724_0212_order_closed_expires_at.sql` (new)
- `src/services/restaurants/restaurantOrderAvailabilityService.js` (new)
- `src/services/restaurants/restaurantOrderingEligibility.js` — `assertRestaurantAcceptingOrdersAsync`
- `src/services/orders/orderPricingService.js` — checkout gate uses full availability
- `src/routes/orders.js` — returns `restaurant_unavailable` fields
- `src/routes/operator/orderReceiver.js` — timed close + operational payload
- `src/routes/publicMenu.js` — `ordering_availability` on public menu
- `test/restaurantOrderAvailabilityService.test.js` (new)

## Frontend (`menubloc-frontend-main`)
- `src/components/operator/OrderAvailabilityControls.jsx` (new)
- `src/components/menu/OrderingUnavailableBanner.jsx` (new)
- `src/pages/operator/OperatorDashboard.jsx`
- `src/pages/operator/OperatorTabletPage.jsx`
- `src/lib/restaurantStatusLight.js`
- `src/pages/PublicMenuPage.jsx`
- `src/components/menuCatalog/CatalogMenuRenderer.jsx`
- `src/pages/CheckoutPage.jsx` (resume_at on availability error)

# Database Changes

- `restaurants.order_closed_expires_at TIMESTAMPTZ` (nullable)
- Existing reused: `order_acceptance_status`, `order_pause_expires_at`, `operating_hours`, `operating_hours_exceptions`, `timezone`

# Decisions Made

1. Recover existing pause/close APIs — no parallel system.
2. Hours fail-open when no `operating_hours` rows configured (avoid mass-closing restaurants).
3. Hours evaluated in restaurant IANA timezone via `Intl` (no new TZ dependency).
4. Multi-period days deferred — current schema is one open/close per day.
5. Subscription eligibility still checked before operational pause/close/hours.

# Remaining Work

1. Deploy backend (Railway) including migration confirmation on production tip.
2. Deploy frontend from clean `menubloc-frontend-main` `main` per FE deploy path contract.
3. Human smoke: pause 10m, resume, auto-resume, close rest-of-day, reopen, hours open/close, checkout rejection.
4. Optional: multi-period store hours schema.
5. Optional: enrich Orders page 3-light panel with same duration menus.

# Risks / Known Issues

- `menubloc-frontend-main` working tree may have unrelated dirty files — ship only availability commits.
- Public menu now resolves hours on each menu fetch (extra query) — fail-soft on error.
- Tip lock docs still mention `index-BASJhs79.js` while live tip may differ — follow deploy contract on ship.

# Verification Status

| Check | Result |
|-------|--------|
| `node test/restaurantOrderAvailabilityService.test.js` | PASS |
| `node test/foodTruckOpenAvailabilityRoute.test.js` | PASS |
| `npm run test:menu-experience-contract` (frontend-main) | PASS |
| Migration column present | PASS on `.env` DB |
| Production FE/BE deploy | Not done |

# Resume Instructions

1. Confirm production DB has `order_closed_expires_at` (run migration if not).
2. Ship backend tip with availability service.
3. Commit FE changes on clean main worktree → `vercel --prod` from `menubloc-frontend-main` only → alias + tip gate.
4. Smoke tablet `/operator` and `/operator/tablet` Pause/Close/Hours controls.

# Git Status

Uncommitted local changes in backend + `menubloc-frontend-main` (this session). No commit/push unless requested.
