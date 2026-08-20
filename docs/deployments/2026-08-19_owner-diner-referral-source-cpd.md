# CPD — Owner diner referral source (2026-08-19)

## Summary

Owner `/owner/diners` shows **Referral source** per account (Direct, QR code, Website referral). New signups capture `signup_source` + external `referral_source` into `consumer_profiles` and `market_signup_log`.

## Deploy path

| Layer | Path | Branch | Commit |
|-------|------|--------|--------|
| BE | `menubloc-backend-main` | `main` | `49be028d` |
| FE | `menubloc-frontend-main` | `main` | `903f50e` |

- BE path-gate: **PASS** @ `49be028d`
- BE push: `origin/main`
- FE: `vercel --prod` → alias menuply.com + www + crm + venues

## Production verification

| Check | Result |
|-------|--------|
| FE tip | `menubloc-frontend-86va47zyv-menuply.vercel.app` / `index-iiZW0hGa.js` |
| Tip-gate apex + www | **PASS** |
| Railway `/health` `commit_hash` | **MATCH** `49be028d` |
| Bundle API probe | railway=60, localhost=9 |

## Human verify

1. https://menuply.com/owner/diners — **Referral source** column present; existing accounts show **Direct** (no historical attribution).
2. New signup from https://menuply.com/diner/signup → should label **Direct** unless external referrer.
3. New signup via `/connect/d/{token}` → should label **QR code**.

## Rollback

```bash
npx vercel alias set menubloc-frontend-9yjbhvqe2-menuply.vercel.app menuply.com
# (+ www, crm, venues)
```

Prior tip: `9yjbhvqe2` / `index-B4EE7_sD.js` (My Menuply presentation).
