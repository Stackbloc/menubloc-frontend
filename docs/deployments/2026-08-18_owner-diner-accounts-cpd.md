# CPD — Owner diner accounts roster (2026-08-18)

## Summary

Shipped the owner console **Diner accounts** page at `/owner/diners`: lifetime consumer accounts with name, email, opened/closed dates, geographic market, status, and total/active/pending/closed counts. Dashboard Growth section links **View all diner accounts**. This is the work requested 2026-08-17 that had never been built.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `12945f5` | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `942e7c10` | clean; path-gate **PASS** |

## FE tip

- Deployment: `menubloc-frontend-5vl6kfuh6-menuply.vercel.app`
- Bundle: `index-BZBfCuwA.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- Bundle probe: `/owner/diners` ×3, `Diner accounts` ×3, `Total diners` ×1, `Account opened` ×2
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- Shipped SHA: `942e7c10d62a2ca1f21a21101d9ce8a928164d76`
- Railway `/health` `commit_hash`: **MATCH**
- Path-gate: **PASS** on `menubloc-backend-main` @ `main` `942e7c10`
- Route: `GET /api/owner/dashboard/diners` (owner session)

## Database

None. Read-only `consumer_users` + `consumer_profiles` + `market_signup_log`. Live counts at ship: 46 total, 30 active, 16 pending phone verification, 0 closed.

## Prior tip (restore if needed)

`menubloc-frontend-psmauf4vh-menuply.vercel.app` / `index-WZh2e4sk.js` (dish prefill + Post about)  
Git: `menuply-last-known-good-2026-08-18`

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-BZBfCuwA.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 942e7c10d62a2ca1f21a21101d9ce8a928164d76

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```

Sign in at https://menuply.com/owner/diners (owner console).
