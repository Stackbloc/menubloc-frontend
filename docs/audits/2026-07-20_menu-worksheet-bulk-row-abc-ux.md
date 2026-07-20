# Summary

Operator Menu Worksheet UX: bulk price scope is now All rows / Row A / Row B / Row C (no selected-row checkboxes); wider name/description columns; Price A/B/C alt-name labels; Undo; >40% Menuply price save warnings; Knowledge Base closed by default only on worksheet routes.

# Problem Statement

Bulk prices offered “Selected rows” with no usable row selection. Operators also needed clearer Price A/B/C labeling, more room for names/descriptions, undo, large price-change confirmation, and KB closed by default on the worksheet only.

# Root Cause

Selection-based bulk scope shipped without a clear multi-select UX. Worksheet chrome reused global operator KB session preference.

# Evidence Collected

- `MenuWorksheet.jsx` had checkbox column + `scope === "selected"` but no obvious affordance beyond checkboxes.
- User clarification: dropdown should be All rows, Row A, Row B, Row C; bulk applies to that price field for every menu item.

# Files Examined

- `menubloc-frontend/src/components/menuEditor/MenuWorksheet.jsx`
- `menubloc-frontend/src/lib/menuWorksheetHelpers.js`
- `menubloc-frontend/src/pages/operator/OperatorMenuWorksheetPage.jsx`
- `menubloc-frontend/src/pages/operator/OperatorLayout.jsx`
- `menubloc-backend/src/services/menus/menuWorksheetService.js`

# Database Queries Executed

None.

# Changes Made

- Bulk scope → `all` (Menuply Price) | `row_a` | `row_b` | `row_c`; removed checkboxes.
- `applyBulkPriceOp` accepts `priceField`; Copy A/B/C → Menuply unchanged.
- Wider name/desc columns; alt-name inputs under Price A/B/C (localStorage).
- Undo stack; save confirms Menuply drifts >40% with red warning text.
- OperatorLayout: force KB closed on `/operator/menu-worksheet` and worksheet detail; restore session preference elsewhere without overwriting on auto-close.

# Commits

Not committed (await user request).

# Deployment Status

Local only — not deployed.

# Verification Results

- FE: `npx vitest run src/components/menuEditor/__tests__/MenuWorksheet.contract.test.js` — 12 pass
- BE: `node --test test/menuWorksheetService.test.js` — 8 pass

# Remaining Risks

- Price alt names are client localStorage only (not server-persisted).
- “All rows” targets Menuply Price; Row A/B/C target private price columns.

# Follow-Up Work

- Optional migration to persist price alt labels on `menu_worksheets`.
- Commit + CPD when requested.

# Final Verdict

Worksheet bulk-price UX matches the clarified All / Row A / B / C contract; related worksheet UX improvements landed locally and are covered by contract tests.
