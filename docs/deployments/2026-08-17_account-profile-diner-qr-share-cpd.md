# CPD — Account Profile diner QR + Share My Menuply (2026-08-17)

## Summary

Shipped diner `/account` Profile tab items **My Diner QR** and **Share My Menuply** immediately after Profile information. Reuses existing `/account/diner-qr` and `/account/diner-qr?share=1` (ShareModal Copy Link). Social & Crew entries unchanged. Backend unchanged.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `da0bb15` | clean after feature commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | shipped `4a603a12` | not deployed this CPD |

## FE tip

- Deployment: `menubloc-frontend-1urgwayz1-menuply.vercel.app`
- Bundle: `index-FsvPkVHt.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## BE health

- Unchanged this CPD. Shipped SHA `4a603a12`; Railway `/health` `commit_hash` null (CLI archive).

## Prior tip (restore if needed)

`menubloc-frontend-nax94uq0u-menuply.vercel.app` / `index-DAjZPkYd.js`
