# Summary

Replaced operator **Display Board** nav with **Billboards** — a deal-backed graphic/splash surface. Dual entry (Billboards-first or Deals “Feature as Billboard”) uses the same `deals` + `restaurant_billboard_posts` data. Non-selling billboards may omit `menu_item_id`.

# Problem Statement

Display Board (TV/`tv_menu_board` settings) occupied a nav slot that should be restaurant billboards (profile splash graphics), not rebuilt TV board UI. Operators need graphic-first and text-first paths that stay in sync with Deals.

# Root Cause

Product gap / nav misplacement: Display Board was the wrong product for the slot; billboards already existed as deal extensions (`upsertDealBillboard`) but had no dedicated operator page or nullable menu-item deals.

# Evidence Collected

- `OperatorDealsEditor` already featured “Feature this deal as a billboard” via `uploadBillboardPhoto` + `upsertDealBillboard`.
- Profile splash uses `billboard_preview` + `RestaurantBillboardStrip`; On=`active`, Off=`paused` via `pauseDealBillboard`.
- `deals.menu_item_id` was NOT NULL — blocked non-offer (graphic-only) billboard deals until migration + route relaxation.

# Files Examined

- `menubloc-frontend/src/pages/operator/OperatorLayout.jsx`
- `menubloc-frontend/src/App.jsx`
- `menubloc-frontend/src/pages/operator/OperatorDealsEditor.jsx`
- `menubloc-frontend/src/lib/operatorApi.js` (deal/billboard helpers; display-settings left for Menu Lab)
- `menubloc-backend/src/routes/operator/deals.js`
- `menubloc-backend/src/services/restaurantBillboardService.js`
- `menubloc-frontend/src/pages/MenuDesignLabPage.jsx` (still uses `getDisplaySettings`)

# Database Queries Executed

None against production in this pass. Migration authored:

`sql/migrations/20260719_0193_deals_menu_item_nullable_for_billboards.sql` — `ALTER TABLE deals ALTER COLUMN menu_item_id DROP NOT NULL`

# Changes Made

**Frontend**
- Nav: Display Board → Billboards (`/operator/billboards`), no `tv_menu_board` gate
- Route + redirect: `/operator/billboards`; `/operator/display-settings` → Billboards
- New `OperatorBillboardsPage.jsx`: list/create/edit graphic, terms, On/Off splash, offer yes/no + menu item link
- Deals editor: dual-entry copy + Link to Billboards; Feature-as-Billboard path unchanged (upload + upsert)
- i18n: `operator.nav.billboards` (en/es/zh)
- Contract: `test/operatorBillboardsNavContract.test.js`

**Backend**
- Create/update deals: allow null `menu_item_id` when `allow_null_menu_item` or `deal_type === 'other'`; PATCH can clear menu item
- Migration for nullable `menu_item_id`

**Unchanged (by design)**
- `OperatorDisplaySettings.jsx` file kept; nav/route mount removed
- Menu Lab / display-settings API helpers still used by Menu Lab and OperatorMenuEditor

# Commits

Not committed in this session (await user CPD).

# Deployment Status

Local only — FE + BE + migration not deployed. Non-offer create will fail on prod until migration runs and Railway picks up `deals.js`.

# Verification Results

- `node test/operatorBillboardsNavContract.test.js` → **ok**
- Static smoke: nav Billboards present; display-settings route redirects; offer question + `allow_null_menu_item` + upsert/pause present; Deals Feature path still calls upload/upsert; Menu Lab still imports `getDisplaySettings`
- Live UI create/profile strip not exercised in this session (no operator login probe)

# Remaining Risks

1. Migration must run before non-offer billboards work in production
2. Billboards create uses `deal_type: other` + benefit gate `deals` — restaurants over deal limits cannot create
3. Publish after create is best-effort; drafts still appear to operators

# Follow-Up Work

1. Commit FE/BE separately; run migration; deploy Railway then Vercel + alias
2. Manual smoke: create billboard (offer no/yes), confirm Deals list + profile On/Off
3. Optional: retire Display Board page later when Menu Lab no longer needs TV settings UX

# Final Verdict

**Local implementation complete per plan.** Display Board removed from nav; Billboards page + Deals dual entry + offer linking + splash On/Off wired. **Not production-complete** until migrate + deploy + human verify.
