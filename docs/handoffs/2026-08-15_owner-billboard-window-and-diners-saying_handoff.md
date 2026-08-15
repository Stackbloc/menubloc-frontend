# Objective

Ship owner billboard + window create APIs and consolidate restaurant profile social under What Diners Are Saying.

# Current Status

**LOCAL COMPLETE** — code in `menubloc-backend-main` + `menubloc-frontend-main`. Migration authored, not applied. Not committed/deployed.

# Files Changed

## Backend

- `sql/migrations/20260815_0249_billboard_content_type_window.sql`
- `sql/migrations/20260815_0249_billboard_content_type_window_rollback.sql`
- `src/services/restaurantBillboardService.js`
- `src/routes/ownerBillboards.js` (new)
- `src/routes/ownerMenuConsole.js` (mount)
- `test/ownerBillboardWindowContract.test.js` (new)

## Frontend

- `src/components/restaurant/WhatDinersAreSaying.jsx`
- `src/components/comments/FoodComments.jsx` (`hideTitle`, `embedded`)
- `test/whatDinersAreSayingContract.test.js`
- `test/foodDiscussionsContract.test.js`

## Docs

- `docs/audits/2026-08-15_owner-billboard-window-and-diners-saying.md`
- `docs/handoffs/2026-08-15_owner-billboard-window-and-diners-saying_handoff.md`

# Database Changes

Pending apply of `0249` (allow `content_type='window'`).

# Decisions Made

- Billboard = splash (`general`); Window = profile panel (`window`)
- API-only for owner billboard/window (no Profile Manager UI this turn)
- Keep In-N-Out public Windows gate
- Tips & discussion functionality kept; heading removed

# Remaining Work

1. Apply migration `0249` when authorized
2. Optional: Owner Profile Manager UI to call new APIs
3. Commit / CPD when Andre requests

# Risks / Known Issues

- Window inserts fail until migration applied
- Photo uploads use local billboard disk storage (same as operator)

# Verification Status

Contract tests authored; run in implement session.

# Resume Instructions

1. `cd menubloc-backend-main && node --test test/ownerBillboardWindowContract.test.js`
2. Apply `sql/migrations/20260815_0249_billboard_content_type_window.sql` when ready
3. Probe: `POST /api/owner/menu-console/restaurants/:id/billboards` and `.../windows` (owner session)
4. FE: confirm profile shows one What Diners Are Saying card with comments, no Tips & discussion title

# Git Status

Uncommitted local changes in authorized main worktrees at handoff time.
