# CPD — Video-first parallel `/feed` shell (2026-08-26)

## Summary

Shipped parallel consumer Feed at `/feed` (FEED | EATING | EVENTS | ME) with national video ranking on BE; HomeNext remains `/`. Guest Feed API unblocked by mounting see-whos-eating before profile auth.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `2028140` | tip-gate PASS |
| BE | menubloc-backend-main | main | `8f533369` (national rank `fa07f2b3` + guest mount hotfix) | health match |
| DB | migration `0291` | — | applied via `railway run psql` | want `market_discoverable` |

## Production tip

- Deployment: `menubloc-frontend-6uj8rufl4-menuply.vercel.app`
- Bundle: `index-COekEjGi.js`
- Tip-gate: **PASS** apex + www
- Prior tip (rollback): `j2n2mx1ka` / `index-67tDDIer.js`
- LKG tag (pre-ship): `menuply-pre-video-first-consumer-2026-08-26` (local; push when authorized)

## Verify

1. https://menuply.com/feed — immediate video shell + primary nav
2. Guest API: `GET /api/consumer/see-whos-eating?city=Los%20Angeles&state=CA` → `ok:true`, `guest:true`, `ranking:local_then_national`
3. Guest API without market → `ranking:national` (not empty)
4. Drawer → “Feed (preview)”
5. `/` still HomeNext (`VITE_FEED_AS_HOME` off)

## Rollback

```bash
npx vercel alias set menubloc-frontend-j2n2mx1ka-menuply.vercel.app menuply.com
# + www/crm/venues; tip-gate lock to that tip
```

BE rollback: redeploy prior SHA `14a98b5c` only if needed (national ranking + guest mount are additive fixes).
