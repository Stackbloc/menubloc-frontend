# Summary

Refactored consumer `/account` from one long settings page into a four-tab Menuply account dashboard: Profile, Social & Crew, Wallet & Activity, and Security & Account. Existing APIs, auth, Dining Crew, wallet, and preference persistence were reused. No new social or financial systems were added.

# Problem Statement

`/account` (`ConsumerProfile.jsx`) presented every diner setting as a stacked list of heavy cards, with a page-wide **Save Profile Preferences** action and a permanently visible password form. Dining Crew — the product differentiator — was only a link among many unrelated sections.

# Root Cause

The page grew by appending sections (social features, wallet, prefs, security) without an information architecture. Progressive disclosure was not used.

# Evidence Collected

- `ConsumerProfile.jsx` (pre-change): ~20 `Section` blocks; `saveProfilePreferences()` batched identity, diet, allergens, foods-to-avoid, and liked-meal unlikes.
- Existing diner surfaces already implemented: Dining Crews (`listDiningCrews`, `inviteToDiningCrew`, `createDiningCrew`), Connections, What We Doing?, Diner QR, Meet Me Here, Mx Coins (`coins_wallet`), liked meals, order feedback, password change, SMS phone change, `.edu` verification.
- Account deletion/deactivation is **not** implemented in consumer APIs — not added.
- Cuisine chips on Account Welcome are collected in UI but **not persisted** — not shown as account preferences.
- Contract tests previously asserted strings in `ConsumerProfile.jsx`; those entry points moved into tab components.

# Files Examined

- `menubloc-frontend-main/src/pages/consumer/ConsumerProfile.jsx`
- `menubloc-frontend-main/src/pages/consumer/DiningCrewsPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/ConsumerConnections.jsx`
- `menubloc-frontend-main/src/lib/consumerApi.js`
- `menubloc-backend-main/src/routes/consumer/profile.js`
- `menubloc-backend-main/src/services/diningCrews/diningCrewsService.js` (`shapeCrew` includes `members` / `members_preview`)
- Existing account-entry contract tests (Diner QR, What We Doing, Meet Me Here, social onboarding, I'm Eating, order feedback, preference filter)

# Database Queries Executed

None. Read-only code/API inspection only.

# Changes Made

Frontend-only reorganization in `menubloc-frontend-main`:

- Four sticky, horizontally scrolling tabs (`ChipRail`) via `?tab=`
- Profile: identity / dining (location + home zip) / dietary / allergens / avoided ingredients as **summary → Edit**; preference chips save immediately (`updatePreferences`, `updateFoodsToAvoid`)
- Social & Crew: Dining Crew roster + create empty state + Invite via existing ShareModal; invitations, Diner QR, Meet Me Here, Connections, onboarding, cluster subscriptions, restaurant Following (secondary)
- Wallet & Activity: real Mx Coins (empty state if unused), liked meals with immediate unlike, Send Feedback / I'm Eating / Diner Status, My Clusters
- Security: email, change phone, collapsed Change Password, support, logout — no invented deletion
- Removed page-wide Save All and always-visible password form
- Light diner visual language (section headings + dividers, not a card per setting)

# Commits

Not committed (not requested).

# Deployment Status

Not deployed. Local FE only in `menubloc-frontend-main`. Production tip unchanged.

# Verification Results

Passed:

- `node --test test/accountDashboardContract.test.js` including dead-button + App-route mapping tests
- Related account-entry contracts (Diner QR, What We Doing, Meet Me Here, social onboarding, Phase 1–7, order feedback, preference filter)
- `npx vitest run test/imEatingFoodActivityContract.test.js`
- `test:share-contract` (Diner QR `?share=1` opens ShareModal; no `navigator.share` auto-invoke)

Live production API probe (unauthenticated, 2026-08-17): all dashboard-backed routes exist and return **401 Authentication required** (not 404):

- GET `/api/consumer/profile`, `/dining-crews`, `/connections`, `/what-we-doing`, `/menu-item-likes`, `/foods-to-avoid`, `/notifications`, `/diner-qr`, `/order-feedback/eligible`
- GET `/public/clusters/my`
- PUT `/api/consumer/profile`, `/profile/preferences`, `/foods-to-avoid`
- POST `/api/consumer/dining-crews`, `/api/consumer-auth/change-password`, `/edu/send`, `/phone/send`, connections accept/decline
- DELETE `/api/consumer/menu-item-likes/:id`

Railway `/health` `commit_hash` starts with `fc669272`.

E2E wiring pass (no dead controls):

- Every `<button>` has `onClick` or `type="submit"`
- Action rows are full `Link`s to existing App routes
- Empty Dining Crew → `createDiningCrew` then `/account/dining-crews/:id`
- Empty What We Doing → **Start a plan** → `/account/what-we-doing`
- Share My Menuply → `/account/diner-qr?share=1` → ShareModal (Copy Link primary)
- Liked meals → `/menu-items/:id` + immediate `unlikeMenuItem`
- Clusters → `clusterPath(...)` or `/clusters`
- Dining location → **Set location on Discovery** → `/`
- Profile Done saves identity/zip (does not discard)
- Dining Crew load failure is an error, not a fake empty create form

Not run: logged-in browser session (needs diner cookie). `test:menu-experience-contract` (protected menu files unchanged).

# Remaining Risks

- Sticky tab bar vs `overflow` on ancestors should be checked on a real phone.
- Fast chip taps can race; last write wins; failure reverts that toggle.
- Social tab refetches crew/connections/sessions each visit (acceptable; no new cache).
- Account deletion remains unsupported (honest omission).

# Follow-Up Work

- Human verify on `/account` (all four tabs, chip save, crew empty + invite, password editor, logout).
- Commit + CPD when Andre requests.

# Final Verdict

UX refactor complete locally: `/account` is a four-tab diner dashboard over existing Menuply functionality. Not production-complete until commit/deploy/alias and human verification.
