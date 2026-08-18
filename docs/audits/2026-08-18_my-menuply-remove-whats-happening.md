# My Menuply — remove What's happening

**Date:** 2026-08-18  
**Agent/session:** Cursor  
**Branch:** `menubloc-frontend-main` @ `main`  
**Status:** LOCAL — not committed, not deployed

## Summary

Removed the public **What's happening** section from My Menuply. That page is the diner's personal food/social home. Public/nearby activity stays on Waiter.

## Problem Statement

My Menuply showed a "What's happening" heading that linked to `/waiter#activity` (public and nearby food activity, not connections). Andre asked to delete it because this is the user's personal page.

## Root Cause

After Activity moved onto Waiter, My Menuply still kept a public-activity teaser section (`data-testid="public-activity"`).

## Evidence Collected

- `MyMenuplyPage.jsx` had a section titled "What's happening" with copy "Public and nearby food activity — not your connections" and `to="/waiter#activity"`.
- Waiter still mounts additive `WaiterPublicActivity` (`id="activity"`). `/activity` still redirects to `/waiter#activity`. Those files were not edited.

## Files Examined

- `menubloc-frontend-main/src/pages/consumer/MyMenuplyPage.jsx`
- `menubloc-frontend-main/test/myMenuplyFourQuestionsContract.test.js`
- Waiter files inspected only (not modified)

## Database Queries Executed

None.

## Changes Made

- Deleted the My Menuply public-activity section.
- Contract: My Menuply must not contain `What's happening`, `public-activity`, or `/waiter#activity`.

## Commits

Not committed.

## Deployment Status

Not deployed. No CPD.

## Verification Results

See handoff. Waiter files not modified.

## Remaining Risks

Diners who used My Menuply as a shortcut to public Activity now go through Waiter (bottom nav) or `/activity`.

## Follow-Up Work

CPD only when Andre says `cpd`. Do not restore this section onto My Menuply.

## Final Verdict

My Menuply is personal only for this block. Public happening remains on Waiter.
