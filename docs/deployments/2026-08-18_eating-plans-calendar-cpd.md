# CPD — Eating plans calendar + restaurant next-week count (2026-08-18)

## Summary

Shipped **My Eating Plans** as a clickable day calendar: pick a restaurant, optional join seats, Invite Me under the section. Restaurant public profiles show **“[X] diners confirm plans to eat here in the next week.”** (singular: “1 diner confirms…”) when the count is > 0. Dining halls do not show it. Share and Settings stay on Account, not My Menuply. HomeNext and Waiter files were not changed.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `0d126d9` (also `2ca1062`, `872dd54`) | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `2923b248` | clean; path-gate **PASS** |

## FE tip

- Deployment: `menubloc-frontend-n7gxy1luu-menuply.vercel.app`
- Bundle: `index-DbN-zhDW.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- Bundle probe: `upcoming-plans` ×1, `eating-plans-calendar` ×1, `My Eating Plans` ×1
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- Shipped SHA: `2923b24873b448491a18255a9ff82d96d6f02973`
- Railway `/health` `commit_hash`: **MATCH**
- Path-gate: **PASS** on `menubloc-backend-main` @ `main` `2923b248`
- Public probe: `GET /public/food-activity/restaurants/1/upcoming-plans` → `{ ok: true, diner_count: 0, window_days: 7, line: null }`

## Database

```bash
CONFIRM_PRODUCTION_TARGET=true railway run --environment production -- \
  node scripts/applyOneMigration.js 20260818_0271_eating_plan_place_joinable.sql --allow-production
```

Applied and tracked: `20260818_0271_eating_plan_place_joinable.sql` (`what_we_doing_sessions.restaurant_id`, `place_label`, `joinable`, `join_capacity`). Production DB `sarfpagchmpychdrfgpj`.

## Prior tip (restore if needed)

`menubloc-frontend-lsmdx3d9x-menuply.vercel.app` / `index-C7QEDuzy.js` (Post-align Creators)  
Git: `menuply-last-known-good-2026-08-18`

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-DbN-zhDW.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 2923b24873b448491a18255a9ff82d96d6f02973

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```
