# Cluster landing consumer dashboard handoff

## Objective

Make the cluster page a quick, consumer-friendly overview (dashboard): name, clock, hotspots, popular dishes, comments, campus options, nearby events.

## Current Status

Implemented locally on `menubloc-frontend-main` and `menubloc-backend-main`. Not committed/deployed.

## Files Changed

- FE: `ClusterPage.jsx`, `ClusterPublicFeed.jsx`, `CampusDiningSection.jsx`, `ClusterNearbyEvents.jsx`, `clusterDashboardModel.js`, `clusterApi.js`, contracts
- BE: `venueEventService.js`, `publicClusters.js`, `foodActivityService.js`
- Spec: `docs/architecture/2026-08-15_cluster-feed-specification.md`

## Database Changes

None.

## Decisions Made

- Landing dashboard is presentation/composition; Waiter still uses `buildClusterReportSection` (no events in that builder).
- Dining halls excluded from hotspots and popular menu items; they appear under On campus; comments can still show in Who's eating here.
- Header uses `resolveClusterCardDescription` (short), not the long SEO intro.
- Events: published Menuply venue events within 30 miles, split Today / Upcoming.

## Remaining Work

CPD when requested.

## Risks / Known Issues

Empty clusters show a quiet state. Event list is empty until published geo-located venue events exist.

## Verification Status

Local contracts listed in the audit — pass. Waiter files untouched.

## Resume Instructions

Do not put events into `clusterReportFeedService`. Do not add dining-hall menus. CPD from authorized `*-main` only.

## Git Status

Dirty working trees on FE-main and BE-main until commit/CPD.
