# CPD — Invite Me Out (2026-08-24)

## Summary

Ship **Invite Me Out**: diner chooses who can invite her out (Anyone Connect / select specific), eligible Connections pick a restaurant-linked want on the peer hub, then use the standard Invite to Eat date/time flow.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `2ca855a` | tip-gate PASS |
| BE | menubloc-backend-main | main | `19e27bb3` | health `19e27bb3`; path-gate PASS |

## Production tip

- Deployment: `menubloc-frontend-5qoxa42t4-menuply.vercel.app`
- Bundle: `index-B45apyHC.js`
- Tip-gate: PASS apex + www
- Bundle smoke: railway 59 ≫ localhost 9

## Database

- Applied: `20260824_0286_invite_me_out_audience.sql`
- Via: `CONFIRM_PRODUCTION_TARGET=true railway run --service menubloc-backend --environment production -- node scripts/applyOneMigration.js … --allow-production` → **Applied and tracked**

## Verify

1. My Menuply → What I Want to Eat → Open to Invite Me Out → Anyone Connect → Save
2. Connection peer hub shows **Invite Me Out** when peer has restaurant-linked wants
3. Pick want → date/time → Invitation Ready → share link

## Rollback

Prior tip `menubloc-frontend-89jj1mz2b-menuply.vercel.app` / `index-6lPa6XN2.js` (`ef4420d`).  
BE: prior health `d15c9260`; migration rollback `20260824_0286_invite_me_out_audience_rollback.sql` if required.
