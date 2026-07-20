# Objective

Clarify Menu Worksheet bulk price scope and ship related operator worksheet UX (wider fields, alt names, undo, 40% save warning, worksheet-only KB closed default).

# Current Status

**CPD COMPLETE** — FE feature `a6a68e0` / docs stamp `024eba8`; live bundle `index-CZl_kssF.js`; BE `8be95e70` on `main`.

# Files Changed

- `menubloc-frontend/src/components/menuEditor/MenuWorksheet.jsx`
- `menubloc-frontend/src/lib/menuWorksheetHelpers.js`
- `menubloc-frontend/src/pages/operator/OperatorMenuWorksheetPage.jsx`
- `menubloc-frontend/src/pages/operator/OperatorLayout.jsx`
- `menubloc-frontend/src/components/menuEditor/__tests__/MenuWorksheet.contract.test.js`
- `menubloc-backend/src/services/menus/menuWorksheetService.js`
- `menubloc-backend/test/menuWorksheetService.test.js`
- `docs/audits/2026-07-20_menu-worksheet-bulk-row-abc-ux.md`
- `docs/deployments/2026-07-20_menu-worksheet-bulk-row-abc-ux-cpd.md`

# Database Changes

None.

# Decisions Made

- **All rows** → %/$ apply to `menuply_price` for every item.
- **Row A/B/C** → %/$ apply to `price_a` / `price_b` / `price_c` for every item.
- Copy A/B/C → Menuply ignore scope (always write Menuply Price).
- Price alt names persist in `localStorage` keyed by restaurant+menu (no migration yet).
- KB auto-close on worksheet does not write sessionStorage; leaving worksheet restores preference.

# Remaining Work

1. Human verify on menuply.com operator worksheet.
2. Optional: DB columns for price alt labels.

# Risks / Known Issues

- Undo is session-local (lost on reload).
- 40% warning only compares Menuply Price vs load/save baseline (not private A/B/C).

# Verification Status

- FE MenuWorksheet contract: 12 pass (pre-commit)
- BE menuWorksheetService helpers: 8 pass
- Live bundle `index-CZl_kssF.js`; API scan Railway 59 / localhost 6
- Railway health 200 after BE push

# Resume Instructions

Human: open Menu Worksheet on production and confirm bulk dropdown + KB closed default.

# Git Status

- FE: `a6a68e0` (feature) + `024eba8` (docs stamp) on `feature/mds-homepage-controls` (pushed)
- BE: `8be95e70` on `main` (pushed)
