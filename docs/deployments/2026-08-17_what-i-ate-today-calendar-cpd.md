# CPD — What I Ate calendar + restaurant tagging (2026-08-17)

## Summary

Shipped full **What I Ate** food diary with calendar, meal slots (breakfast–late night), dedicated pages, restaurant/menu-item tagging, and opted-in tagged entries on restaurant profiles.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `c1ebb7a` | clean after commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `4d1c15bc` | clean; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-592tioran-menuply.vercel.app`
- Bundle: `index-CZuz8q65.js`
- Aliases: `menuply.com`, `www.menuply.com`
- Tip-gate: **PASS** (apex + www)

## BE production

- Push: `origin/main` `cc0b3216..4d1c15bc`
- Railway `/health` `commit_hash`: `4d1c15bcd47de34271de8e25d8b71785a8153ec6` — **MATCH**

## Database

- `20260817_0267_what_i_ate_today_meal_period.sql` — applied production
- `20260817_0268_what_i_ate_today_restaurant_index.sql` — applied production

## Verification

```bash
curl -s "https://menuply.com/" | grep -o 'index-[A-Za-z0-9_-]*.js'
# index-CZuz8q65.js

curl -s "https://menubloc-backend-production.up.railway.app/health"
# commit_hash 4d1c15bc...

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```

Bundle API check: `menubloc-backend-production` 59 vs `localhost:3001` 9 (PASS).

## User-visible surfaces

- `/account/what-i-ate` — full-page calendar + meal-grouped diary
- `/account/connections/:peerId/what-i-ate` — Connection read-only diary
- Account Social/Profile/Wallet — link cards (no inline composer)
- Restaurant profile — **What diners logged here** (tagged + opted-in entries)
- Menu item detail — Add to What I Ate Today (unchanged)

## Rollback

- FE prior tip: `menubloc-frontend-lb1gjtgsw-menuply.vercel.app` / `index-CQT15_ja.js` (`392f5aa`)
- BE prior: `209fde97` / migration set through `0266` only

## Prior tip superseded

- `menubloc-frontend-lb1gjtgsw-menuply.vercel.app` / `index-CQT15_ja.js` — inline What I Ate + social tab (no calendar pages)
