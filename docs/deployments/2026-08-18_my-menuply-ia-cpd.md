# CPD — My Menuply diner hub + About/photos (2026-08-18)

## Summary

Shipped diner primary navigation (Home | Search | X | Activity | My Menuply) and **My Menuply** as the personal food-identity home: prominent profile photo (tap to change), short user-written About, dining photos from I'm Eating At / What I Ate Today, and connections eating/planning aggregators. Home discovery (`HomeNext`) and Waiter files were not changed. Settings stay at `/account`. Guest I'm Eating At remains open.

Pre-ship checkpoint: git tag `menuply-last-known-good-2026-08-18` (FE `0450a53` / BE `fb54f0b4`; tip `2fw9x27jj` / `index-fjLns99U.js`).

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `c550dfd` | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `03132162` | clean; path-gate **PASS** |

## FE tip

- Deployment: `menubloc-frontend-83npukyp6-menuply.vercel.app`
- Bundle: `index-KbRqQ3I0.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- Bundle probe: `My Menuply` ×3, `diner-about-input` ×1, `What My Connections Are Eating` ×1, `Add a dining photo` ×1; `Create Event` ×0
- API URLs: `menubloc-backend-production` 59 / `localhost:3001` 9

## BE health

- Shipped SHA: `03132162335e8a07d6cb33f6327077faffc97137`
- Railway `/health` `commit_hash`: **MATCH**
- Path-gate: **PASS** on `menubloc-backend-main` @ `main` `03132162`

## Database

```bash
CONFIRM_PRODUCTION_TARGET=true railway run --environment production -- \
  node scripts/applyOneMigration.js 20260818_0270_diner_about_me.sql --allow-production
```

Applied and tracked: `20260818_0270_diner_about_me.sql` (`consumer_profiles.diner_about`). Production DB `sarfpagchmpychdrfgpj`.

## Prior tip (restore if needed)

`menubloc-frontend-2fw9x27jj-menuply.vercel.app` / `index-fjLns99U.js` (dining-hall human copy)  
Git: `menuply-last-known-good-2026-08-18`

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-KbRqQ3I0.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 03132162335e8a07d6cb33f6327077faffc97137

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```
