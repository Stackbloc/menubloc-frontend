# Cluster Feed Specification Alignment

**Date:** 2026-08-15  
**Spec:** `docs/architecture/2026-08-15_cluster-feed-specification.md`

## Summary

Revised Cluster Feed to match the authoritative public food-activity stream spec: diner + Menuply data only, freshness, sectioned overview, no external-event dependency, Waiter consumes the same builder.

## Problem Statement

Earlier Phase 6 feed copy drifted toward “Where is everyone eating today?” and clickable venue stubs. Spec requires a public auto-generated food stream answering “What's happening with food here?”, with relative timestamps, safe popularity language, and strict privacy.

## Root Cause

Product framing was incomplete relative to the full Cluster Feed specification (freshness, sections, anti-“everyone”, deferred sources).

## Evidence Collected

- Live tip already served `index-BPqyQY7M.js` / BE `f6c39af9` from prior CPD partial.
- Builder previously omitted relative `reported_ago` and section keys.
- No external-event queries in builder (confirmed by contract).

## Files Examined / Changed

**Docs**

- `docs/architecture/2026-08-15_cluster-feed-specification.md` (new, authoritative)
- This audit

**Backend (`menubloc-backend-main`)**

- `src/services/clusterReportFeed/clusterFeedFreshness.js` (new)
- `src/services/clusterReportFeed/clusterReportFeedService.js`
- `src/services/waiter/waiterClusterReportService.js` (hierarchy string)
- `test/clusterFeedFreshnessContract.test.js`
- `test/publicClusterFeedPhase6Contract.test.js`
- `test/waiterClusterReportContract.test.js`

**Frontend (`menubloc-frontend-main`)**

- `src/components/cluster/ClusterPublicFeed.jsx`
- `test/publicClusterFeedPhase6Contract.test.js`

## Database / Schema Changes

None in this revision.

## API Changes

`GET /public/clusters/:slug/feed` response adds:

- `question`
- `external_events_required: false`
- `crew_deals: false`
- Per-item: `section`, `section_label`, `reported_ago`, `freshness_ms`

Waiter hierarchy string: `… → waiter → subscribers`

## Feed Architecture

```
Diner activity → Public Cluster Feed → Waiter → Subscribers
```

Single builder `buildClusterReportSection`. Sources: public diner statuses, public food photos, activity aggregates, new restaurants, deals. No events. No private crew/conversation/invite queries.

## UI Changes

- Headline: **What's happening with food here?**
- Lead: Food activity across {cluster} — from Menuply diners and Menuply data
- Grouped sections when populated
- Relative **Reported … ago** lines
- No venue `<Link>` titles

## Privacy Handling

- Photos: `visibility = 'public'` only
- Builder does not query crew messages / eat invitations / private conversations
- Crew Deals not implemented

## Tests

- `node test/clusterFeedFreshnessContract.test.js`
- `node test/publicClusterFeedPhase6Contract.test.js`
- `node test/waiterClusterReportContract.test.js`
- FE `node test/publicClusterFeedPhase6Contract.test.js`

## Validation Matrix

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Every cluster can have public feed | Pass (slug route) |
| 2 | View without subscribe | Pass (`subscription_required: false`) |
| 3 | Public diner statuses | Pass (signals → food_buzz / conditions) |
| 4 | Public food photos | Pass |
| 5 | Public conversations | Deferred (architecture reserved; not leaking private) |
| 6 | Dining conditions + timestamp | Pass (Busy + `reported_ago`; fuller vocab deferred) |
| 7 | Stale conditions not current | Pass (3h window) |
| 8 | Meaningful activity → places | Pass (safe popularity copy) |
| 9 | Public crew activity | Deferred |
| 10 | Private never leaks | Pass (no private queries in builder) |
| 11 | Menuply restaurant/menu data | Pass (new + deals) |
| 12 | No manual event workflow | Pass |
| 13 | Waiter same underlying activity | Pass |
| 14 | Waiter private/personalized | Pass (subscriptions) |
| 15 | No duplicate Waiter generator | Pass |
| 16 | Existing functionality intact | Contracts pass; no deploy this turn |

## Deployment Status

**Local only** — not CPD’d in this turn. Prior tip may still be older UI until next CPD.

## Remaining Risks / Follow-Up

- Expand condition vocabulary (very busy / short line / …) with migration when ready
- Public conversation + public crew projections
- Light trend cards
- CPD when Andre requests

## Final Verdict

Specification documented and core public feed + Waiter path aligned. Deferred sources intentionally not forced; feed functions without them and without external events.
