# CPD — Diner QR invite connect + PNG branding (2026-08-16)

## Summary

Shipped invitation-style personal connect landing and personal QR PNG without Menuply center logo (optional selfie + First L. strip). Meet Me Here remains the restaurant/lunch proposal path.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `d9d58fa` | clean after commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `4178e1e1` | clean; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-aj3cufw78-menuply.vercel.app`
- Bundle: `index-B2nAFBvm.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## BE health

- `commit_hash` `4178e1e1098122484ddeee7825838473284d1377`

## Verification

- Live bundle contains `has invited you to connect on Menuply`
- `/d/{token}/image` HTTP 200; decoded payload `https://menuply.com/d/{token}`
- Path gate PASS before BE push

## Prior tip (restore if needed)

`menubloc-frontend-pvekgpaay-menuply.vercel.app` / `index-DOGT2NT-.js`
