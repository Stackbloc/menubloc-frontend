# CPD — Account dashboard four tabs (2026-08-17)

## Summary

Shipped the diner `/account` four-tab dashboard (Profile, Social & Crew, Wallet & Activity, Security & Account) over existing consumer APIs. Immediate preference saves; Share My Menuply opens existing ShareModal via `/account/diner-qr?share=1`. No new social, wallet, or deletion systems. Backend unchanged.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `2b0b024` | clean after commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `fc669272` | not deployed (no BE code change) |

## FE tip

- Deployment: `menubloc-frontend-kgtgek3l4-menuply.vercel.app`
- Bundle: `index-Br9O-thi.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: `Social & Crew`, `Wallet & Activity`, `Security & Account`; Railway `61` vs `localhost:3001` `9`

## BE health

- `commit_hash` starts with `fc669272` (unchanged)

## Prior tip (restore if needed)

`menubloc-frontend-iyxv62rs6-menuply.vercel.app` / `index-6JpzKw-R.js`
