# Cluster landing consumer dashboard

## Summary

The public cluster page is now a **consumer-friendly dashboard**: name + short blurb, local day/date/time, Today's Hotspots (up to 10 restaurants + a comment), Popular today, Who's eating here (de-duplicated comments), On campus, then nearby events (30 miles). Full Food/Restaurants browse stays below. Dining-hall menus are not analyzed.

## Problem Statement

The previous cluster landing stacked a long SEO intro, a multi-section food feed, a second activity block, campus cards with nested comments, then the menu explorer. That was too much to scan — especially for a USC/college student who just wants to know what's going on.

## Root Cause

Phase 6 feed buckets plus Social Engine “What People Are Eating” plus campus `WhatDinersAreSaying` repeated the same signals in different voices.

## Evidence Collected

- `ClusterPage` previously mounted `ClusterPublicFeed` then `WhatPeopleAreEating` then `CampusDiningSection` then the explorer.
- Feed contract previously forbade “Today's Hotspots” and in-feed Links.
- Dining-hall no-menus guardrail (2026-08-17): status + comments only.

## Files Examined

- `ClusterPage.jsx`, `ClusterPublicFeed.jsx`, `CampusDiningSection.jsx`, `WhatPeopleAreEating.jsx`
- `clusterReportFeedService.js` (Waiter builder left intact)
- `venueEventService.js`, `publicClusters.js`
- `docs/architecture/2026-08-15_cluster-feed-specification.md`

## Database Queries Executed

None against production. New events list uses existing `venue_events` + restaurant lat/lng.

## Changes Made

- FE dashboard composition + brief card description in the header.
- Campus section is a place list (no nested comment dump; no hall menus).
- BE `GET /public/clusters/:slug/events` (30-mile published venue events). Not wired into the Waiter/feed builder.
- `restaurant_type` added to cluster food-activity rows so hall SKUs can be excluded from Popular today.

## Commits

- FE `11e792e` — `feat(cluster): show a scan-first dashboard on cluster pages.`
- BE `a8980221` — `feat(cluster): list nearby published events for cluster landing.`
- CPD docs: this file + `docs/deployments/2026-08-17_cluster-landing-consumer-dashboard-cpd.md`

## Deployment Status

**CPD COMPLETE.** Tip `30qbi67vq` / `index-CMXfgjwr.js`. Railway `/health` MATCH live docs `82beb3d9e4455005c81212cc6c12aca14a6120a2` (feature `a8980221`).

## Verification Results

- FE: public cluster feed, campus dining, dining-hall entity, campus theme, dashboard model, What People Are Eating, social engine loop, cluster subscriptions contracts — pass
- BE: `publicClusterFeedPhase6Contract` — pass
- Tip-gate PASS apex + www (`30qbi67vq` / `index-CMXfgjwr.js`)
- `GET /public/clusters/usc/events` → `ok: true`, `event_count: 0` (no published geo events yet)
- Waiter files not edited

## Remaining Risks

- Nearby events only appear if published `venue_events` exist with venue capability + restaurant geo.
- Hotspots depend on diner shares/statuses; empty clusters stay quiet on purpose.

## Follow-Up Work

Optional: tick the clock from a shared market clock helper. Do not add dining-hall menus. Do not put events into the Waiter feed builder.

## Final Verdict

**CPD COMPLETE.** Cluster landing is a scan-first dashboard. Food explorer remains below. Dining halls stay status/comments only. Waiter still uses the shared food builder without events.
