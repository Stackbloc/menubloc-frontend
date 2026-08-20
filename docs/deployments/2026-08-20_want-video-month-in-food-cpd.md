# CPD — Want video + restaurant-first links + Month in Food (2026-08-20)

## Summary

What I Want to Eat accepts **photo or video**, with restaurant + menu-item metadata. Place pickers are restaurant-first and rank by diner city. About Me calendar icon opens **My Month in Food**.

## Deploy path

| Layer | Path | Branch | Commit |
|-------|------|--------|--------|
| FE | `menubloc-frontend-main` | `main` | `2e67796` |
| BE | `menubloc-backend-main` | `main` | `f729764d` |

- BE path-gate: **PASS** @ `f729764d`
- BE push: `origin/main`
- FE: `vercel --prod` → alias menuply.com + www + crm + venues
- Migration `20260820_0279_diner_want_to_eat_video.sql` applied on production (`applyOneMigration` + `--allow-production`)

## Production verification

| Check | Result |
|-------|--------|
| FE tip | `menubloc-frontend-ip7mqupae-menuply.vercel.app` / `index-rdsNgKEW.js` |
| Tip-gate apex + www | **PASS** (after lock update) |
| Railway `/health` `commit_hash` | **MATCH** `f729764d` |
| Bundle API probe | railway=61, localhost=9 |

## Human verify

1. https://menuply.com/my-menuply — Want compose: camera photo or video; Restaurant chip before Homemade; pick a restaurant then a dish from that menu.
2. Link restaurant + menu item on a want; confirm the list shows restaurant name and plays video when uploaded.
3. About Me calendar icon (hover “My Month in Food”) → `/my-menuply/month-in-food`.

## Rollback

```bash
npx vercel alias set menubloc-frontend-gp1hon3it-menuply.vercel.app menuply.com
# (+ www, crm, venues)
```

Prior tip: `gp1hon3it` / `index-BshpJpXB.js` (Connects + Post about; BE `8c4b9391`). Want `video_url` column can remain; app ignores unused video.
