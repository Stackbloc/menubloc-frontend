# Social tab connections, groups, and events handoff

## Objective

Show on the user social screen: connection count, clickable Connections, groups associated with the user, and events associated with the user.

## Current Status

Implemented locally on `menubloc-frontend-main` and `menubloc-backend-main`. Not committed/deployed.

## Files Changed

- BE: `venueEventGroupsService.js` (`listMyRsvps`, `listMyEventGroups`), `eventGroups.js` (`GET /my/events`, `GET /my/event-groups`), `venueEventGroupsContract.test.js`
- FE: `SocialCrewTab.jsx`, `ConsumerConnectionPeerPage.jsx` (new), `ConsumerConnections.jsx`, `WhatWeDoingPage.jsx`, `App.jsx`, `consumerApi.js`, account/social contracts

## Database Changes

None. Reads existing RSVP and event-group membership tables.

## Decisions Made

- Connections remain Connections, not Friends.
- Clickable connection opens `/account/connections/:peerId` (Start a plan + All Connections), not a public diner profile.
- Groups = Dining Crews + venue event groups the user belongs to.
- Events = published venue events with viewer RSVP `going` or `interested`.
- What We Doing `?with=` pre-selects that Connection when starting a plan.

## Remaining Work

CPD from authorized `*-main` when Andre asks.

## Risks / Known Issues

Live BE does not serve `/api/consumer/my/*` until backend deploy. FE empty-states catch failed loads.

## Verification Status

Contracts listed in the audit — pass. Waiter files untouched.

## Resume Instructions

Do not add dining-hall menus. Do not put events into Waiter. Deploy only from `menubloc-frontend-main` / `menubloc-backend-main`.

## Git Status

Dirty working trees on FE-main and BE-main until commit/CPD.
