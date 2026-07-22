# Upload Detail — Click-to-Edit Parsed Item Fields (CPD)

Date: 2026-07-22  
Branch: `feature/mds-homepage-controls`  
Commit: `a4a469f` — feat(menu-manager): click-to-edit Name/Section/Price on Upload Detail  
Deployment: `https://menubloc-frontend-fatxep5an-menuply.vercel.app` (`dpl_9HNvCmWQySapxeX4x1SAGmauBNxg`)  
Alias: `menuply.com` → `menubloc-frontend-fatxep5an-menuply.vercel.app`  
Bundle: `index-CTItvi9Z.js`

## Purpose

On Upload Detail Parsed Menu Items, operators edit Name / Section / Price by
clicking the field itself. The idle-row **Edit** button is removed. Save /
Cancel remain while a row is being edited.

## Behavior

1. Click Name, Section, or Price on a **promoted** row → row enters edit mode
2. Focus lands on the clicked field (`editingFocus`)
3. Save → `updateUploadItem` (unchanged API); Cancel exits without saving
4. Held (`review`) rows stay non-clickable in this table

## Files

- `src/pages/owner/OwnerMenuUploadDetail.jsx` — `ParsedItemsSection` click-to-edit
- `test/ocrEditSplitPaneContract.test.js` — contract for click-to-edit / no idle Edit

## Verification

- `npx vitest run test/ocrEditSplitPaneContract.test.js` — 8 passed
- `menuply.com` bundle: `index-CTItvi9Z.js` (matches Vite build)
- Bundle API scan: `menubloc-backend-production` ×60, `localhost:3001` ×6 (≤6 OK)
- Human: open Upload Detail → click a price cell → Save/Cancel *(await user)*

## Guardrails

- No Waiter / Operator Login / Home / menu-experience protected files
- No backend / `updateUploadItem` contract change
- Unrelated local working-tree changes were **not** included in this commit
