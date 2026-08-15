# FE CPD — Detail action icons + Klaudette-style menu photos

**Date:** 2026-08-14  
**STATUS: COMPLETE** — tip-gate PASS apex + www

## Shipped

- Commit: `8b1fb4b` on `menubloc-frontend-main` @ `main` (clean)
- Detail: restaurant Like → Share → Invite → Comment; dish Comment after Invite
- Menu thumbs ~15% larger (search 83 / editorial 74 / cinematic 115×83)
- Fine + gallery defaults enable Klaudette-style left dish photo thumbs

## Deploy

- Path: `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main`
- `npx vercel --prod --yes` → `menubloc-frontend-ermw9wrlu-menuply.vercel.app`
- Alias: `menuply.com`, `www.menuply.com`, `crm.menuply.com` → ermw9wrlu
- Bundle: `index-V7CvAska.js`
- Tip-gate: PASS apex + www
- Bundle markers: `menu-item-detail-restaurant-actions`, `width:83`, railway=61 localhost=9
- `venues.menuply.com` alias: cert error (non-blocking for apex/www CPD)

## BE

Not required / not attempted (FE-only).

## Human smoke

- Klaudette Oxtails detail: restaurant Like/Share/Invite/Comment; dish Comment
- Public menu with photos: left thumbs on Classic/Fine when photos attached
