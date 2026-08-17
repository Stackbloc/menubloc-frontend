# CPD — Guest open reporting (2026-08-17)

## Summary

Shipped first-class guest contributions for I'm Eating At and diner/venue operational reports. Temporary `guest_key` is not an account. Join Me and other identity social stay authenticated. Registration is offered only after a successful post. Product principle: **Anyone can contribute. Accounts unlock identity and social features.**

Also ships Join Me on I'm Eating At (`invite_kind=join_me`, migration `0264`).

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `81b9bdd` | clean after feature commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `a32d95dd` | clean; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-37tsmprgc-menuply.vercel.app`
- Bundle: `index-HPBXNwnC.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: `Anyone can contribute`, `No account needed`, `guest-contribute-next-step`, `menuply_guest_reporter_v1`; Railway `60` vs `localhost:3001` `9`

## BE health

- Shipped SHA: `a32d95dd8c4638b2a4ce77e9693d3755e07e4c8e`
- Railway `/health` `commit_hash`: **MATCH**
- GitHub auto-deploy SUCCESS (`9525e2d6-6572-4978-851e-300b533d728a`)
- Guest POST without key: `400 guest_session_required`
- Guest POST with key, no restaurant: `400 restaurant_required` (not 503)
- Join Me POST unauthenticated: `401 Authentication required`

## Database

- `CONFIRM_PRODUCTION_TARGET=true railway run --environment production -- applyOneMigration.js 20260817_0264_join_me_eating_at.sql --allow-production` → Applied and tracked
- `… 20260817_0265_guest_open_reporting.sql --allow-production` → Applied and tracked

## Prior tip (restore if needed)

`menubloc-frontend-1urgwayz1-menuply.vercel.app` / `index-FsvPkVHt.js`
