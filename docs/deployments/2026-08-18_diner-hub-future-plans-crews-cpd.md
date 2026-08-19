# CPD — Diner hub Future Plans collapse + crews (2026-08-18)

## Summary

Future Plans is collapsed: viewers see **No Plans Scheduled** or clickable **Plans Scheduled**; the diner sees **Click to Schedule Future Plans** (calendar + form). Selected restaurant names are dark green. Empty meal photos say **Click to add photo of meal**. Connection hubs list that diner’s real crews with request-to-join. Empty restaurant-less plan cards are gone.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `ef9bb7a` | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `0976be42` | clean; path-gate **PASS**; pushed; Railway-live |

## FE tip

- Deployment: `menubloc-frontend-o8xa604sx-menuply.vercel.app`
- Bundle: `index-DZR4cTvb.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- Pushed `0976be42` to `origin/main` (no `railway up`)
- Railway `/health` `commit_hash` `0976be427a42e6ced2ec18058245fac81a81a4d5`
- Includes Join Me allow-list `a1b751c3` plus `GET /api/consumer/dining-crews/for-diner/:dinerId`

## Database

Migration `0273` (Join Me allow-list columns) is in git since `a1b751c3`. Apply status was not independently verified this CPD. Code still tolerates missing columns (`42703`).

## Prior tip (restore if needed)

- `menubloc-frontend-89eyeudh1-menuply.vercel.app` / `index-DjXskZ76.js` (Join Me allow-list `063ffd7`) — rolls back Future Plans collapse UI
- `menubloc-frontend-3vk7ie3cf-menuply.vercel.app` / `index-He0r-RTw.js` (Post X align `9cd7303`)

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-DZR4cTvb.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 0976be427a42e6ced2ec18058245fac81a81a4d5

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```

Hard-refresh https://menuply.com/my-menuply → Future plans should show **Click to Schedule Future Plans** (not the always-open editor). Pick a restaurant → name should be readable. Empty meal photo → **Click to add photo of meal**.
