# Objective

Phase 1 of USC / university cluster live layer: per-venue Line + Food indicators, glance bar, one-tap Update sheet — without a parallel report system.

# Current Status

**Phase 1 implemented locally. Not committed. Not deployed. Awaiting Andre go-ahead before CPD.**

# Files Changed

## Backend (`menubloc-backend-main`)

- `sql/migrations/20260921_0340_campus_live_status_expressions.sql` (+ rollback)
- `src/services/clusters/clusterCampusLiveConfig.js`
- `src/services/clusters/clusterCampusLiveLogic.js`
- `src/services/clusters/clusterCampusLiveService.js`
- `src/services/dinerStatus/dinerStatusReportLines.js` — new expressions
- `src/routes/publicClusters.js` — `GET /live`, `POST /live/report`
- `test/clusterCampusLiveContract.test.js`

## Frontend (`menubloc-frontend-main`)

- `src/lib/clusterApi.js` — `fetchClusterCampusLive`, `postClusterCampusLiveReport`
- `src/components/cluster/CampusLiveGlanceBar.jsx`
- `src/components/cluster/CampusLiveUpdateSheet.jsx`
- `src/components/cluster/CampusDiningSection.jsx` — chips + Update
- `src/components/cluster/ClusterPublicFeed.jsx` — glance under date clock
- `src/pages/ClusterPage.jsx` — `showGlance={false}` on campus section (glance in feed)
- `test/clusterCampusLiveContract.test.js`
- `test/diningHallEntityContract.test.js` — updated On campus copy assertions

# Database Changes

Migration **0340** expands `diner_statuses.expression_key` CHECK with:

`line_none`, `line_short`, `line_long`, `food_good`, `food_okay`, `food_skip`

No new tables. Reuses `diner_statuses` + campus dining venue list.

# Decisions Made

1. **Reuse `diner_statuses`** instead of inventing `cluster_status_reports` (brief’s data sketch adjusted to existing conventions).
2. **Guests can report** (guest open reporting contract) — brief said signed-in; open Q1 answered by standing guest contract.
3. Aggregation defaults live in `clusterCampusLiveConfig.js` (majority of last 3 in 20m; line stale 60m; food meal-period scoped).
4. UI copy avoids “Activity” / “Feed” / “social” as labels.

# Remaining Work

- Apply migration 0340 on production before BE CPD
- Local/prod E2E: Update tap → Saved → glance + row refresh
- Phase 2: comments + live feed (not started)
- Phase 3: video + eating invites (blocked on video upload status check)

# Risks / Known Issues

- Mockup HTML `usc-cluster-live.html` was not in Downloads — layout is instruction-faithful, not pixel-matched.
- Double fetch of `/live` (feed glance + On campus chips) — acceptable for Phase 1.
- Migration must ship with BE or writes fail CHECK.

# Verification Status

- BE `node test/clusterCampusLiveContract.test.js` — run locally
- FE `node --test test/clusterCampusLiveContract.test.js test/diningHallEntityContract.test.js` — PASS
- E2E / server smoke — **NOT RUN** (no deploy)

# Resume Instructions

1. Switch to Agent mode
2. Apply migration 0340 (prod)
3. On Andre “cpd”: path-gate BE from `menubloc-backend-main`, FE `cpd-fe.sh` after E2E
4. Then Phase 2 only after Phase 1 accepted

# Git Status

Uncommitted on `menubloc-backend-main` and `menubloc-frontend-main` @ `main`.
