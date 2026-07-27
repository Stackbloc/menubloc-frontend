# CPD — Tablet/sales order availability restore (pause + close + hours)

**Date:** 2026-07-26  
**Authorization:** User `approved` (Phase 2 implement) then `cpd` (record). **No ship/deploy authorization in this turn.**  
**Scope:** Restore/extend restaurant order-availability controls on operator Home + Tablet; timed temporary close; store-hours auto-gating; checkout enforcement; public unavailable messaging. Reuses existing `order_acceptance_*` / `operating_hours` — no parallel system. No Stripe mode change. No Waiter / OperatorLogin / HomeNext redesign.

## Status

| Gate | Result |
|------|--------|
| Phase 1 audit | Done — [`docs/audits/2026-07-24_tablet-sales-dashboard-order-availability-regression.md`](../audits/2026-07-24_tablet-sales-dashboard-order-availability-regression.md) |
| Phase 2 local implementation | **Done** (uncommitted) |
| Git commit | **Not done** |
| Railway backend tip | **Not updated** — still `8b150e6b…` |
| Vercel / menuply.com | **Not updated** — live bundle `index-Bet0pO-X.js` |
| Human smoke on production | **Not done** |

**Verdict:** LOCAL COMPLETE — **NOT PRODUCTION-COMPLETE**. CPD records implementation state only.

## Commits

| Repo | Branch | Commit | Notes | On production tip? |
|------|--------|--------|-------|--------------------|
| menubloc-backend | `feature/billboard-multi-slot` (dirty) | *(uncommitted)* | Availability service + migration `0212` + route wiring | **No** |
| menubloc-frontend-main | `main` (dirty, ahead 1) | *(uncommitted)* | Shared Pause/Close controls + public banner | **No** |

**Do not ship** from dirty trees as-is. Isolate availability files into clean commits (prefer backend `main` worktree + FE `menubloc-frontend-main` clean `main`) before Railway/Vercel.

## What was implemented (local)

### Backend
- `sql/migrations/20260724_0212_order_closed_expires_at.sql` — `restaurants.order_closed_expires_at`
- `src/services/restaurants/restaurantOrderAvailabilityService.js` — hierarchy: eligibility → ordering_enabled → temporary close → pause → store hours
- `restaurantOrderingEligibility.js` — `assertRestaurantAcceptingOrdersAsync` (SD resolver optional/fail-soft)
- `orderPricingService.js` / `orders.js` — payment-intent/preview return `restaurant_unavailable` + `resume_at`
- `orderReceiver.js` — timed pause/close + `operational` payload; auto-resume expired pause/close
- `publicMenu.js` — `ordering_availability` on public menu payload
- `test/restaurantOrderAvailabilityService.test.js`

### Frontend (`menubloc-frontend-main`)
- `OrderAvailabilityControls.jsx` — Pause 10/15/30/45/60 + custom; Close 1h/2h/4h/rest of today/until tomorrow/custom; Store Hours link
- Wired on `OperatorDashboard.jsx` (`/operator`) and `OperatorTabletPage.jsx` (`/operator/tablet`)
- `OrderingUnavailableBanner.jsx` on `PublicMenuPage` + `CatalogMenuRenderer` (waiter sticky hint preserved)
- `restaurantStatusLight.js` — `getOrderingAvailabilityMessage` / `isOnlineOrderingAvailable`
- Checkout surfaces backend `resume_at` on `restaurant_unavailable`

### Existing reused (not reinvented)
- `order_acceptance_status` / `order_pause_expires_at`
- `operating_hours` + `/operator/hours` editor
- `restaurants.timezone`

## Database

| Item | Status |
|------|--------|
| Migration `0212` file | Present locally (untracked in backend git) |
| Column on `.env` DB (same Supabase project_ref as prod health: `sarfpagchmpychdrfgpj`) | **Applied** earlier this session — `order_closed_expires_at` verified |
| `schema_migrations` row on production tip | **Not independently re-verified in this CPD** — confirm before claiming BE ship complete |

## Deploy

| Step | Action | Status |
|------|--------|--------|
| 1. Isolate + commit BE availability-only | Prefer clean worktree off `main` | **Pending** |
| 2. Push BE → Railway | Tip must include service + routes | **Pending** |
| 3. Confirm migration `0212` on production | `schema_migrations` / column probe | **Pending re-check** |
| 4. Isolate + commit FE availability-only | From `menubloc-frontend-main` only; no home WIP | **Pending** |
| 5. `npx vercel --prod --yes` + alias menuply.com + www | Per FE deploy path contract | **Pending** |
| 6. Tip gate | `scripts/assert-menuply-production-tip.sh` | **Pending** |
| 7. Human smoke | Pause/resume/close/hours/checkout reject | **Pending** |

### FE deploy path (when/if ship approved)

| Field | Value |
|-------|-------|
| Checkout | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` **only** |
| Branch | clean `main` |
| Tree | Clean of unrelated home/email WIP |
| Alias | `npx vercel alias set <url> menuply.com` and `www.menuply.com` |
| Contract | [Frontend Production Deploy Path Contract](../guardrails/2026-07-24_frontend-production-deploy-path-contract.md) |
| Exception | none unless Andre names one |

## Verification (local only)

| Check | Result |
|-------|--------|
| `node test/restaurantOrderAvailabilityService.test.js` | PASS (2026-07-24 session) |
| `node --test test/restaurantOrderingEligibility.test.js` | PASS |
| `foodTruckOpenAvailabilityRoute.test.js` | PASS |
| FE `npm run test:menu-experience-contract` | PASS |
| Production BE `/health` commit (this CPD) | `8b150e6b7e2b416d76bbf5d7df14baa902ba0d46` — **pre-change tip** |
| menuply.com live bundle (this CPD) | `index-Bet0pO-X.js` — **pre-change tip** |
| Stripe production | **Unchanged live** |
| Waiter / OperatorLogin / HomeNext | Untouched by this feature (FE tree has unrelated dirty home files — do not ship them with this CPD) |

## Human verify (after ship)

1. `/operator` — Pause 10 min → countdown/resume time → manual Resume  
2. Auto-resume after pause expiry (GET availability)  
3. Close “Rest of today” → Reopen  
4. Store Hours entry → configure day → outside hours blocks checkout with clear message  
5. Public menu shows unavailable banner; payment-intent returns `restaurant_unavailable`  
6. Existing live orders still visible while paused/closed  

## Stripe mode statement

Stripe production configuration was **not** modified. Production remains live. No temporary sandbox configuration was activated.

## Related docs

- Audit: [`docs/audits/2026-07-24_tablet-sales-dashboard-order-availability-regression.md`](../audits/2026-07-24_tablet-sales-dashboard-order-availability-regression.md)  
- Handoff: [`docs/handoffs/2026-07-24_tablet-order-availability-restore_handoff.md`](../handoffs/2026-07-24_tablet-order-availability-restore_handoff.md)

## Next agent / next turn

1. Explicit **commit** + **ship** authorization required before push/deploy.  
2. Do not mix with dirty billboard/SD/home WIP.  
3. After ship: update this CPD with commit hashes, Railway deploy id, Vercel tip, tip-gate PASS, human verify.
