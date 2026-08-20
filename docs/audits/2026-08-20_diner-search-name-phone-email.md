# Diner Find: searchable by name, phone, email (opt-in)

**Date:** 2026-08-20  
**Scope:** Extend Find Diners match keys for opted-in discoverability; reuse existing Connect

## Summary

When a diner elects to be searchable (`discoverability` = `members` or `area`), Find Diners can match them by **name**, **phone number**, or **email**, in addition to existing name/city/school/member-ID paths. Email and phone are match keys only — never returned on result cards. Existing **Connect** (`user_connections`) remains the friend-request equivalent.

## Problem Statement

Privacy radios allowed search visibility, but Find Diners only matched display/legal name, location, and school — not the contact identifiers people naturally use to find someone.

## Root Cause

[`dinerSearchService.js`](../../menubloc-backend-main/src/services/dinerLocation/dinerSearchService.js) ILIKE clauses omitted `consumer_users.email` and `phone_number`.

## Evidence Collected

- Discoverability gate already excluded `nobody`
- `shapeSearchResult` never exposed email/phone
- FE Find Diners + Connect already shipped; Social & Crew linked to `/account/find-diners`

## Files Examined

- `menubloc-backend-main/src/services/dinerLocation/dinerSearchService.js`
- `menubloc-frontend-main/src/pages/consumer/FindDinersPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/accountDashboard/ProfileTab.jsx`
- `menubloc-frontend-main/src/pages/consumer/accountDashboard/SocialCrewTab.jsx`

## Database Queries Executed

None (read-path SQL change only; no migration).

## Changes Made

- Exact email match (`LOWER(TRIM(cu.email))`) when query is email-shaped
- Phone match via soft E.164 + digit-stripped equality when query is phone-shaped
- Relevance boosts 1100 (email) / 1050 (phone)
- Profile / Find Diners / Social & Crew copy updated
- Contract tests extended

## Commits

(Filled at CPD.)

## Deployment Status

(Filled at CPD.)

## Verification Results

- `node test/dinerPrimaryLocationContract.test.js` (BE) — pass
- `node --test test/dinerPrimaryLocationContract.test.js` (FE) — pass

## Remaining Risks

- Phone queries that look like long member IDs prefer phone match (≥7 digits)
- Partial email fishing intentionally blocked (exact only)

## Follow-Up Work

None required for this scope.

## Final Verdict

Implementation complete locally; CPD pending at end of session.
