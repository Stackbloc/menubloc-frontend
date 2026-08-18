# CPD — Post X align + Creators footer (2026-08-18)

## Summary

Shipped diner bottom nav **Home | Waiter | Menu Browser | X (Post) | Basket | My Menuply**, with public Activity on Waiter (`/activity` → `/waiter#activity`). This CPD also **aligns the X** on the icon row (hover **Post**) and replaces footer **Owner tools** with July **Creators** (`/creative-pros`). HomeNext unchanged. No diner Create Event. Backend unchanged.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `ea7eb4e` (nav restore `a9b7365`) | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `c662a20a` | clean; path-gate **PASS**; docs lock only |

## FE tip

- Deployment: `menubloc-frontend-lsmdx3d9x-menuply.vercel.app`
- Bundle: `index-C7QEDuzy.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- Bundle probe: `/creative-pros` ×3, `Owner tools` ×0, `Create Event` ×0, `My Menuply` ×17
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- Railway `/health` `commit_hash`: **MATCH** `c662a20af848e5d6b8183d0e5bb4b92133edb3dd`
- Path-gate: **PASS** on `menubloc-backend-main` @ `main` `c662a20a`

## Database

None this CPD. Migrations `0250`–`0270` already applied.

## Prior tip (restore if needed)

`menubloc-frontend-1vjhrbfcc-menuply.vercel.app` / `index-DUbMTrel.js` (nav restore before Post align)  
`menubloc-frontend-83npukyp6-menuply.vercel.app` / `index-KbRqQ3I0.js` (My Menuply hub)  
Git checkpoint: `menuply-last-known-good-2026-08-18` (pre–My Menuply IA)

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-C7QEDuzy.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# c662a20af848e5d6b8183d0e5bb4b92133edb3dd

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```
