# Diner Primary Location + Find Diners + Geographic Intelligence

**Date:** 2026-08-20  
**Scope:** Coordinated social-graph + geographic consumer intelligence foundation

## Summary

Implemented diner Primary Location (canonical `us_cities` reference), privacy-safe discoverability (`nobody` default), Find Diners search with connection integration, and owner-facing aggregated diner geography APIs. No GPS tracking, no street addresses on public surfaces, no duplicate friend system.

## Problem Statement

Menuply needed to know where diners are generally based, let diners find appropriate people, and measure consumer network growth by market — without exposing residential data or breaking existing social/connection architecture.

## Root Cause

Prior location data was split across `consumer_saved_locations` (search/discovery GPS), `home_zip`, and `market_signup_log` with no canonical primary market on the profile, no discoverability controls, and no diner search.

## Evidence Collected

- `consumer_profiles` had no `primary_us_city_id` or discoverability column
- `/public/locations/states` and `/public/locations/cities` existed but FE did not consume them
- Connections used `user_connections` with QR + manual member ID only
- Owner market expansion used `market_signup_log`, not profile primary location

## Files Examined

- `menubloc-backend-main/src/routes/consumer/profile.js`
- `menubloc-backend-main/src/services/consumerConnections/consumerConnectionsService.js`
- `menubloc-backend-main/src/services/locations/locationReferenceService.js`
- `menubloc-frontend-main/src/pages/consumer/ConsumerProfile.jsx`
- `menubloc-frontend-main/src/pages/consumer/AccountWelcome.jsx`

## Database Changes

Migration `20260820_0276_diner_primary_location.sql`:

- `consumer_profiles.primary_us_city_id` → FK `us_cities.id`
- `primary_country_code`, `primary_neighborhood`, `primary_postal_code` (internal)
- `discoverability` enum: `members` | `area` | `nobody` (default `nobody`)
- `consumer_diner_cluster_affiliations` for primary-location → cluster linkage

## Changes Made

### Backend

- `dinerPrimaryLocationService.js` — canonical location CRUD, public label projection, cluster sync
- `dinerSearchService.js` — privacy-filtered search with relevance ranking + mutual connections
- `dinerGeographicIntelligenceService.js` — aggregated market counts (no PII)
- Routes: `PUT /api/consumer/profile/primary-location`, `GET /api/consumer/diners/search`, owner `/api/owner/diner-geography/*`
- Extended `GET/PUT /api/consumer/profile` with `primary_location`, `discoverability`, `profile_completion`
- Public `GET /public/locations/cities/search`

### Frontend

- `PrimaryLocationPicker.jsx` — state + city canonical picker
- `FindDinersPage.jsx` — `/account/find-diners`
- Profile tab: Location + Who can find me?
- Account welcome: recommended primary location step
- My Menuply: profile completion banner + city/state display on identity hero

## Verification Results

- `node test/dinerPrimaryLocationContract.test.js` (BE) — pass
- `node --test test/dinerPrimaryLocationContract.test.js` (FE) — pass
- Migration not applied to production DB in this session
- No production deploy attempted

## Remaining Risks

- Migration `0276` must be applied on Railway before live API fields work
- Existing diners remain `discoverability = nobody` until they opt in
- Owner diner geography dashboard UI is API-only MVP; counts require primary locations to be set
- International non-US primary locations deferred (country column present; city FK is US `us_cities` only)

## Follow-Up Work

- Minimal owner UI for `/api/owner/diner-geography/summary`
- Backfill primary location from `market_signup_log` + zip where possible (optional migration script)
- Expose public city/state on connection peer cards and Diner QR landing when approved

## Final Verdict

**Implementation complete locally** — pending DB migration + deploy verification for production acceptance.
