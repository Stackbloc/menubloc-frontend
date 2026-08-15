# Objective

Add Campus Dining to applicable university College Clusters using existing restaurant + food_activity surfaces — no menu analysis platform.

# Current Status

**CPD COMPLETE** (2026-08-14).

| Layer | Value |
|-------|--------|
| FE tip | `menubloc-frontend-3ejgczu00-menuply.vercel.app` / `index-BrTJV97-.js` @ `eb1b377` |
| BE | Railway health `a2ae326c` |
| DB | migration `0248` + USC seed (3 halls) |
| Agent LKG | `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md` |
| CPD | `docs/deployments/2026-08-14_campus-dining-cpd.md` |

# Files Changed

## Backend (`menubloc-backend-main`)

- `sql/migrations/20260814_0248_cluster_campus_dining.sql` (+ rollback)
- `scripts/apply-campus-dining-0248.js`
- `scripts/seed/seedUscCampusDining.js`
- `src/services/clusters/clusterService.js` — `listCampusDiningLocations`
- `src/routes/publicClusters.js` — `GET .../campus-dining`
- `src/services/foodActivity/foodActivityService.js` — place-only create + people-eating UNION
- `src/services/waiter/waiterPeopleEatingService.js` — place share shaping only
- `test/campusDiningContract.test.js`

## Frontend (`menubloc-frontend-main`)

- `src/components/cluster/CampusDiningSection.jsx` (new)
- `src/pages/ClusterPage.jsx` — mount section
- `src/lib/clusterApi.js` — `fetchClusterCampusDining`
- `src/components/cluster/WhatPeopleAreEating.jsx` — place vs dish cards
- `src/pages/consumer/ImEatingPage.jsx` — place-only submit
- `src/components/foodActivity/ImEatingComposer.jsx` — place-only copy
- `src/components/restaurant/WhatDinersAreSaying.jsx` — place-only label
- `test/campusDiningContract.test.js`

# Database Changes

- Column: `public.cluster_restaurants.is_campus_dining BOOLEAN NOT NULL DEFAULT FALSE`
- Seed applied: USC Village Dining Hall, Parkside Dining Hall, Everybody's Kitchen

# Decisions Made

- University `type` only; hide section when zero locations
- Reuse restaurants — no parallel place model
- Reuse `food_activity` — no `campus_dining_activity`
- Place-only I'm Eating requires a note
- Waiter: reuse people-eating path; minimal shaping for place; no Waiter page rewrite

# Remaining Work

1. Optional human smoke on `/clusters/usc`
2. Retry `venues.menuply.com` alias if cert issuance fails again
3. Keep LKG contract CURRENT section in sync on every future tip-gate PASS

# Risks / Known Issues

- `venues.menuply.com` alias hit certificate issuance error during CPD (apex/www/crm OK)

# Verification Status

| Check | Result |
|-------|--------|
| FE/BE campusDiningContract | PASS |
| Prod migrate/seed | PASS |
| Tip-gate apex+www | PASS |
| USC campus-dining API | 3 locations |
| Live UI smoke | optional human |

# Resume Instructions

1. Read LKG contract first: `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md`
2. Do not restore prior tips unless Andre names them
3. Next Campus Dining work: more university halls only when known (no scrape pipeline)

# Git Status

FE `eb1b377` and BE `a2ae326c` on `origin/main` (clean at CPD close).
