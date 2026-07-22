# Summary

Food truck public profile is personality-first: no inline menu; View menu / Like / Share / Save contact icon rail; Current Location (maps-linked); Hours; Bio / About / Featured / Today's special / Upcoming. Hero photo display-only. Public API attaches `operating_hours`.

# Problem Statement

Profile still behaved like a menu dump (cuisine twice, full menu on page). Product wants a personality page that goes above and beyond the menu.

# Changes Made

- `FoodTruckPublicEditorial.jsx` — personality layout
- `FoodTruckPage.jsx` — removed MenuInline / menu fetch; wired menuHref + story props
- `publicRestaurant.js` — attach `operating_hours` (optional, non-fatal)
- Contracts + Playwright

# Final Verdict

Local verified: contracts 6/6, Playwright desktop 3/3. Backend `operating_hours` attach is in `publicRestaurant.js` — needs backend deploy before hours populate in production. Ready for CPD after approval.
