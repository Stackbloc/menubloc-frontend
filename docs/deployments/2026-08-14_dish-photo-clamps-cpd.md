# FE CPD — Dish photo clamps (info / sheets / search / design slots)

**Date:** 2026-08-14  
**STATUS: COMPLETE** — tip-gate PASS apex + www

## Shipped

- Commit: `38157df` on `menubloc-frontend-main` @ `main`
- Message: Clamp dish photos on info, sheets, search, and design slots.
- `MenuItemInfoPage`: compact sticky-hero thumb (101/129) — removed unbounded `minHeight` blow-ups
- Public + catalog item sheets: 4:3 clamped dish photo when URL present
- `SearchResultCard` + MenuDesign hero/section imgs: `maxWidth`/`maxHeight` cover clamp
- Shared: `src/lib/dishPhotoDisplay.js`
- Contract: `test/menuItemPhotoDisplayContract.test.js` (8 passing)

## Deploy

- Path: `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main`
- Branch: `main` @ `38157df` (clean for ship)
- `npx vercel --prod --yes` → `menubloc-frontend-gbli18jhr-menuply.vercel.app`
- Alias: `menuply.com`, `www.menuply.com`, `crm.menuply.com` → gbli18jhr
- Bundle: `index-BYCUQwwR.js`
- Tip-gate: PASS (`LOCKED_DEPLOY=menubloc-frontend-gbli18jhr-menuply.vercel.app` / `index-BYCUQwwR.js`)
- Bundle markers: railway=61 localhost=9
- `venues.menuply.com`: not re-aliased this turn (prior cert issues)

## BE

Not required / not attempted (FE-only).

## Human smoke

1. Klaudette public menu — thumbs stay in row; name/price on card
2. Menu item detail + info — compact hero thumb, no full-bleed overflow
3. Tap item sheet on menu — photo (if any) 4:3 clamped
4. Search results with dish photo — 83×83 thumb clamped
