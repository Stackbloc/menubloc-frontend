# CPD — Future plans calendar events (2026-08-18)

## Summary

Future plans month view lives in the calendar icon beside **Future plans**. Each scheduled restaurant plan is a clickable `Restaurant [date]` event on that month sheet. The dead **Plans Scheduled** toggle is gone; the hub lists `Restaurant [date]` rows that expand to plan details (meal/notes, Join Me).

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `1e18d55` | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `06b8ff3f` | clean; no BE change this CPD |

## FE tip

- Deployment: `menubloc-frontend-4iy54g5qc-menuply.vercel.app`
- Bundle: `index-6H0iynJH.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- No push this CPD (FE-only)
- Railway `/health` `commit_hash` `06b8ff3f6addd93762d98fe7d773239ffe0aabd3`

## Database

None.

## Prior tip (restore if needed)

- `menubloc-frontend-o8xa604sx-menuply.vercel.app` / `index-DZR4cTvb.js` (Future Plans collapse `ef9bb7a`) — rolls back calendar events UI

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-6H0iynJH.js

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 06b8ff3f6addd93762d98fe7d773239ffe0aabd3
```

Hard-refresh https://menuply.com/my-menuply → **Future plans** should show the calendar icon always. Tap it → month grid plus clickable restaurant events. List rows should read `Restaurant [date]`, not **Plans Scheduled**.
