# CPD — Menu share menuply.com lock (+ FT hours on tip)

**Date:** 2026-08-14  
**Path:** `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main`  
**Branch:** `main` @ `4fcfc2e` (clean at deploy; hours chronological WIP stashed)  
**Deployment:** `menubloc-frontend-23m1jryuz-menuply.vercel.app`  
**Bundle:** `index-BnAgsyO0.js`  
**Inspector:** https://vercel.com/menuply/menubloc-frontend/Gebxr4WFJt5ErDDhqw5MW1F2s37o

## Shipped

- Consumer share URLs locked to `https://menuply.com/...` (`normalizeConsumerShareUrl`, Copy Link primary)
- Food-truck menu pickup address + hours Today line (prior commits on tip: `b4d3738`, `de07795`)
- Audit: `docs/audits/2026-08-14_menu-share-google-url-regression.md`

## Alias

- `menuply.com` → tip ✅
- `www.menuply.com` → tip ✅
- `crm.menuply.com` → tip ✅
- `venues.menuply.com` → certificate generate failed (DNS/cert); apex/www are authoritative for this CPD

## Tip gate

```
bash scripts/assert-menuply-production-tip.sh https://menuply.com
# RESULT=PASS — tip healthy (menubloc-frontend-23m1jryuz-menuply.vercel.app / index-BnAgsyO0.js)
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```

API: railway=61 localhost=9 (railway >> localhost).

## Human verify

1. Hard-refresh a public menu on menuply.com  
2. Share → URL preview = `https://menuply.com/restaurants/.../menu`  
3. Copy Link → paste is menuply.com (not `share.google`)
