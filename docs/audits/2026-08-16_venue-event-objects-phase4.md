# Venue Event Objects Phase 4 — Audit

**Date:** 2026-08-16  
**Scope:** Phase 4 only (no Groups / group ticketing / Meet Me Here)

## Summary

Reusable `venue_events` + `venue_event_ticket_types` for restaurants with Venue capability. Operator CRUD, public `/events/:slug`, profile Upcoming Events filled from published rows. Purchase checkout stubbed (`purchase_enabled` forced false).

## Problem Statement

Phase 3 left `upcoming_events: []` and package modules as shell. Needed Event objects without inventing payment or restaurant_type=venue.

## Root Cause

N/A — greenfield on Phase 3 stubs.

## Evidence Collected

- Phase 3 capability table `0259` / `restaurantCapabilityService`
- Deals CRUD as operator UX model
- No reuse of `restaurant_status_events` or `destination_venues`

## Files Examined / Changed

**BE:** migration `0260`, `venueEventService.js`, `operator/events.js`, `publicEvents.js`, capability projection, `server.js`, operator index, contract test.

**FE:** `OperatorEventsEditor.jsx`, `EventDetailPage.jsx`, package page link, `ProfileUpcomingEvents.jsx`, `App.jsx`, `operatorApi.js`, contract test.

## Database

`20260816_0260_venue_events.sql` — apply on CPD.

## Verification

- `node test/venueEventsContract.test.js` PASS (BE)
- `node test/venueEventsContract.test.js` PASS (FE)
- Age assertion unit checks PASS

## Remaining Risks

- Purchase still stubbed until commerce attach
- Media upload not wired (cover_photo_url field only)

## Final Verdict

Phase 4 implementation complete locally; production ship awaits CPD.
