# CPD — Eating plan video H.264 parity + Live Feed (2026-08-25)

## Summary

Shipped plan-media normalize (same Chrome-safe H.264 path as ate/want), Live Feed UNION for plan/want, category captions, and tap-video → poster profile. Migration `0289` applied on production.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `5e61477` | tip-gate PASS |
| BE | menubloc-backend-main | main | `a93a1fdc` | health MATCH |

## Production tip

- Deployment: `menubloc-frontend-59blc4cw6-menuply.vercel.app`
- Bundle: `index-oQ4ty48S.js`
- Tip-gate: PASS apex + www
- Prior tip: `7sggmug2z` / `index-Cy0j2zg7.js` (CSP media-src)

## Backend

- Migration `20260825_0289_eating_plan_media.sql` — Applied and tracked via `railway run` + `applyOneMigration.js`
- Railway health `commit_hash`: `a93a1fdc…`

## Verify

1. My Menuply → X → **My Eating Plans** → attach video → schedule → post
2. Confirm video plays (not black) on Chrome desktop
3. Live Feed shows **My Eating Plans** caption; tap video opens poster profile

## Rollback

Prior tip `menubloc-frontend-7sggmug2z-menuply.vercel.app` / `index-Cy0j2zg7.js`  
BE prior health `e25f020f` / `9d122dff` (pre–plan-media)
