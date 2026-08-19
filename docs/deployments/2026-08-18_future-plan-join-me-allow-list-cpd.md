# CPD — Future plan Join Me allow-list (2026-08-18)

## Summary

A future plan is visible only to people who can accept that Join Me: **Anyone Connect**, or a **selected** list of Connections plus pending Invite-to-Eat account holders. Ineligible diners do not see the plan (hub, connections planning, or direct URL). Eating history calendar is today+past; future-plans calendar is today+future. Restaurant is required on the plan form.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `063ffd7` | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `a1b751c3` | clean; path-gate **PASS**; pushed; **not Railway-live** |

## FE tip

- Deployment: `menubloc-frontend-89eyeudh1-menuply.vercel.app`
- Bundle: `index-DjXskZ76.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- Pushed `a1b751c3` to `origin/main` (no `railway up`)
- Railway `/health` `commit_hash` still `970062ac408c03559c8d5e2cf672c1f96537b968`
- Join Me allow-list API + migration `0273` wait until health is `a1b751c3`

## Database

Migration `20260818_0273_plan_join_audience.sql` is in the BE commit. **Not applied** while Railway health is `970062ac`. Code tolerates missing columns (`42703`) until then.

## Prior tip (restore if needed)

- `menubloc-frontend-3vk7ie3cf-menuply.vercel.app` / `index-He0r-RTw.js` (Post X align `9cd7303`) — rolls back Join Me UI
- `menubloc-frontend-bzddqa61v-menuply.vercel.app` / `index-DF-s_Lo_.js` (diner-hub photos `a7eb57d`) — was live, never LKG-locked

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-DjXskZ76.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 970062ac408c03559c8d5e2cf672c1f96537b968

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```

Hard-refresh https://menuply.com/my-menuply → Future plans → Open to Join Me → Anyone Connect / Select specific (Connections + pending Invites).
