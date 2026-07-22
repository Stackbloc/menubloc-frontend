# Upload Detail — Click-to-Edit Parsed Item Fields (CPD)

Date: 2026-07-22  
Branch: `feature/mds-homepage-controls`  
Commit: *(filled after commit)*  
Deployment: *(filled after vercel --prod)*  
Alias: `menuply.com` → *(filled after alias set)*

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

- `npx vitest run test/ocrEditSplitPaneContract.test.js` — pass
- Bundle hash on `menuply.com` matches deploy
- API base in bundle: `menubloc-backend-production` dominant
- Human: open Upload Detail → click a price cell → Save/Cancel

## Guardrails

- No Waiter / Operator Login / Home / menu-experience protected files
- No backend / `updateUploadItem` contract change
