# Summary

Restaurant signup entry (`/restaurant/signup`) no longer nests monthly/annual toggle buttons inside plan cards. Paid plans show spaced Monthly/Annual price information; billing interval is chosen on a second confirmation step before account creation.

# Problem Statement

`https://menuply.com/restaurant/signup` felt cluttered: monthly vs annual prices and selection boxes were bunched on each paid plan card, making the page look amateurish and unclear.

# Root Cause

`RestaurantSignupEntry.jsx` rendered interval toggle buttons (`intervalGroup` / `intervalButton`) on Starter and Founder's cards while also listing prices, so selection UI competed with pricing presentation.

# Evidence Collected

- There is no separate shopping-cart step in this flow; account creation receives `location.state.selected_plan` and proceeds to Stripe Checkout with a concrete plan code.
- Plan codes remain `starter_monthly` | `starter_annual` | `founders_monthly` | `founders_annual` via `menuplyCheckoutPlans.js`.

# Files Examined

- `menubloc-frontend/src/pages/RestaurantSignupEntry.jsx`
- `menubloc-frontend/src/lib/menuplyCheckoutPlans.js`
- `menubloc-frontend/src/pages/SubscriptionSelect.jsx` (similar toggles; not changed)

# Database Queries Executed

None.

# Changes Made

- Removed card-level monthly/annual selection boxes.
- Paid cards show clear Monthly / Annual price rows plus a short hint that billing period is chosen next.
- Selecting Starter or Founder's opens a confirmation step asking Monthly ($X per month) or Annual ($X per year), then navigates to `/restaurant/signup/account` with the resolved plan code.
- Published/free still goes straight to account creation.

# Commits

Not committed in this session (unless requested later).

# Deployment Status

Local/frontend change only; not deployed to `menuply.com`.

# Verification Results

- Lint clean on `RestaurantSignupEntry.jsx`.
- Manual browser verification of production not run (change not deployed).

# Remaining Risks

- `SubscriptionSelect.jsx` still uses card-level monthly/annual toggles for a different surface.
- Cadence step is in-page state (not a separate route); refreshing mid-step returns to plan list.

# Follow-Up Work

- Deploy frontend when approved.
- Optionally align `SubscriptionSelect.jsx` with the same cadence UX.

# Final Verdict

Signup entry UX cleaned: plan pick first, billing cadence second, checkout contract unchanged.
