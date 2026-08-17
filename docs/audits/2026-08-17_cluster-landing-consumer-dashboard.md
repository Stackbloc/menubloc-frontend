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

Not committed until Andre asks / CPD.

## Deployment Status

Not deployed.

## Verification Results

- FE: public cluster feed, campus dining, dining-hall entity, campus theme, dashboard model, What People Are Eating, social engine loop, cluster subscriptions contracts — pass
- BE: `publicClusterFeedPhase6Contract` — pass
- Waiter files not edited

## Remaining Risks

- Nearby events only appear if published `venue_events` exist with venue capability + restaurant geo.
- Hotspots depend on diner shares/statuses; empty clusters stay quiet on purpose.

## Follow-Up Work

CPD when Andre asks. Optional: tick the clock from a shared market clock helper.

## Final Verdict

Cluster landing is a scan-first dashboard. Food explorer remains below. Dining halls stay status/comments only. Waiter still uses the shared food builder without events.
