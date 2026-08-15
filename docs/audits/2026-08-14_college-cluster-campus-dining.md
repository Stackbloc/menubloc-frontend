# College Cluster Campus Dining

**Date:** 2026-08-14  
**Status:** LOCAL COMPLETE — migrate `0248` + USC seed + deploy not run

## Summary

Lightweight Campus Dining on `university` clusters only. Reuses `public.restaurants`, `cluster_restaurants.is_campus_dining`, `food_activity`, and existing What Diners Are Saying / What People Are Eating. No menu analysis, no new activity table, no Waiter UI redesign.

## Problem Statement

College clusters listed nearby restaurants but had no campus dining halls as social places. Menuply needed place-anchored diner commentary without requiring structured cafeteria menus.

## Root Cause

No membership flag for campus dining; `createImEating` / cluster people-eating assumed dish `menu_item_id`; USC cluster had no dining-hall restaurant shells.

## Evidence Collected

- Cluster type for colleges is `university` (e.g. USC `slug=usc`).
- Live USC memberships were commercial nearby restaurants, not dining halls.
- `food_activity.menu_item_id` nullable in schema; place-only blocked in service layer.

## Files Examined

- `clusterService.js`, `publicClusters.js`, `foodActivityService.js`
- `ClusterPage.jsx`, `WhatPeopleAreEating.jsx`, `WhatDinersAreSaying.jsx`
- Prior social-engine handoffs (Phases 5–8)

## Database Queries Executed

None against production in this pass (local code + contract tests only).

## Changes Made

- Migration `0248`: `cluster_restaurants.is_campus_dining`
- `GET /public/clusters/:slug/campus-dining`
- USC seed script (3 halls) — dry-run / apply with production consent
- Place-only I'm Eating + place aggregation in people-eating
- FE `CampusDiningSection` (university + non-empty only)
- Waiter people-eating shaping for place shares (service only; no `FoodInterestsPage` edit)

## Commits

Not committed (await Andre).

## Deployment Status

Not deployed. Production tip unchanged. Apply path: `menubloc-backend-main` @ clean `main` after commit/push; FE from `menubloc-frontend-main`.

## Verification Results

- FE `node --test test/campusDiningContract.test.js` — pass
- BE `node --test test/campusDiningContract.test.js` — pass
- Live USC section / seed — not verified (migration not applied)

## Remaining Risks

- Seed INSERT may need column tweaks if live `restaurants` constraints differ
- Empty university clusters hide section (by design); no “coming soon” unless requested

## Follow-Up Work

1. Commit FE + BE  
2. Apply `0248` + seed USC with production consent  
3. Deploy BE then FE; smoke `/clusters/usc` Campus Dining  
4. Optional: more university halls when known (no web scrape pipeline)

## Final Verdict

Implementation is a small Cluster extension ready for commit → migrate → seed → deploy when authorized.
