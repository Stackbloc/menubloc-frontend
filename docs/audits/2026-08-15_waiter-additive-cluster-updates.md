# Summary

Waiter briefing restored to **additive** behavior: location/meal Waiter always runs when city+state exist; followed-cluster updates prepend without suppressing people-eating or crowding out meal picks. Zero subscriptions is not a Waiter outage.

# Problem Statement

Phase 6 cluster wiring could skip geo people-eating when cluster report already had that type, and cluster cards (up to 8) could crowd core meal picks out of the 14-item payload. Empty UI also over-emphasized “follow clusters.”

# Root Cause

`hasClusterEating` gate + cluster-heavy merge order treated cluster feed as primary replacement rather than additive.

# Evidence Collected

- `waiter.js` briefing assembly
- `FoodInterestsPage` empty/subheading copy
- User instruction 2026-08-15: prior Waiter + cluster updates; far from cluster / no subscription must still function; no repeated cluster info

# Files Examined / Changed

- `menubloc-backend-main/src/routes/waiter.js`
- `menubloc-backend-main/src/services/waiter/waiterClusterReportService.js`
- `menubloc-frontend-main/src/pages/FoodInterestsPage.jsx`
- BE/FE `waiterClusterReportContract` tests

# Database Queries Executed

None.

# Changes Made

1. Always build `coreRecommendations` (people-eating, deals, meal items, new restaurants) when city+state present
2. Cap cluster lead at 5; merge cluster + core; title-dedupe; slice 16
3. Remove `hasClusterEating` skip
4. No-subscription cluster notice → `null` (not an outage message)
5. FE: location-first subheading; empty state uses area message when location set; browse-clusters only when no location + no subs

# Commits

None yet (local).

# Deployment Status

**LOCAL** — not CPD’d.

# Verification Results

- BE `waiterClusterReportContract` — ok
- FE `waiterClusterReportContract` — pass

# Remaining Risks

Live E2E still needed after CPD: location far from followed cluster; zero subscriptions; with subscriptions.

# Follow-Up Work

CPD when Andre authorizes.

# Final Verdict

**LOCAL COMPLETE** — Waiter core + optional cluster updates, non-duplicative.
