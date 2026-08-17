# Cluster landing consumer dashboard handoff

## Objective

Make the cluster page a quick, consumer-friendly overview (dashboard): name, clock, hotspots, popular dishes, comments, campus options, nearby events.

## Current Status

**CPD COMPLETE.** Tip `menubloc-frontend-30qbi67vq-menuply.vercel.app` / `index-CMXfgjwr.js` (`11e792e`). BE feature `a8980221`; live health MATCH docs `82beb3d9e4455005c81212cc6c12aca14a6120a2`.

## Files Changed

- FE: `ClusterPage.jsx`, `ClusterPublicFeed.jsx`, `CampusDiningSection.jsx`, `ClusterNearbyEvents.jsx`, `clusterDashboardModel.js`, `clusterApi.js`, contracts
- BE: `venueEventService.js`, `publicClusters.js`, `foodActivityService.js`
- Spec: `docs/architecture/2026-08-15_cluster-feed-specification.md`
- CPD: `docs/deployments/2026-08-17_cluster-landing-consumer-dashboard-cpd.md`

## Database Changes

None.

## Decisions Made

- Landing dashboard is presentation/composition; Waiter still uses `buildClusterReportSection` (no events in that builder).
- Dining halls excluded from hotspots and popular menu items; they appear under On campus; comments can still show in Who's eating here.
- Header uses `resolveClusterCardDescription` (short), not the long SEO intro.
- Events: published Menuply venue events within 30 miles, split Today / Upcoming.

## Remaining Work

None for this CPD. Optional later: shared market clock helper.

## Risks / Known Issues

Empty clusters show a quiet state. Event list is empty until published geo-located venue events exist.

## Verification Status

Contracts pass. Tip-gate PASS (apex + www). USC events endpoint `ok: true`, `event_count: 0`. Waiter files untouched.

## Resume Instructions

Do not put events into `clusterReportFeedService`. Do not add dining-hall menus. Deploy only from authorized `*-main`. Prior tip: `9ijik4t7p` / `index-HPBXNwnC.js`.

## Git Status

FE `menubloc-frontend-main` @ `bac3371` (feature `11e792e` plus CPD docs). BE `menubloc-backend-main` @ `82beb3d9` (feature `a8980221` plus CPD docs). Do not push BE again to chase health.
