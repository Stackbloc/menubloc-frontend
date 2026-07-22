# Summary

Replaced the amber `ProfileHeaderCard` food-truck chrome with an editorial shell (`FoodTruckPublicEditorial`) plus a dedicated **Where & when** panel for live location and upcoming stops. `/foodtrucks` route and `/restaurants` → `/foodtrucks` redirect preserved.

# Problem Statement

The restored dedicated food-truck profile used an outdated dark/amber card design. Product wanted the light editorial look with truck location/schedule features in a clearer open panel.

# Root Cause

Earlier CPD restored `ProfileHeaderCard` as the sole truck layout to recover schedule/location features after sales-demo editorial diversion.

# Changes Made

- New `FoodTruckPublicEditorial.jsx` + `WhereAndWhenPanel` (desktop sticky left; mobile collapsible)
- `FoodTruckPage.jsx` mounts editorial layout; keeps claim CTA, display-only notice, full menu, schedule link
- Contracts + Playwright updated

# Verification

- Contracts + local Playwright (pre-CPD)

# Final Verdict

Local implementation complete per plan. CPD after verification pass.
