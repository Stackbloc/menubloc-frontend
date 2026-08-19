# CPD — Post X bottom-nav align (2026-08-18)

## Summary

Dropped the bottom-nav Post **X** onto the same optical row as Home, Waiter, Basket, and My Menuply. The logo crop filled a 28px box to the corners, so the mark sat high. Live change: `translateY(6px)` + `MenuplyXMark` size 24. No backend deploy.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `9cd7303` | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | not shipped | no BE change; `/health` still `942e7c10` |

## FE tip

- Deployment: `menubloc-frontend-3vk7ie3cf-menuply.vercel.app`
- Bundle: `index-He0r-RTw.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- Bundle probe: `translateY(6px)` ×1
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- Not deployed this CPD
- Railway `/health` `commit_hash`: `942e7c10d62a2ca1f21a21101d9ce8a928164d76` (unchanged)
- `970062ac` remains on `origin/main`, not Railway-live

## Database

None.

## Prior tip (restore if needed)

`menubloc-frontend-683cf6yk3-menuply.vercel.app` / `index-CZS4phIY.js` (My Menuply hub `e7c319b`)

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-He0r-RTw.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 942e7c10d62a2ca1f21a21101d9ce8a928164d76

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```

Hard-refresh https://menuply.com/my-menuply and confirm the X sits on the icon row.
