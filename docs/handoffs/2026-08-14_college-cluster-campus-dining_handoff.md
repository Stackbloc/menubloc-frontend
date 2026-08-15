# Objective

Add Campus Dining to applicable university College Clusters using existing restaurant + food_activity surfaces — no menu analysis platform.

# Current Status

**LOCAL COMPLETE** (code + contract tests). Not committed. Migration `0248` and USC seed not applied to production. Deploy not attempted.

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
- Seed (when applied): USC Village Dining Hall, Parkside Dining Hall, Everybody's Kitchen + membership flags

# Decisions Made

- University `type` only; hide section when zero locations
- Reuse restaurants — no parallel place model
- Reuse `food_activity` — no `campus_dining_activity`
- Place-only I'm Eating requires a note
- Waiter: reuse people-eating path; minimal shaping for place; no Waiter page rewrite
- Do not invent halls beyond the three known USC residential/village shells

# Remaining Work

1. Andre: authorize commit (or commit on request)
2. Apply migration: `CONFIRM_PRODUCTION_TARGET=true railway run … node scripts/apply-campus-dining-0248.js --allow-production`
3. Seed: `CONFIRM_PRODUCTION_TARGET=true … node scripts/seed/seedUscCampusDining.js --apply --allow-production` (dry-run first)
4. Deploy BE from `menubloc-backend-main` @ clean `main`; FE from `menubloc-frontend-main` + alias + tip-gate
5. Smoke: USC shows Campus Dining; LA Live / non-university does not; place-only I'm Eating; logged-out view

# Risks / Known Issues

- Seed INSERT column set assumes current restaurants schema
- Until migrate+seed, Campus Dining section stays hidden on USC

# Verification Status

| Check | Result |
|-------|--------|
| FE campusDiningContract | PASS |
| BE campusDiningContract | PASS |
| Prod migrate/seed | NOT RUN |
| Live smoke | NOT RUN |

# Resume Instructions

1. Read this handoff + `docs/audits/2026-08-14_college-cluster-campus-dining.md`
2. Commit FE/BE if Andre asks
3. Migrate + seed with production consent
4. Deploy authorized paths only; tip-gate PASS

# Git Status

Uncommitted local changes on `menubloc-frontend-main` and `menubloc-backend-main` `main` (ahead/behind per remote at commit time).
