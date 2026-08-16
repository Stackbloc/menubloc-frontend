# CPD — Waiter additive cluster updates (keep time-of-day meal picks)

**Date:** 2026-08-15  
**Scope:** FE + BE

| Field | Value |
|-------|-------|
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| FE commit | `2736d0c` |
| Tip | `menubloc-frontend-aae62r0rr-menuply.vercel.app` |
| Bundle | `index-CEl-scxL.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | PASS apex + www |
| BE path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` @ clean `main` |
| BE commit / health | `fc5deb53` |
| Path-gate | PASS before push |
| Exception | none |

## Feature

Cluster updates are additive. Core Waiter still uses meal-period chips + market-local default (`getDefaultMealPeriod`) and returns time-of-day meal ideas (`New for dinner` / breakfast / etc.).

## Verify

- Live briefing LA + `meal_period=dinner` → `New for dinner` items
- Live briefing LA + `meal_period=breakfast` → `New for breakfast` items
- Live bundle contains `Food picks for` / `plus updates from`
- FE/BE `waiterClusterReportContract` pass
- Railway `/health` starts with `fc5deb53`

## Restore

```bash
npx vercel alias set menubloc-frontend-aae62r0rr-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-aae62r0rr-menuply.vercel.app www.menuply.com
```
