# 2026-07-20 CPD — Menu Worksheet undo/redo

## Frontend
- Branch: `feature/mds-homepage-controls`
- Commit: `d0fb756` — `fix(operator): Menu Worksheet undo whole cell edits and add redo`
- Deploy: `https://menubloc-frontend-oxpk7m8m3-menuply.vercel.app`
- Alias: `menuply.com` + `www.menuply.com` → that deployment
- Bundle: `index-G8lMQPBC.js` (matches live)
- API scan: Railway 59 · localhost 6 (OK)

## Backend
- No BE change

## Shipped
- Undo coalesces keystrokes per cell (full prior value in one step)
- Redo with ↶ / ↷ controls

## Verify (human)
- Edit a price cell fully → ↶ restores previous full number (not one digit)
- ↷ re-applies the edit
