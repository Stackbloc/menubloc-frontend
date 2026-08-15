# Summary

Owner menu-console APIs to add entrance-splash billboards and profile Windows creatives (`content_type=window`), plus restaurant profile social consolidation under a single **What Diners Are Saying** heading (Tips & discussion functionality retained without a second label).

# Problem Statement

Platform owners could only set Windows photo orientation; they could not create splash billboards or Windows-panel creatives from owner APIs. Public profile showed two labeled social blocks (food activity + Tips & discussion).

# Root Cause

Billboard create lived only under operator deals; DB `chk_billboard_content_type` did not allow `window`. Profile UI passed `title="Tips & discussion"` into nested `FoodComments`.

# Evidence Collected

- Operator: `PUT /operator/restaurants/:id/deals/:dealId/billboard` → `upsertDealBillboard` (`content_type=deal`).
- FE splash picker skips `content_type=window`; Windows panel reserved dedicated window type.
- `WhatDinersAreSaying.jsx` nested `FoodComments` with second heading.

# Files Examined

- `menubloc-backend-main/src/routes/operator/deals.js`
- `menubloc-backend-main/src/services/restaurantBillboardService.js`
- `menubloc-backend-main/src/routes/ownerMenuConsole.js`
- `menubloc-frontend-main/src/components/restaurant/WhatDinersAreSaying.jsx`
- `menubloc-frontend-main/src/components/comments/FoodComments.jsx`

# Database Queries Executed

None (migration authored, not applied in this task).

# Changes Made

## Backend (`menubloc-backend-main`)

- Migration `20260815_0249_billboard_content_type_window.sql` (+ rollback)
- Service: `createOrUpdateSplashBillboard`, `createOrUpdateWindowPost`, `listOwnerBillboardPosts`, `pauseBillboardPost`
- Routes: `src/routes/ownerBillboards.js` mounted on menu-console
- Contract: `test/ownerBillboardWindowContract.test.js`

## Frontend (`menubloc-frontend-main`)

- Single card **What Diners Are Saying**; `FoodComments` with `hideTitle` + `embedded`
- Contracts updated for no `Tips & discussion` string; comments still mount

# Commits

Not committed (await user request).

# Deployment Status

Not deployed. Migration not applied to production.

# Verification Results

- `node --test test/ownerBillboardWindowContract.test.js` (run in session)
- FE: `npx vitest run test/whatDinersAreSayingContract.test.js` + `node test/foodDiscussionsContract.test.js` (run in session)

# Remaining Risks

- Migration `0249` must be applied before `content_type=window` inserts succeed.
- Public Windows panel remains In-N-Out-only for legacy pool until product lifts that gate.
- Owner Profile Manager UI for add billboard/window not built (API-only this turn).

# Follow-Up Work

- Apply migration; optional Owner Profile Manager UI
- Lift In-N-Out Windows gate when ready to show `content_type=window` for all restaurants

# Final Verdict

Local implementation complete per plan; production apply/deploy not attempted.
