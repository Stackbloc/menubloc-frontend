# Objective

Fix My Menuply / Connection hub: visible restaurant name after pick; photo add instruction; collapsed Future Plans; real clickable crews with request to join; no empty functionless plan cards.

# Current Status

Implemented and **CPD COMPLETE**. FE tip `o8xa604sx` / `index-DZR4cTvb.js` (`ef9bb7a`). BE health `0976be42`.

# Files Changed

**Frontend (`menubloc-frontend-main`)**

- `src/pages/consumer/MyMenuplyPage.jsx`
- `src/pages/consumer/ConsumerConnectionPeerPage.jsx`
- `src/pages/consumer/myMenuply/EatingPlanDayForm.jsx`
- `src/pages/consumer/myMenuply/PostAfterActions.jsx`
- `src/pages/consumer/myMenuply/myMenuplyBits.jsx`
- `src/pages/consumer/myMenuply/myMenuplyStyles.js`
- `src/pages/consumer/DiningCrewsPage.jsx`
- `src/lib/consumerApi.js` — `listDinerDiningCrews`
- `test/myMenuplyFourQuestionsContract.test.js`
- `test/connectionPeerHubContract.test.js`

**Backend (`menubloc-backend-main`)**

- `src/services/diningCrews/diningCrewsService.js` — `listDinerVisibleCrews`, public `getCrewForViewer`
- `src/routes/consumer/diningCrews.js` — `GET /dining-crews/for-diner/:dinerId`
- `test/diningCrewsContract.test.js`

# Database Changes

None. Uses existing crew/connection tables.

# Decisions Made

- Empty What We Doing sessions (no restaurant) are **not** scheduled plans.
- Owner collapsed CTA is **Click to Schedule Future Plans** (opens calendar, then `EatingPlanDayForm`).
- Viewer with no visible plans sees **No Plans Scheduled.** (not the editor).
- **Plans Scheduled** expands restaurant-tagged upcoming plans only.
- Peer crews: public crews that diner belongs to, plus private crews the viewer already belongs to. Requires accepted Connection.
- Public crew detail is name/description/request only; conversations stay members-only.

# Remaining Work

- Commit + CPD when Andre says `cpd`.
- After BE deploy, probe `GET /api/consumer/dining-crews/for-diner/:id` as a Connection.

# Risks / Known Issues

- Until Railway serves the new dining-crew route, peer My Crews falls back to empty.
- Peer Want to Eat / My Events still “Nothing yet.”

# Verification Status

FE four-questions + peer hub + share contracts pass. BE diningCrewsContract ok.

# Resume Instructions

1. Work in `menubloc-frontend-main` and `menubloc-backend-main` only.
2. Do not CPD unless Andre says `cpd`.
3. If CPD: path-gate BE, tip-gate FE; do not `railway up`; do not deploy from dirty `menubloc-frontend/` or `menubloc-backend/`.

# Git Status

Uncommitted local edits. Production tip still `89eyeudh1` / `index-DjXskZ76.js` until next FE CPD.
