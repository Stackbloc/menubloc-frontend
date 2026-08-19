# CPD — Diner hub systemwide parity (2026-08-19)

## Summary

Connection peer hubs (e.g. Joe Johnson at `/account/connections/:peerId`) now use the same eating-feed merge and want-list rendering as My Menuply. Added guardrail so future social/diner-hub changes must update owner + peer together.

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `139263a` |
| Deployment | `menubloc-frontend-o91cxjxfw-menuply.vercel.app` |
| Bundle | `index-B1Y0hVDJ.js` |
| Tip gate | PASS (apex + www) |
| Change | `mergeEatingFeedForHub` on peer page; shared `WantToEatList`; hub mappers in `eatingFeedMerge.js` |
| Guardrail | `docs/guardrails/2026-08-19_diner-hub-systemwide-parity-contract.md` |

## Backend

Not deployed. Incomplete eating-video migration `0277` remains local only.

## Tests

- `npm run test:food-social-contract` — 31/31 PASS

## Human verify

1. Sign in → My Menuply → confirm eating photos + want list unchanged
2. Open a Connection peer hub (Joe Johnson) → same photo grid style and want cards for visible data
3. Peer hub has no compose boxes (read-only)

## Rollback

Prior tip: `c7nyeh8xt` / `index-gxB9JJHj.js` @ menu-item save + icon
