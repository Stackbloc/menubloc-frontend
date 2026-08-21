# CPD — My Menuply five-section + My Events (2026-08-21)

## Summary

Ship presentation-only My Menuply (five sections + editorial empties) with bottom-nav X creation including **My Events**, plus BE diner social-events API, expanded meal/intent periods, and home-feed advisory lock fix.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `8bd0892` | tip-gate PASS |
| BE | menubloc-backend-main | main | `c2c656b2` | health `c2c656b2` |

## Production tip

- Deployment: `menubloc-frontend-6sm7u9cwb-menuply.vercel.app`
- Bundle: `index-GXbrWt3V.js`
- Tip-gate: PASS apex + www
- Bundle smoke: railway 59 ≫ localhost 9

## Database

- Applied (targeted): `20260821_0282_eating_intent_meal_periods.sql`
- Applied (targeted): `20260821_0283_diner_social_events.sql`
- Via: `railway run --service menubloc-backend node scripts/applyOneMigration.js … --allow-production`

## Verify

1. Signed-in: `/my-menuply` shows What I'm Eating · What I Want to Eat · My Eating Plans · My Crews · My Events
2. Bottom-nav X → Create → **My Events** opens compose; save appears under My Events
3. Empty meal slots show editorial copy (no empty camera boxes)
4. `GET /api/consumer/social-events` returns `401 not_signed_in` when anonymous (route live)

## Rollback

Prior tip `menubloc-frontend-9acktyci6-menuply.vercel.app` / `index-lG7D8UuY.js` (`a37baf0`).  
BE: prior health `74a34f67` (docs-only LKG); feature rollback needs revert of `c2c656b2` + migration rollbacks if required.
