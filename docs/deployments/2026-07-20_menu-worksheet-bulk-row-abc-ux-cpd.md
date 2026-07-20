# 2026-07-20 CPD — Menu Worksheet bulk Row A/B/C UX

## Frontend
- Branch: `feature/mds-homepage-controls`
- Commit: `a6a68e0` — `feat(operator): Menu Worksheet bulk Row A/B/C and edit UX`
- Deploy: `https://menubloc-frontend-7itr0mc1s-menuply.vercel.app`
- Alias: `menuply.com` + `www.menuply.com` → that deployment
- Bundle: `index-CZl_kssF.js` (matches live)
- API scan: Railway 59 · localhost 6 (OK)

## Backend
- Branch: `main`
- Commit: `8be95e70` — `feat(menus): Menu Worksheet bulk ops target priceField A/B/C`
- Push: `origin/main` (Railway auto-deploy); `/health` → 200

## Shipped
- Bulk price scope: All rows / Row A / Row B / Row C (no selected-row checkboxes)
- Wider name + description columns; Price A/B/C alt-name labels (localStorage)
- Undo; >40% Menuply price save warnings
- Knowledge Base closed by default on operator worksheet routes only

## Verify (human)
- Operator → Menu Worksheet → open a menu worksheet
- Prices dropdown shows All rows / Row A / Row B / Row C; no checkboxes
- Increase % with Row A changes Price A only
- KB starts closed; side-panel icon reopens it
- Save with a Menuply price moved >40% shows red warning + confirm
