# CPD — Diner Card promo redesign (2026-08-16)

## Summary

Shipped promo-style Personal Diner QR card (green X lockup, framed QR, selfie + screen name, **SCAN TO CONNECT ON MENUPLY**). Tip also includes prior `/d/:token` SPA ownership (`44cae88`) so phone scans get Menuply HTML instead of a Railway proxy. BE not redeployed.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `0ed0a8a` | clean after commit |
| BE | — | — | not attempted | — |

## FE tip

- Deployment: `menubloc-frontend-pvekgpaay-menuply.vercel.app`
- Bundle: `index-DOGT2NT-.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## BE health

- Unchanged this CPD: `commit_hash` `397f71e3b6b7c2e702fc395d19b400242faa99fa`

## Files

- `src/pages/consumer/DinerQrPage.jsx`
- `public/menuply-qr-logo-x.svg`
- `test/dinerQrPhase1Contract.test.js`
- (ancestor) `44cae88` — `DinerQrScanRedirectPage.jsx`, `vercel.json` `/d` rewrite removal, `resolveDinerQrScan`

## Verification

- Live bundle contains `SCAN TO CONNECT ON MENUPLY` (count ≥ 1)
- `https://menuply.com/d/{token}` → `text/html` (SPA), not Railway JSON/502
- `/account/diner-qr` shows promo card chrome after hard refresh

## Prior tip (restore if needed)

`menubloc-frontend-c07vv7d3s-menuply.vercel.app` / `index-BUPZP4ci.js` (About + diner signup copy)
