# Objective

Ship consumer stadium food discovery: hub → search-first inventory → item/vendor/location. No payment/ordering.

# Current Status

CODE READY in `menubloc-frontend-main`. Deploy via authorized FE path.

# Files Changed

- `src/pages/DestinationVenuePage.jsx` (new)
- `src/pages/DestinationVenueFoodPage.jsx`
- `src/lib/destinationVenueApi.js`
- `src/App.jsx`
- `test/destinationVenueFoodContract.test.js`
- Docs audit/handoff

# Database Changes

None.

# Decisions Made

- Hub at `/destination-venues/:slug`; inventory at `/food`
- Search via public API only (limit 60); client filters for section/price
- Category chips set API `q`
- Locations from API `locations` / `locations_available` only
- Order button disabled (“Coming soon”)

# Remaining Work

1. Commit/push `menubloc-frontend-main`
2. `npx vercel --prod --yes` + alias menuply.com/www + tip-gate
3. Human demo SoFi Tests A–D

# Risks / Known Issues

Tokyo Chicken may show two similar Plaza location labels (data, not FE duplication of menu).

# Verification Status

- `node test/destinationVenueFoodContract.test.js` PASS

# Resume Instructions

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
npx vercel --prod --yes
npx vercel alias set <url> menuply.com
npx vercel alias set <url> www.menuply.com
bash ../scripts/assert-menuply-production-tip.sh
```

Demo: https://menuply.com/destination-venues/sofi-stadium → Explore Food & Drink

# Git Status

Pending commit/deploy.
