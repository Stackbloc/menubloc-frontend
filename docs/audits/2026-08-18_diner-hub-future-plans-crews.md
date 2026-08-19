# Summary

My Menuply Future Plans was an always-open editor with empty “Add details” cards. Selected restaurant names were unreadable (city/state only). Placeholder meal photos had no add-photo instruction. Peer “My Crews” was a stub.

This change collapses Future Plans to status copy, forces restaurant names to dark green, adds “Click to add photo of meal” on empty photos, and lists a diner’s actual affiliated crews (clickable; request to join).

**Date:** 2026-08-18  
**Status:** LOCAL (not committed, not deployed)

# Problem Statement

On `/my-menuply`, picking a restaurant for a future plan showed only city and state. The Future Plans box always showed the Join Me form plus empty plan cards when nothing was scheduled. Placeholder photos had no hover/instruction. Connection hubs stubbed My Crews as “Nothing yet.” Functionless boxes remained on the diner profile.

# Root Cause

1. **Restaurant name:** `EatingPlanDayForm` rendered `restaurant.restaurant_name` with `fontWeight: 800` and **no color**. On the cream hub that line was effectively invisible; city/state used explicit muted gray. Picks also skipped `asRestaurantPlace` / `restaurantLabel`.
2. **Empty plan cards:** `EatingPlanCard` treats sessions without a restaurant as “Add restaurant, dish, and details.” Those sessions were listed whenever `plan_date` matched the selected day. The day form was always mounted.
3. **Photos:** `PhotoGrid` placeholder was a hotdog emoji only (`aria-label` existed; no visible instruction).
4. **Crews:** Owner used `listDiningCrews` (real). Peer page hardcoded “Nothing yet.” `GET /dining-crews/:id` required membership, so non-members could not open details or request join from a diner hub.

# Evidence Collected

- Screenshot of live Future plans: Change + “Los Angeles, CA”; faint line above city; two identical Add-details cards; Join Me form always open.
- Source: `EatingPlanDayForm.jsx` selected name had no `color`; `styles.selected` had none either.
- `EatingPlanCard` empty `place` → “Add restaurant, dish, and details.”
- `ConsumerConnectionPeerPage.jsx` dining-crews section was a muted stub.

# Files Examined

- `menubloc-frontend-main/src/pages/consumer/MyMenuplyPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/ConsumerConnectionPeerPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/myMenuply/EatingPlanDayForm.jsx`
- `menubloc-frontend-main/src/pages/consumer/myMenuply/PostAfterActions.jsx`
- `menubloc-frontend-main/src/pages/consumer/myMenuply/myMenuplyBits.jsx`
- `menubloc-frontend-main/src/pages/consumer/DiningCrewsPage.jsx`
- `menubloc-backend-main/src/services/diningCrews/diningCrewsService.js`
- `menubloc-backend-main/src/routes/consumer/diningCrews.js`

# Database Queries Executed

None (code-only). Crew listing uses existing `dining_crews` / `dining_crew_members` / `user_connections` / `dining_crew_join_requests`.

# Changes Made

- Selected restaurant title uses `restaurantLabel` + `asRestaurantPlace` and `#14532d`.
- Empty meal photo: always-on bar + hover overlay **Click to add photo of meal**.
- Owner Future plans collapsed: **Click to Schedule Future Plans** opens calendar + day form. **Plans Scheduled** expands real restaurant plans only.
- Viewer: **No Plans Scheduled.** or clickable **Plans Scheduled**.
- `isScheduledEatingPlan` hides restaurant-less cards.
- `GET /api/consumer/dining-crews/for-diner/:dinerId` lists a Connection’s public (and co-membered private) crews.
- Public crew GET allowed for non-members (summary + request to join). Member chat/invite stays members-only.

# Commits

None.

# Deployment Status

Not deployed. Say `cpd` to ship from `menubloc-frontend-main` @ `main` and `menubloc-backend-main` @ `main`. Peer crews stay empty until the BE route is Railway-live.

# Verification Results

- `node --test test/myMenuplyFourQuestionsContract.test.js test/connectionPeerHubContract.test.js` — pass
- Share contract tests — pass
- `node test/diningCrewsContract.test.js` — ok
- Menu-experience contract not run (protected menu files not edited)

# Remaining Risks

- Live production still serves the old Future Plans editor until FE CPD.
- `for-diner` 403s until BE is live; peer page catches and shows “No crews to show.”
- Want to Eat / My Events on the peer hub remain text stubs (no peer list API in this change).

# Follow-Up Work

- CPD when Andre asks.
- Optional: peer Want to Eat / Events from real APIs.

# Final Verdict

Local implementation matches the requested diner-hub behavior. **CPD COMPLETE** — tip `o8xa604sx` / `index-DZR4cTvb.js`; FE `ef9bb7a`; BE health `0976be42`.
