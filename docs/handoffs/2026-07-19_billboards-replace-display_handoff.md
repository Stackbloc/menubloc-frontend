# Objective

Replace operator Display Board nav with deal-backed Billboards (graphic/splash), dual entry with Deals, offer menu-item link, profile On/Off.

# Current Status

**LOCAL COMPLETE** — code + contract test + migration authored. Awaiting commit, migrate, deploy, human CPD.

# Files Changed

**Frontend (`menubloc-frontend`)**
- `src/pages/operator/OperatorLayout.jsx` — Billboards nav slot
- `src/App.jsx` — route + display-settings redirect
- `src/pages/operator/OperatorBillboardsPage.jsx` — **new**
- `src/pages/operator/OperatorDealsEditor.jsx` — dual-entry copy / Billboards link
- `src/i18n/onboardingOperatorLabels.js` — `operator.nav.billboards`
- `test/operatorBillboardsNavContract.test.js` — **new**

**Backend (`menubloc-backend`)**
- `src/routes/operator/deals.js` — nullable menu_item create/update
- `sql/migrations/20260719_0193_deals_menu_item_nullable_for_billboards.sql` — **new**

# Database Changes

Migration drops NOT NULL on `deals.menu_item_id` so non-selling billboards can exist without a product link.

# Decisions Made

- Reuse deals + billboard posts; no standalone billboard tables
- No paid ads; offer=no clears product link
- On/Off = active vs `pauseDealBillboard` (paused)
- Leave Display Settings code + APIs for Menu Lab
- Prefer one linked menu item (V1)

# Remaining Work

1. Commit FE + BE (user request)
2. Apply migration on production DB
3. Deploy Railway (BE) + Vercel prod + `vercel alias set … menuply.com`
4. Human smoke: nav, redirect, Billboards→Deals, Deals→billboard graphic, offer yes/no, profile splash On/Off, Menu Lab still loads

# Risks / Known Issues

- Non-offer create fails until migration applied
- Deal benefit limit still applies to billboard-created deals

# Verification Status

- Contract test: pass (`operatorBillboardsNavContract`)
- Live operator UI: not run
- Production: not deployed

# Resume Instructions

1. `cd menubloc-frontend && node test/operatorBillboardsNavContract.test.js`
2. Apply `20260719_0193_deals_menu_item_nullable_for_billboards.sql`
3. Deploy BE then FE; alias menuply.com
4. Smoke checklist in audit file

# Git Status

- FE branch `feature/mds-homepage-controls`: modified layout/App/Deals/i18n; untracked Billboards page + contract test (plus unrelated owner/other dirty files — stage only billboard files)
- BE `main`: modified `deals.js`; untracked migration
