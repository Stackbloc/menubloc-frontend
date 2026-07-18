# Objective

Retire operator Menu Design into Menu Lab and add an explicit return to operator home.

# Current Status

**CPD COMPLETE** — FE `1341efa` / bundle `index-D6V7N289.js` on menuply.com; BE `9a87d596` on Railway.

# Files Changed

- `menubloc-frontend/src/pages/operator/OperatorLayout.jsx` — remove Menu Design nav item
- `menubloc-frontend/src/App.jsx` — `/operator/menudesign` → Navigate to `/operator/menulab`; drop unused `MenuDesignLabPage` import
- `menubloc-frontend/src/pages/operator/OperatorMenuEditor.jsx` — **← Operator Home** on MenuLabPanel
- `menubloc-frontend/test/menuLabMenuDesignConsolidationContract.test.js` — contract

# Database Changes

None.

# Decisions Made

- Nav + route consolidation only (Step 2 of Menu Lab simplification).
- Public `/menu-design-lab` / `/menu-themes` kept for demos.
- Adobe Studio / Menu Studio / Display Board unchanged.

# Remaining Work

- CPD when user approves
- Human verify: sidebar has no Menu Design; `/operator/menudesign` lands on Menu Lab; Operator Home returns to `/operator`

# Risks / Known Issues

- `MenuDesignLabPage.jsx` still exists for public lab routes; do not delete without a separate pass

# Verification Status

- `node --test test/menuLabMenuDesignConsolidationContract.test.js` → pass
- `operatorMerchantAccountContract` → pass (layout still loads)

# Resume Instructions

1. Local smoke on Menu Lab
2. CPD FE when asked

# Git Status

Uncommitted FE changes (do not commit unless asked).
