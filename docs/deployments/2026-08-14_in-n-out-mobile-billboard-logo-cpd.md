# FE CPD — In-N-Out mobile billboard logo centering

**Date:** 2026-08-14  
**STATUS: COMPLETE** — tip-gate PASS apex + www

## Shipped

- Commit: `7b028e3` on `menubloc-frontend-main` @ `main` (clean)
- Narrow viewports swap `in-n-out-building.jpg` → portrait `in-n-out-building-splash.jpg` on entrance splash, profile hero, and Windows

## Deploy path note

Local `main` had 9 unpushed Social Engine commits (incl. Waiter Phase 8). Those were **not** CPD’d. Preserved on `backup/social-phases-ahead`. CPD used `origin/main` + billboard-only cherry-pick.

## Deploy

- Path: `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main`
- `npx vercel --prod --yes` → `menubloc-frontend-5cd91e4s5-menuply.vercel.app`
- Alias: `menuply.com`, `www.menuply.com`, `crm.menuply.com`
- Bundle: `index-Cs95NUwq.js`
- Tip-gate: PASS apex + www
- Bundle marker: `in-n-out-building-splash` present; railway=61 localhost=9

## BE

Not attempted.

## Human smoke

- Soft-reload In-N-Out profile on phone: entrance + hero neon logo centered
- Desktop landscape storefront unchanged
