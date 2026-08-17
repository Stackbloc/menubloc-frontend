# Social tab connections, groups, and events

## Summary

The account **Social & Crew** tab now always shows the connection count, a clickable list of accepted Connections, Dining Crews plus the viewer’s event groups, and venue events the diner marked Going or Interested. Connections are still not a Friend list. Dining-hall menus are unused.

## Problem Statement

Social & Crew loaded connections and crews but hid the accepted list behind a count (and hid that count when a pending request existed). Groups were Dining Crews only. Venue event RSVPs and event-group memberships were not on the social screen.

## Root Cause

Dashboard composition treated Connections as a manage-link + pending-request strip, not a roster. No consumer list endpoints existed for `venue_event_rsvps` or `venue_event_group_members`.

## Evidence Collected

- `SocialCrewTab.jsx` previously rendered pending incoming **or** a count string; accepted rows were not listed.
- `ConsumerConnections.jsx` listed accepted names without links.
- `GET /api/consumer/connections` already returns `accepted` + `pending_incoming`.
- Event RSVP/group writes existed (`POST /api/consumer/events/:id/rsvp`, event-group join) without a “mine” list.

## Files Examined

- `SocialCrewTab.jsx`, `ConsumerConnections.jsx`, `ConsumerProfile.jsx`
- `consumerApi.js`, `App.jsx`
- `venueEventGroupsService.js`, `eventGroups.js`
- Account dashboard + venue event group contracts

## Database Queries Executed

None against production. New list queries read existing `venue_event_rsvps` and `venue_event_group_members` (migration `0261`). Missing-table `42P01` returns `[]`.

## Changes Made

- BE: `GET /api/consumer/my/events`, `GET /api/consumer/my/event-groups`
- FE: Social tab Connections / Groups / Events sections; `/account/connections/:peerId`; What We Doing `?with=`
- Connection names on `/account/connections` link to the peer page

## Commits

Not committed until Andre asks / CPD.

## Deployment Status

Local on `menubloc-frontend-main` and `menubloc-backend-main`. Not deployed.

## Verification Results

- `node test/venueEventGroupsContract.test.js` — PASS
- `node --test test/accountDashboardContract.test.js` (+ related account-entry contracts) — PASS
- `npx vitest run test/socialEngineLoopContract.test.js` — PASS
- Production unauthenticated probe: `GET /api/consumer/my/events` and `/my/event-groups` → **401 Authentication required** (same as `/connections`). Live lists require BE deploy + a signed-in diner.
- Waiter files not edited

## Remaining Risks

- Empty events/groups until the diner RSVPs or joins a group.
- Peer page is a Connection card (plan / manage), not a public diner profile.

## Follow-Up Work

CPD when Andre asks. Optional later: public diner profile for Connections.

## Final Verdict

Social tab now presents connection count + clickable Connections, groups (Dining Crew + event groups), and associated venue events. Identity social remains account-gated.
