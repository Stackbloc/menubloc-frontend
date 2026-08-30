# CPD — Restaurant dining intent (People who want to go) (2026-08-30)

## Summary

Ship **I want to go** / **People who want to go** on restaurant profiles with public dining-intent reads and consumer create/remove APIs (migration `0300`).

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `295bb2f` (feature) · lock `b857186` | tip-gate PASS |
| BE | menubloc-backend-main | main | `eab0c83f` | health + smoke PASS |

## Production tip

- Deployment: `menubloc-frontend-3ugf2v8tc-menuply.vercel.app`
- Bundle: `index-qWHETNcw.js`
- Tip-gate: PASS apex + www
- Bundle API: `menubloc-backend-production` 59 · `localhost:3001` 9

## Verify

1. Open any restaurant profile on [menuply.com](https://menuply.com) — **People who want to go** section + **I want to go** CTA.
2. `GET /api/public/restaurants/:id/dining-intent` → 200.
3. BE smoke: `bash scripts/assert-backend-production-smoke.sh` → `RESULT=PASS`.

## Rollback

Prior tip `menubloc-frontend-r8cum35v9-menuply.vercel.app` / `index-au42pzZT.js` (pre–dining-intent; feed share + account invite).
