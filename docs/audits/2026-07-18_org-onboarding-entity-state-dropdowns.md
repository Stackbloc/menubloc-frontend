# Organization Onboarding Entity + State Dropdowns

**Date:** 2026-07-18  
**Status:** CPD complete — live on menuply.com  
**Commit:** `d078972` (`feature/mds-homepage-controls`)  
**Deploy:** `menubloc-frontend-bjxktet9u-menuply.vercel.app` → aliased to `menuply.com`  
**Bundle:** `index-D0uR9gfu.js`  
**Route:** `/restaurant/onboarding/organization`  

---

## Summary

Fixed the dead Entity type control (sole-proprietor checkbox disabled the `<select>`) and converted State of formation from free text to a US-state dropdown. Updated example copy so it is not synonym pairs.

---

## Problem Statement

On Business Organization onboarding, Entity type looked broken: default `is_sole_proprietor: true` disabled the select. State of formation was a free-text input (`e.g. CA, DE`). Copy used synonym-style examples (“Individual / sole proprietor”, “sole proprietor name or LLC”).

---

## Root Cause

Checkbox + `disabled={form.is_sole_proprietor === true}` made the entity dropdown non-interactive on load. Jurisdiction never used the Locations `US_STATE_OPTIONS` list.

---

## Evidence Collected

- Plan: `org_form_dropdowns_9d8b5b87.plan.md`
- Locations redesign audit follow-up: “ship pending Organization entity-type / jurisdiction dropdown plan separately”

---

## Files Examined / Changed

- `src/pages/RestaurantOnboardingOrganization.jsx`
- `src/lib/businessOrganizationSchema.js`
- `src/lib/locationEntryPolicy.js` (reuse `US_STATE_OPTIONS`)
- `test/businessOrganizationOnboardingContract.test.js`

---

## Database Queries Executed

None.

---

## Changes Made

- Removed sole-proprietor checkbox and `is_sole_proprietor` wiring
- Entity type always-enabled; label `Sole proprietor`
- Copy: LLC/corporation examples
- State of formation US-state `<select>`
- Contract tests updated

---

## Commits

Not committed.

---

## Deployment Status

Local only.

---

## Verification Results

13/14 contract tests pass; 1 pre-existing checkpoint next-route assertion fails (unrelated).

---

## Remaining Risks

Await CPD for menuply.com.

---

## Follow-Up Work

Commit + vercel prod + alias; human verify.

---

## Final Verdict

**LOCAL COMPLETE** — awaiting deploy.
