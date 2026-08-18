# CPD — Dish prefill + Post about + What I'm Eating merge (2026-08-18)

## Summary

I'm Eating At prefills **restaurant name and dish**. Bottom-nav X sheet is **Post about**. My Eating Plans is merged into **What I'm Eating** (compose first; tag restaurant/dish/join after). Backend `PATCH /api/consumer/what-we-doing/:tokenOrId` tags place/joinable after a simple future post.

HomeNext layout was not changed except the shared BottomNav X size (28px). Waiter files were not modified.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `8a1a961` | clean at second `vercel --prod` (concurrent Owner Diners dirt stashed) |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `4695ba64` | clean; path-gate **PASS**; first GitHub auto-deploy **FAILED** (empty runtime logs after image push); `railway deployment redeploy --environment production --from-source` → **SUCCESS** |

## FE tip (live at wrap — do not re-alias)

Shipped this feature as `8a1a961` → `psmauf4vh` / `index-WZh2e4sk.js`. A concurrent owner diner-accounts `--prod` then became the live alias. **Stop fighting that alias.**

- Live deployment: `menubloc-frontend-5vl6kfuh6-menuply.vercel.app`
- Live bundle: `index-BZBfCuwA.js` (commit `12945f5`, ancestor includes `8a1a961`)
- Feature still in live JS: `Post about`, `im-eating-selected-dish`, `post-after-actions`; no `Do something` / `My Eating Plans`
- Prior dish-only tip (do not restore unless rolling back diner accounts): `psmauf4vh` / `index-WZh2e4sk.js`

## BE health (live at wrap)

- Feature SHA: `4695ba645b1f17ea2a48503d816d758f4fc8dc5f` (PATCH `updateSessionDetails`)
- Live Railway `/health` `commit_hash`: `942e7c10d62a2ca1f21a21101d9ce8a928164d76` (ancestor includes `4695ba64`)
- Path-gate: **PASS** on `menubloc-backend-main` @ `main` at ship time
- First GitHub auto-deploy of `4695ba64` **FAILED**; `railway deployment redeploy --from-source` then **SUCCESS**; later diner-accounts SHA is now live

## Database

No new migration. Uses `0271` (`restaurant_id`, `place_label`, `joinable`, `join_capacity`).

## Prior tip (restore if needed)

`menubloc-frontend-n7gxy1luu-menuply.vercel.app` / `index-DbN-zhDW.js` (eating-plans calendar)  
Git: `menuply-last-known-good-2026-08-18`

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-BZBfCuwA.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 942e7c10d62a2ca1f21a21101d9ce8a928164d76

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS (locked to BZBfCuwA / 5vl6kfuh6)
```

## Notes

Do **not** re-alias `psmauf4vh` onto menuply.com. Dish prefill is live inside the diner-accounts tip. Owner diner accounts (`12945f5` / `942e7c10`) overran this CPD and is now LKG.
