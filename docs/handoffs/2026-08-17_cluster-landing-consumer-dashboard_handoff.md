# Cluster landing consumer dashboard handoff

## Objective

Make the cluster page a quick, consumer-friendly overview (dashboard): name, clock, hotspots, popular dishes, comments, campus options, nearby events.

## Current Status

**CPD COMPLETE.** Tip `menubloc-frontend-30qbi67vq-menuply.vercel.app` / `index-CMXfgjwr.js` (`11e792e`). BE shipped `a8980221`; Railway `/health` MATCH `a89802214c080b0ade35d3a99fb16c43edfcd982` at alias time.

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

Empty clusters show a quiet state. Event list is empty until published geo-located venue events exist. BE docs commit may change live `/health` SHA — record it; do not redeploy to chase.

## Verification Status

Contracts pass. Tip-gate PASS (apex + www). USC events endpoint `ok: true`, `event_count: 0`. Waiter files untouched.

## Resume Instructions

Do not put events into `clusterReportFeedService`. Do not add dining-hall menus. Deploy only from authorized `*-main`. Prior tip: `9ijik4t7p` / `index-HPBXNwnC.js`.

## Git Status

FE `menubloc-frontend-main` @ `11e792e` (plus CPD docs). BE `menubloc-backend-main` @ `a8980221` (plus CPD docs).
