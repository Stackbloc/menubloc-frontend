# Locations Onboarding Entry Box Redesign

**Date:** 2026-07-18  
**Status:** Implemented locally — not committed / not deployed  

---

## Summary

Redesigned `/restaurant/onboarding/locations` manual entry to match the white Organization onboarding shell: dark readable labels, placeholders on every field, State and Country as selects, no cream gradient, no duplicate Add location control while the form is open.

---

## Problem Statement

The Locations stage used a cream gradient (`#f7f4ef` → `#efe8df`), labels without explicit dark color (poor contrast), blank inputs with no placeholders, free-text State (`maxLength={2}`), and a duplicate “Add location” button while the form was open — users described the box as sloppy and unclear.

---

## Root Cause

Locations shipped (commit `0fcec77`) with a separate Instrument Sans / cream visual system instead of the approved Organization white shell (`#ffffff`, system font, `#1f2937` labels).

---

## Evidence Collected

- Screenshot: tan/cream page, blank form fields, illegible labels
- Code: `background: linear-gradient(180deg, #f7f4ef 0%, #efe8df 100%)`
- Form field map had no `placeholder`; State was `<input maxLength={2}>`

---

## Files Examined

- `menubloc-frontend/src/pages/RestaurantOnboardingLocations.jsx`
- `menubloc-frontend/src/lib/locationEntryPolicy.js`
- `menubloc-frontend/src/pages/RestaurantOnboardingOrganization.jsx` (chrome reference)
- `menubloc-frontend/test/onboardingLocationsContract.test.js`

---

## Database Queries Executed

None.

---

## Changes Made

- White page shell aligned with Organization (BrandLogo 48/14, max-width 640)
- `US_STATE_OPTIONS` + `LOCATION_COUNTRY_OPTIONS` in `locationEntryPolicy.js`
- State `<select>` (50 + DC); Country select locked to US
- Placeholders on all manual fields
- Outer “Add location” hidden while form open
- Bulk card shortened; same gray card language
- Contract tests for white shell, placeholders, State select, invalid state code

---

## Commits

None (per restrictions).

---

## Deployment Status

Not deployed.

---

## Verification Results

- `node --test test/onboardingLocationsContract.test.js` — 12 pass

---

## Remaining Risks

- Production still serves cream shell until FE deploy + `menuply.com` alias
- Non-US countries not selectable yet (US-only by product decision)

---

## Follow-Up Work

- Deploy frontend + alias verify
- Optional: ship pending Organization entity-type / jurisdiction dropdown plan separately

---

## Final Verdict

Local redesign complete and contract-tested. Ready for commit/deploy when requested.
