# Summary

The tablet/sales order-availability controls were **not deleted from production**. Prior pause/close/hours implementations still exist in `menubloc-frontend-main`, live FE bundle `index-Bet0pO-X.js`, and backend tip `8b150e6b`. The reported regression is primarily **feature fragmentation + incomplete product behavior**, not a wholesale deploy wipe: timed pause lives on Home (`/operator`), indefinite close lives on Tablet/Orders, store hours exist but do **not** auto-gate ordering, and checkout does **not** enforce `order_acceptance_status`.

# Problem Statement

Operators report missing pause / temporary-close controls on the tablet sales dashboard, and need configurable store hours so online ordering opens/closes automatically without manual daily resume.

# Root Cause

1. **Controls are split across surfaces** (by design of May 2026 commits, not a later deletion):
   - `/operator` (`OperatorDashboard.jsx`) — sales dashboard with **timed** “Pause Ordering” (30 / 60 / 180 / custom minutes) + Resume; **no Close Store button**.
   - `/operator/tablet` (`OperatorTabletPage.jsx`) — Accepting / Pause / Close **without** duration presets or countdown.
   - `/operator/orders` (`RestaurantOrdersPage.jsx`) — 3-light Accepting / Pause / Stop **without** timed pause.
2. **Timed temporary close never existed** — no `closed_until` / `temporarily_closed_until` column or API. `order_acceptance_status = 'closed'` is indefinite until manual reopen.
3. **Store hours exist but do not drive availability** — `operating_hours` + `/operator/hours` editor + exceptions are live; schedule is display-only for “Closes today at …” on Home. Checkout does not consult hours.
4. **Checkout eligibility ignores operational pause/close** — `assertRestaurantOrderingAllowedAsync` checks `ordering_enabled` + subscription entitlements only; `order_acceptance_status` is not enforced on preview / payment-intent.

# Evidence Collected

| Check | Result |
|-------|--------|
| Live FE tip (2026-07-25 probe) | `index-Bet0pO-X.js` on `menuply.com` |
| Bundle string scan (cached/local copy of tip) | Contains `Pause Ordering`, `Pause Orders`, `Close Store`, `Stop Orders`, `Accepting Orders`, `Store status`, `order_pause_expires`, `ot-availability` |
| Locked tip contract | Still documents `index-BASJhs79.js` / `1fhl66453` — **tip has drifted**; pause UI still present on current tip |
| Backend tip | `commit_hash=8b150e6b7e2b416d76bbf5d7df14baa902ba0d46` |
| `orderReceiver.js` on tip | Includes `pause_minutes`, `order_pause_expires_at`, GET auto-resume |
| Git search for `closed_until` / `temporarily_closed_until` | **No matches** in SQL/JS history |
| `restaurantOrderingEligibility.js` | Does not read `order_acceptance_status` |
| Dual hours tables | `restaurant_hours` (migration 0007, meal signals / early time-aware) + `operating_hours` (operator Hours editor) |

# Files Examined

## Frontend (recoverable / current)

- `menubloc-frontend-main/src/pages/operator/OperatorDashboard.jsx` — timed pause + sales stats
- `menubloc-frontend-main/src/pages/operator/OperatorTabletPage.jsx` — 3-button availability
- `menubloc-frontend-main/src/pages/operator/RestaurantOrdersPage.jsx` — 3-light panel
- `menubloc-frontend-main/src/pages/operator/OperatorHoursEditor.jsx` — weekly hours + exceptions
- `menubloc-frontend-main/src/pages/operator/OperatorLayout.jsx` — nav link to `/operator/hours`
- `menubloc-frontend-main/src/pages/operator/RestaurantHelpCenter.jsx` — documents Pause dropdown + Hours

## Backend

- `menubloc-backend/src/routes/operator/orderReceiver.js` — GET/PATCH `/availability`
- `menubloc-backend/src/routes/operator/hours.js` — operating hours CRUD
- `menubloc-backend/src/services/restaurants/restaurantOrderingEligibility.js` — checkout gate
- `menubloc-backend/src/services/orders/orderPricingService.js` — calls eligibility assert
- Migrations: `20260522_0108_restaurant_order_acceptance_status.sql`, `20260601_0109_add_order_pause_expires_at.sql`, `20260315_0007_time_aware_availability.sql`, `20260517_0100_operating_hours_unique_constraint.sql`

# Database Queries Executed

None in this audit (read-only code/git/deploy probes). Schema confirmed from migrations:

| Column / table | Purpose |
|----------------|---------|
| `restaurants.order_acceptance_status` | `accepting_orders` \| `paused` \| `closed` |
| `restaurants.order_acceptance_note` | Operator note |
| `restaurants.order_acceptance_reason_code` | Machine reason |
| `restaurants.order_pause_expires_at` | Timed pause auto-resume |
| `restaurants.timezone` | IANA TZ (time-aware migrations) |
| `operating_hours` | Weekly schedule used by Hours editor |
| `operating_hours_exceptions` | Holiday / one-off exceptions |
| `restaurant_hours` | Earlier per-day windows (not wired to operator Hours UI) |

No `orders_paused_until` / `temporarily_closed_until` columns found.

# Changes Made

None (Phase 1 audit only).

# Commits

| When | Commit | What |
|------|--------|------|
| 2026-05-22 | `e7fa414` (FE) | Live operational dashboard + Pause Ordering dropdown |
| 2026-05-22 | `90537c0` (FE) | Restaurant availability controls |
| 2026-05-22 | `5f53288` (FE) | 3-light status panel on Orders |
| 2026-05-31 | `a7c1c21b` (BE) | `pause_minutes` + `order_pause_expires_at` + GET auto-resume |
| 2026-05–06 | `fb4f43e` / `b599e10` (FE) | Send `pause_minutes`, countdown UI |
| 2026-06-15 | `dc01425` (FE) | Tablet PWA with Accepting/Pause/Close |

**Last known working commit for timed pause on sales home:** `fb4f43e` lineage (still present on `menubloc-frontend-main` HEAD and in live bundle strings).

**No commit found that removed** Pause Ordering from `OperatorDashboard.jsx` or AvailabilityControls from `OperatorTabletPage.jsx`.

# Deployment Status

| Surface | Identifier | Availability code present? |
|---------|------------|----------------------------|
| menuply.com FE | `index-Bet0pO-X.js` | Yes (string probe) |
| Railway BE | `8b150e6b…` | Yes (`orderReceiver` pause expiry) |
| FE tip vs locked contract | Drifted from `BASJhs79` / `1fhl66453` | Unrelated to pause wipe; note for deploy hygiene |

# Verification Results

- Production FE bundle contains pause/close UI strings.
- Production BE health reports tip with pause-expiry route logic present in that commit’s tree.
- Help center still documents Pause Ordering durations and Hours editor.
- Checkout path verified in code: **does not** reject on `paused` / `closed`.

# Remaining Risks

- Operators on `/operator/tablet` see pause/close **without timers** and may conclude “duration controls disappeared.”
- Operators on `/operator` (sales) see timed pause but **no temporary close**.
- Hours may be configured but ordering stays open overnight until someone pauses/closes manually.
- Pause/close may appear to work in the tablet UI while customers can still pay.
- Split-period days: current `operating_hours` is **one open/close per day** (unique on `restaurant_id, day_of_week`); multi-period requires schema extension or a periods JSON model.
- `restaurant_hours` vs `operating_hours` dual tables risk future agents wiring the wrong source.

# Follow-Up Work

**Restore / extend (do not invent a parallel system):**

1. Unify tablet + sales surfaces on existing `order_acceptance_status` + `order_pause_expires_at` APIs.
2. Add Close duration UX (likely new `order_closed_expires_at` or reuse note+expiry pattern) — **new field required**; no prior timed-close to recover.
3. Expand pause presets to product list (10/15/30/45/60 + custom).
4. Enforce availability hierarchy in `restaurantOrderingEligibility` / `priceOrder` / payment-intent with structured reason codes.
5. Auto-open/close from `operating_hours` + restaurant timezone (and decide single SoT vs `restaurant_hours`).
6. Customer-facing messages on public menu/profile when unavailable.
7. Focused tests for pause/resume/close/hours/checkout rejection.

# Final Verdict

**STATUS = AUDIT COMPLETE — NOT A DELETE-AND-REBUILD REGRESSION.**

Recover existing pause/close/hours implementations; extend for timed close, auto hours gating, checkout enforcement, and surface parity. Do **not** promote an old wholesale deployment. Await explicit approval before Phase 2 code edits.


---

## Phase 2 addendum (2026-07-24)

Implemented locally (not production-complete until deploy):

- `restaurantOrderAvailabilityService` + migration `order_closed_expires_at`
- Checkout enforces pause/close/hours (`restaurant_unavailable`)
- Unified Home + Tablet Pause/Close duration controls
- Public menu `ordering_availability` + `OrderingUnavailableBanner`
- Tests: availability unit PASS; food-truck availability PASS; menu-experience-contract PASS

Handoff: `docs/handoffs/2026-07-24_tablet-order-availability-restore_handoff.md`
