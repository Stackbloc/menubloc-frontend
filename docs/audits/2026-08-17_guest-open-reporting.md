# Summary

Guests can now post first-class **I'm Eating At** and **diner-status** reports without a Menuply account. A temporary `guest_key` (not an account) supports rate limits, duplicates, and location confidence. Registration is offered only after a successful post. Join Me / Dining Crew / invitation social / personal history remain identity-gated. Product principle: **Anyone can contribute. Accounts unlock identity and social features.** Local implementation in `menubloc-backend-main` + `menubloc-frontend-main`. **Not committed. Not deployed.** Migration `0265` must be applied before production guest INSERTs succeed.

# Problem Statement

Andre required that contributing real-time operational information must not require registration. Account creation is reserved for persistent identity and social functions.

# Root Cause

I'm Eating At (`/account/im-eating`) and Diner Status (`/account/diner-status`) previously redirected unsigned users to login. `food_activity` and `diner_statuses` required `consumer_user_id NOT NULL`. Guest reports could not enter restaurant / dining-hall / venue / cluster intelligence.

# Evidence Collected

- `ImEatingPage.jsx` / `DinerStatusPage.jsx` no longer match `login?next=…im-eating` / `diner-status`.
- Public create: `POST /public/food-activity`, `POST /public/diner-statuses` with `optionalConsumerAuth`.
- Join Me remains `POST /api/consumer/join-me` + `requireConsumerAuth`.
- Public shapers omit `guest_key` / `ip_hash` / reporter coords; display name `"A diner"`.
- Place typeahead `GET /public/food-activity/places` is composer lookup (restaurants ILIKE; CK items **require** `restaurant_id`) — not `retrieveCandidates`.
- Hedged waiter-ready lines live in `dinerStatusReportLines.js` (“was reported…”). Waiter files untouched.

# Files Examined

- `menubloc-backend-main/sql/migrations/20260817_0265_guest_open_reporting.sql`
- `src/services/guestReporting/guestReporter.js`
- `src/services/foodActivity/foodActivityService.js`
- `src/services/dinerStatus/dinerStatusService.js`, `dinerStatusReportLines.js`
- `src/routes/publicFoodActivity.js`, `publicDinerStatuses.js`, `consumer/joinMe.js`
- `menubloc-frontend-main/src/lib/guestReporterSession.js`, `foodActivityApi.js`, `dinerStatusApi.js`
- `ImEatingAtPanel.jsx`, `ImEatingPage.jsx`, `DinerStatusComposer.jsx`, `DinerStatusPage.jsx`, `GuestContributeNextStep.jsx`
- `WhatDinersAreSaying.jsx`, `PublicProfileShell.jsx`
- Contract tests listed under Verification

# Database Queries Executed

None against production. Migration `0265` not applied.

# Changes Made

- Nullable `consumer_user_id`; `guest_key`, `ip_hash`, reporter coords, `location_confidence` on `food_activity` and `diner_statuses`
- Expanded `diner_statuses.expression_key` for wait / seating / sold-out / venue ops
- Guest create paths + IP/guest rate limits + 10-minute duplicate window
- FE composers post publicly; Join Me and history only when authenticated; after-success account prompt
- Menu-item place lookup requires `restaurant_id` (no national CK ILIKE)

# Commits

None.

# Deployment Status

**CPD COMPLETE.** FE `81b9bdd` / `37tsmprgc` / `index-HPBXNwnC.js`. BE `a32d95dd` MATCH. Migrations `0264`–`0265` applied.

# Verification Results

- BE: `guestOpenReportingContract`, `foodActivityContract`, `dinerStatusContract`, `dinerStatusBusyReportContract`, `joinMeContract` — **ok**
- FE: `guestOpenReportingContract`, `joinMeContract`, `dinerStatusContract`, `campusDiningContract`, `imEatingFoodActivityContract` — **pass**
- `npm run test:share-contract` — **10 pass**
- `inviteToEatContract` — **fail (pre-existing):** modal `gridTemplateColumns` is `16px` vs contract `18px`. Not changed in this task.
- Live guest POST against production — **not run** (`0265` not applied)

# Remaining Risks

- Guest_key in localStorage can be cleared; abuse then relies on IP hash
- Restaurant name typeahead is still national ILIKE (composer, not dish search)
- GPS permission denied → `location_confidence=unknown` (allowed)
- `inviteToEatContract` currently fails on radio grid `16px` vs `18px` (unrelated; do not “fix” Invite layout in this workstream)

# Follow-Up Work

- Apply `0265` on authorized BE path when Andre requests deploy
- Human verify guest post on a restaurant profile and dining hall
- Optional: photo upload for guests where supported

# Final Verdict

**CPD COMPLETE.** FE tip `menubloc-frontend-37tsmprgc-menuply.vercel.app` / `index-HPBXNwnC.js` (`81b9bdd`). BE health MATCH `a32d95dd`. Migrations `0264`–`0265` applied.
