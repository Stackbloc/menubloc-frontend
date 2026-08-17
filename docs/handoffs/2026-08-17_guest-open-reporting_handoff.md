# Objective

Treat Guest as a first-class Menuply contributor: anyone can post I'm Eating At and operational diner-status signals without an account. Accounts unlock Join Me, Dining Crew, invitation social, and personal history.

# Current Status

**CPD COMPLETE — live on menuply.com.** Tip `37tsmprgc` / `index-HPBXNwnC.js` (`81b9bdd`). BE health MATCH `a32d95dd`. Migrations `0264` Join Me and `0265` guest open reporting applied.

Product principle (locked): **Anyone can contribute. Accounts unlock identity and social features.**  
Contract: `docs/guardrails/2026-08-17_guest-open-reporting-contract.md`

# Files Changed

## Backend (`menubloc-backend-main`)

- `sql/migrations/20260817_0265_guest_open_reporting.sql` (+ rollback)
- `src/services/guestReporting/guestReporter.js`
- `src/services/foodActivity/foodActivityService.js` — guest create; `searchReportPlaces` requires `restaurant_id` for menu items
- `src/services/dinerStatus/dinerStatusService.js` — guest create; LEFT JOIN consumers
- `src/services/dinerStatus/dinerStatusReportLines.js` — operational + hedged copy
- `src/routes/publicFoodActivity.js` — GET `/places`, POST `/food-activity`
- `src/routes/publicDinerStatuses.js` — POST `/diner-statuses`
- `src/server.js` — session middleware on those public routers
- `src/services/clusterReportFeed/clusterFeedFreshness.js` — ops keys → dining_conditions
- Tests: `guestOpenReportingContract`, `foodActivityContract`, `dinerStatusContract`, `dinerStatusBusyReportContract`

Join Me (prior turn, still in tree): migration `0264`, `joinMeService.js`, consumer `joinMe.js`, public Join Me list.

## Frontend (`menubloc-frontend-main`)

- `src/lib/guestReporterSession.js`
- `src/lib/foodActivityApi.js`, `dinerStatusApi.js`
- `src/components/foodActivity/GuestContributeNextStep.jsx`
- `ImEatingComposer.jsx`, `ImEatingAtPanel.jsx`, `ImEatingPage.jsx`
- `DinerStatusComposer.jsx`, `DinerStatusFeed.jsx`, `DinerStatusPage.jsx`
- `WhatDinersAreSaying.jsx`, `PublicProfileShell.jsx`
- Tests: `guestOpenReportingContract`, `joinMeContract`, updated diner-status / im-eating contracts

# Database Changes

Migration **0265** (not applied):

- Drop NOT NULL on `food_activity.consumer_user_id` and `diner_statuses.consumer_user_id`
- Add `guest_key`, `ip_hash`, `reporter_lat`, `reporter_lng`, `location_confidence`
- Expand diner-status expression check (wait / seating / sold-out / venue ops)

# Decisions Made

- Same public tables and surfaces as registered diners (not a parallel guest product)
- User XOR guest_key; guests always `visibility=public`
- GPS optional; nearby ≤400m
- Abuse: express-rate-limit 30/15min + 12/guest/hour + 40/IP/hour + 10-min duplicate window
- Registration CTA only after success (`GuestContributeNextStep`)
- Join Me stays authenticated
- Place lookup is composer ILIKE, not dish search; menu items scoped to chosen restaurant
- Do not edit Waiter files; hedge copy in report lines

# Remaining Work

1. Commit when Andre asks
2. Apply `0265` from authorized `menubloc-backend-main` @ clean `main` when deploying BE
3. Human verify a signed-out post on restaurant profile + dining hall
4. Do not CPD unless asked

# Risks / Known Issues

- Pre-migration production: guest INSERT → 503 `guest_reporting_unavailable`
- Clearing site data rotates `guest_key`
- I'm Eating page still mentions Join Me in lead copy (as identity-gated, not as a guest CTA)

# Verification Status

See audit. Guest/IEA/diner-status/Join Me/share contracts **PASS**. `inviteToEatContract` radio-grid assertion **FAIL** (pre-existing 16px vs 18px; untouched). Production POST **not** probed (migration not applied). Waiter files **not** modified.

# Resume Instructions

1. Run BE: `node test/guestOpenReportingContract.test.js && node test/foodActivityContract.test.js && node test/dinerStatusContract.test.js && node test/dinerStatusBusyReportContract.test.js && node test/joinMeContract.test.js`
2. Run FE: `node --test test/guestOpenReportingContract.test.js test/joinMeContract.test.js test/dinerStatusContract.test.js test/campusDiningContract.test.js test/inviteToEatContract.test.js` and `npx vitest run test/imEatingFoodActivityContract.test.js` and `npm run test:share-contract`
3. If shipping: path-gate BE, apply `0265`, push authorized main; FE from `menubloc-frontend-main` @ clean main → alias → tip-gate
4. Do not touch Waiter / HomeNext / OperatorLogin / Stripe / SiteFooter hide

# Git Status

Uncommitted local changes in `menubloc-backend-main`, `menubloc-frontend-main`, and workspace `docs/` + `.cursor/rules/`. Production FE/BE not touched.
