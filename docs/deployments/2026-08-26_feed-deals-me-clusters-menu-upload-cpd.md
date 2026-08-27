# CPD — Feed location-scoped Deals + Me clusters/menu upload (2026-08-26)

## Summary

Feed chrome adds location-scoped **Deals** (`/deals?city=&state=` from Feed market). Me tab adds **Clusters** and **Upload menu photos** (`/menu-capture`). Primary nav unchanged.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `61946c9` | tip-gate PASS |
| BE | unchanged | main | `3f73106a` | health unchanged |

## Production tip

- Deployment: `menubloc-frontend-ipnr8htpu-menuply.vercel.app`
- Bundle: `index-C1TASeKC.js`
- Tip-gate: **PASS** apex + www
- Prior tip (rollback): `3dbymospp` / `index-DRXhbBkl.js`

## Verify

1. https://menuply.com/feed — chrome shows **Deals** (left) and **Search** (right)
2. Deals opens with Feed market city/state in the URL
3. Me → Clusters → `/clusters`; Me → Upload menu photos → `/menu-capture`
4. Bottom nav still FEED | EATING | X | EVENTS | ME (no Deals/Clusters/upload tabs)

## Rollback

```bash
npx vercel alias set menubloc-frontend-3dbymospp-menuply.vercel.app menuply.com
# + www/crm/venues; lock tip-gate to index-DRXhbBkl.js
```
