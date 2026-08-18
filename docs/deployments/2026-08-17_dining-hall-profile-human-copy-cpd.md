# CPD — Dining-hall profile human copy (2026-08-17)

## Summary

Shipped human dining-hall profile copy on production: removed campus-policy boilerplate, **Post what's good today** CTAs, **Share your thoughts** (replacing share a tip), no menu-item finder on halls, hide empty Founded. Applied verified `founded_year` for five campus halls via ops script (De Neve and EVK left blank).

Also on FE tip: `e6d085b` order-feedback menu-item picker (already on local main before this commit).

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `98687fd` | clean at `vercel --prod` |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `6fc782c3` | clean; path-gate **PASS** |

## FE tip

- Deployment: `menubloc-frontend-2fw9x27jj-menuply.vercel.app`
- Bundle: `index-fjLns99U.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www) after lock update
- Bundle probe: `Post what's good today` ×8, `Share your thoughts` ×2; absent: `Share a tip`, `No account needed`, `not claimable restaurant businesses`

## BE health

- Shipped SHA: `6fc782c3bd2d8b4258bf68492d8e6214fc146494`
- Railway `/health` `commit_hash`: **MATCH**
- No new migrations

## Database (ops script)

```bash
CONFIRM_PRODUCTION_TARGET=true railway run --environment production -- \
  node scripts/ops/setDiningHallFoundedYears.js --apply --allow-production
```

Applied `founded_year` for: Bruin Plate (2013), Epicuria at Covel (2021), FEAST at Rieber (2011), USC Village (2017), Parkside (2002).

Probe: `GET /restaurants/bruin-plate-los-angeles` → `founded_year: 2013`

## Prior tip (restore if needed)

`menubloc-frontend-74hi7bc73-menuply.vercel.app` / `index-B7aS-oSM.js` (Site Activity unique visitors)

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-fjLns99U.js

curl -s "https://menubloc-backend-production.up.railway.app/health" | grep commit_hash
# 6fc782c3bd2d8b4258bf68492d8e6214fc146494

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```
