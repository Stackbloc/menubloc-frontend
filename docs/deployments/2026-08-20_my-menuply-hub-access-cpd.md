# CPD — My Menuply hub access (2026-08-20)

## Summary

Ship My Menuply usability fixes: Month in Food share beside title, easier Account Settings, calendar day selection stays visible, RSVP events on the shared calendar + My Events calendar icon, past empty What I Ate shows “No entries” (no camera slots), and **My Diner QR** as the first Post about action for in-public access. Also includes prior `main` commits already on tip history (`688adf4` menu-item middleware; `9cfd336` Find Diners copy).

## Deploy path

| Layer | Path | Branch | Commit | Tree | Gate |
|-------|------|--------|--------|------|------|
| FE | `menubloc-frontend-main` | `main` | `5c82ea4` | clean at deploy | tip-gate PASS |
| BE | unchanged | — | live `9f997a6a` | — | health only |

## Production tip

- Deployment: `menubloc-frontend-k2hpeyh3s-menuply.vercel.app`
- Bundle: `index-DygwUgB7.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS apex + www

## Verify

1. Post about (X) → first row **My Diner QR** → `/account/diner-qr`
2. Month in Food → share icon next to title → Copy Link `https://menuply.com/...`
3. My Menuply → Settings gear / 👤 → `/account`
4. Upcoming Plans / My Events calendar → tap day stays selected until Done
5. Past empty What I Ate day → **No entries** (no empty cameras)
6. Menu-item URL still 200: `/restaurants/in-n-out-burger-3/menu-items/24862`

## Rollback

Restore prior tip `hzqhp15u6` / `index-DZq-yI_T.js` (connection food + YB scope).
