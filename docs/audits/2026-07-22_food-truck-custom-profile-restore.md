# Summary

Restored dedicated custom food-truck profile (`ProfileHeaderCard`) for all food trucks, including sales demos. `/restaurants/:slug` now redirects `food_truck` listings to `/foodtrucks/:slug`. Address duplication in restaurant editorial details remains fixed. E2E Playwright against local Vite + production API: **3/3 passed**. CPD not run (await user).

# Problem Statement

1. Editorial public profile repeated street/city under the name and again in “Restaurant details.”
2. Sales-demo / restaurant URLs rendered restaurant editorial for food trucks, hiding truck-specific location/schedule chrome. Local WIP had begun forcing editorial on `/foodtrucks` for `full_claimable` as well.

# Root Cause

- Address: `RestaurantPublicEditorial` showed address in `IdentityBlock` and again as details Address row.
- Profile diversion: `full_claimable` demos used editorial on `/restaurants/...`. Uncommitted `FullClaimableFoodTruckProfile` would have done the same on `/foodtrucks/...`.

# Evidence Collected

- Live Bachi `78175`: `restaurant_type=food_truck`, `public_profile_mode=full_claimable`, `public_ordering_mode=display_only`
- API: profile/menu/search PASS
- Playwright local: profile chrome + claim CTA; restaurants→foodtrucks redirect; schedule link

# Files Examined / Changed

- Restored `FoodTruckPage.jsx` to committed `ProfileHeaderCard` path (removed editorial diversion WIP)
- `RestaurantPublicPage.jsx`: `isFoodTruckListing` + `Navigate` to `/foodtrucks/:slug`
- `RestaurantPublicEditorial.jsx`: dropped duplicate Address details row
- `test/claimableSalesDemoContract.test.js`: assert custom profile + redirect
- `tests/playwright/food-truck-custom-profile.spec.js` + `playwright.local-foodtruck.config.js`

# Database Queries Executed

None mutating. Read-only public API probes.

# Commits

Not committed — E2E complete; awaiting CPD request.

# Deployment Status

Local only.

# Verification Results

- Contract: claimableSalesDemo + foodTruckDemoDisplayOnly + menuProfileLink — **8 pass**
- API: Bachi profile/menu/search — **PASS**
- Playwright (`playwright.local-foodtruck.config.js`): **3 passed** (19.5s)

# Remaining Risks

- Production menuply.com still serves pre-redirect bundle until FE CPD
- Bachi schedule/live-location data may be empty until operator/seed populates stops

# Follow-Up Work

1. User CPD (commit + Vercel prod + alias)
2. Optional: seed schedule/live location for Bachi demo polish

# Final Verdict

**Ready for CPD.** Custom food-truck profile verified end-to-end locally for Bachi.
