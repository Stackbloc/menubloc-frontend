# 2026-08-14 CPD — Dated Today hours on all restaurant profiles

**Type:** Frontend CPD  
**Authorization:** User requested CPD  
**STATUS:** COMPLETE

## What shipped

- All public restaurant + food-truck profile heroes: dated Today heading (`Today, Friday, August 14, 2026:`) + chronological day ranges from tomorrow (`includeTodayLine: false`)
- Same formatting on invite restaurant hours + `ProfileRestaurantInfo`
- Timezone fallback: `profile.timezone || profile.restaurant_timezone`

## Deploy path

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| Branch | `main` |
| Commit | `d39fe13` |
| Deployment | `menubloc-frontend-p8hcw06bz-menuply.vercel.app` |
| Bundle | `index-BcI_7aKO.js` |
| Tip-gate | PASS |
| Exception | none |

## Aliases

- `menuply.com` → `menubloc-frontend-p8hcw06bz-menuply.vercel.app`
- `www.menuply.com` → same

## Bundle API check

- `menubloc-backend-production` = 61
- `localhost:3001` = 9 (acceptable)

## Contracts

- `formatHoursRowsConciseContract` ok
- `operatorPublicProfileContract` ok
- `restaurantProfileHomepageContract` ok

## Tip lock updated

- `scripts/assert-menuply-production-tip.sh`
- `.cursor/rules/frontend-production-deploy-path-guardrail.mdc`
