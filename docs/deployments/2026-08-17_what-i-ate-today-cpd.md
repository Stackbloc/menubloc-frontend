# CPD — What I Ate Today + social tab connections (2026-08-17)

## Summary

Shipped optional **What I Ate Today** identity-social profile log (manual food names always post; optional CK menu-item link; visibility default off). Also ships Social tab connection count + clickable Connections, venue event groups, and RSVP’d events. Menu-item detail **Add to What I Ate Today** sits below the action rail; sticky compact `VerdictBlock` unchanged.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `392f5aa` | clean after feature commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `209fde97` | clean; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-lb1gjtgsw-menuply.vercel.app`
- Bundle: `index-CQT15_ja.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: `What I Ate Today` ×6, `Add to What I Ate Today` ×1, `what-i-ate-today` ×11; Railway `59` vs `localhost:3001` `9`

## BE health

- Shipped SHA: `209fde97e641fa6f215cb9abe1a33b09da2e07a6`
- Railway `/health` `commit_hash`: **MATCH**
- Unauthenticated `GET /api/consumer/what-i-ate-today`: **401 Authentication required**
- Unauthenticated `GET /api/consumer/my/events`: **401 Authentication required**

## Database

- `CONFIRM_PRODUCTION_TARGET=true railway run --environment production -- node scripts/applyOneMigration.js 20260817_0266_what_i_ate_today.sql --allow-production` → Applied and tracked

## Prior tip (restore if needed)

`menubloc-frontend-3vre2srp8-menuply.vercel.app` / `index-DQKfgzho.js` (Add Menu contribution)

## Human verify

- Sign in → Account → Profile or Social → What I Ate Today: add manual food, toggle visibility
- Open a menu item → **Add to What I Ate Today**
- Social tab: connection count + Connections / Groups / Events sections
