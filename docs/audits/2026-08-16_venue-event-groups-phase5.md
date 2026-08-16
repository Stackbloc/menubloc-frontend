# Venue Event Groups Phase 5 — Audit

**Date:** 2026-08-16  
**Scope:** Phase 5 only. Phase 6 (group volume offers) skipped per Andre.

## Summary

Event-linked social groups + RSVP on published venue events. Reuses diner identity and optional Dining Crew link. Private member lists stay hidden. Ticket purchase remains Phase 4 stub.

## Separation

Venue → Event → Ticket (unchanged)  
Event → Social Group → Members (new)

## Files

**BE:** `0261` migration, `venueEventGroupsService.js`, `consumer/eventGroups.js`, public events social projection, package module `event_groups=ready`, `group_offers=shell (skipped)`.

**FE:** Event detail social section, `/events/groups/:slug`, invite accept page, consumerApi helpers.

## Verification

Contract tests PASS locally.

## Final Verdict

Phase 5 local complete. Phase 6 not implemented.
