# Bulk Location Import Validate/Confirm Failure

**Date:** 2026-07-18  
**Status:** Fixed locally — deploying with this change  

---

## Summary

Bulk Location Import appeared broken: Validate returned `Valid: 0 · Issues: 0 · Ready: no` with no useful error, and Confirm stayed disabled. Root cause: freeform street text was treated as the CSV header line, producing zero data rows and zero issues.

---

## Problem Statement

Operator pasted `501 east adams street chicago IL 63121` into Paste CSV and clicked Validate & preview. UI showed Ready: no with empty issues; Confirm import did nothing useful.

---

## Root Cause

`parseCsv` always treated line 1 as headers and lines 2+ as data. A single freeform address became headers only → `rows: []`, `issues: []`, `import_ready: false`. Confirm requires `import_ready`.

Secondary: preview lived only in an in-memory `Map`, which fails across Railway instances / restarts.

---

## Evidence Collected

- Screenshot: Valid 0 / Issues 0 / Ready no after freeform paste
- Code path: `ownedLocationsService.parseCsv` → `validateBulkImport`

---

## Files Changed

- `menubloc-backend/src/services/restaurants/ownedLocationsService.js` — header detection, clear issues, draft-backed preview
- `menubloc-backend/src/routes/operator/onboardingLocations.js` — pass `anchorRestaurantId` on confirm
- `menubloc-backend/test/ownedLocationsService.test.js` — freeform + draft fallback tests
- `menubloc-frontend/src/pages/RestaurantOnboardingLocations.jsx` — example CSV, surface API message/issues
- `menubloc-frontend/test/onboardingLocationsContract.test.js`

---

## Verification Results

- `node test/ownedLocationsService.test.js` — ok
- `node --test test/onboardingLocationsContract.test.js` — 12 pass

---

## Final Verdict

Validate now returns an explicit `missing_header` issue for freeform paste. Proper CSV still validates and confirms; preview survives via onboarding draft payload.
