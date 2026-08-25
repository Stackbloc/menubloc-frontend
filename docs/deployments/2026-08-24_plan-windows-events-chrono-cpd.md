# CPD — Plan windows ~4× + My Events chronological (2026-08-24)

## Summary

Shipped larger My Eating Plans restaurant placement windows (~4×) and upcoming-first My Events sort; locked tip to live apex after interrupted FE deploy/alias work.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `e25acc5` (includes `3f811b9` plan windows) | tip-gate PASS |
| BE | menubloc-backend-main | main | `c368ab73` (includes `b4c8fdd4` events chrono) | health match |

## Production tip

- Deployment: `menubloc-frontend-2q95zr9z7-menuply.vercel.app`
- Bundle: `index-Bc6lB1Ap.js`
- Tip-gate: PASS apex + www
- Bundle smoke: railway 59 ≫ localhost 9

## Backend health

- `commit_hash`: `c368ab73`
- Path-gate: PASS on `menubloc-backend-main` @ clean `main`

## Verify

1. My Menuply → My Eating Plans: logo/billboard window ~192px when restaurant has imagery
2. My Events: soonest upcoming first (past after)
3. Hard refresh if tip cache stale

## Rollback

Prior tip `7ni0ufwgq` / `index-pTqskGtu.js` (only if Andre names that tip)
