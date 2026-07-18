# Locations Onboarding Entry Box Redesign

**Date:** 2026-07-18  
**Status:** CPD complete — live on menuply.com  
**Commit:** `ac476d6` (`feature/mds-homepage-controls`)  
**Deploy:** `menubloc-frontend-ebtcqu09e-menuply.vercel.app` → aliased to `menuply.com`  
**Bundle:** `index-B3sdHgsz.js` (matches vite build; placeholders + Select state present; API Railway 58 / localhost ≤6)  

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

- `ac476d6` — fix(onboarding): redesign Locations entry to white shell with field cues

---

## Deployment Status

- Pushed `feature/mds-homepage-controls`
- `npx vercel --prod` → `https://menubloc-frontend-ebtcqu09e-menuply.vercel.app`
- `npx vercel alias set … menuply.com` — success
- Live bundle `index-B3sdHgsz.js` contains Locations placeholders + State select

---

## Verification Results

- `node --test test/onboardingLocationsContract.test.js` — 12 pass
- menuply.com HTML → `index-B3sdHgsz.js`
- Bundle: `Downtown patio or Main Street`, `Select state`, `menubloc-backend-production` ≫ `localhost:3001` (6)

---

## Remaining Risks

- Non-US countries not selectable yet (US-only by product decision)
- Residual `#f7f4ef` / `#efe8df` strings may still exist elsewhere in the bundle (not Locations page)

---

## Follow-Up Work

- Optional: ship pending Organization entity-type / jurisdiction dropdown plan separately
- Human verify on `/restaurant/onboarding/locations`

---

## Final Verdict

CPD complete. Locations redesign is live on menuply.com; human should confirm the form UI.
