# Objective

Clarify Menu Worksheet bulk price scope and ship related operator worksheet UX (wider fields, alt names, undo, 40% save warning, worksheet-only KB closed default).

# Current Status

**LOCAL COMPLETE** — contract tests pass; commit/deploy not done.

# Files Changed

- `menubloc-frontend/src/components/menuEditor/MenuWorksheet.jsx`
- `menubloc-frontend/src/lib/menuWorksheetHelpers.js`
- `menubloc-frontend/src/pages/operator/OperatorMenuWorksheetPage.jsx`
- `menubloc-frontend/src/pages/operator/OperatorLayout.jsx`
- `menubloc-frontend/src/components/menuEditor/__tests__/MenuWorksheet.contract.test.js`
- `menubloc-backend/src/services/menus/menuWorksheetService.js`
- `menubloc-backend/test/menuWorksheetService.test.js`
- `docs/audits/2026-07-20_menu-worksheet-bulk-row-abc-ux.md`

# Database Changes

None.

# Decisions Made

- **All rows** → %/$ apply to `menuply_price` for every item.
- **Row A/B/C** → %/$ apply to `price_a` / `price_b` / `price_c` for every item.
- Copy A/B/C → Menuply ignore scope (always write Menuply Price).
- Price alt names persist in `localStorage` keyed by restaurant+menu (no migration yet).
- KB auto-close on worksheet does not write sessionStorage; leaving worksheet restores preference.

# Remaining Work

1. User review in operator UI.
2. Commit when asked; CPD if requested.
3. Optional: DB columns for price alt labels.

# Risks / Known Issues

- Undo is session-local (lost on reload).
- 40% warning only compares Menuply Price vs load/save baseline (not private A/B/C).

# Verification Status

- FE MenuWorksheet contract: 12 pass
- BE menuWorksheetService helpers: 8 pass

# Resume Instructions

1. Open `/operator/restaurants/:id/menus/:menuId/worksheet`
2. Confirm bulk dropdown: All rows / Row A / Row B / Row C; no checkboxes
3. Confirm KB starts closed; side-panel icon reopens
4. If shipping: commit FE (+ BE helper parity) then CPD

# Git Status

Uncommitted local changes in FE + BE helper; do not CPD until user requests.
