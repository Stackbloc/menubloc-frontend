# My Menuply — clickable labels, no click-coaching

**Date:** 2026-08-18  
**Agent/session:** Cursor  
**Branch:** `menubloc-frontend-main` @ `main`  
**Status:** LOCAL — not committed, not deployed

## Summary

Renamed **Eating Plans** to **My Eating Plans**. Section titles are the click targets. Removed See all / Add photo / Create Eating Plan / Find food / Find events and tap-to instructional copy.

## Problem Statement

Andre asked for **My Eating Plans**, clickable labels, and no directional text telling people to click to take an action.

## Root Cause

`SectionHead` always rendered a side action (`See all` by default) plus optional `desc` lines that coached taps.

## Evidence Collected

- `MyMenuplyPage.jsx` section heads and empty-state copy.
- `SectionHead` in `myMenuplyBits.jsx`.

## Files Examined

- `MyMenuplyPage.jsx`, `myMenuplyBits.jsx`, `myMenuplyFourQuestionsContract.test.js`

## Database Queries Executed

None.

## Changes Made

- Title **My Eating Plans**.
- `SectionHead` is title-only; `to` makes the title a link.
- Dropped instructional empty-state coaching on this page.
- **Where I Eat** title links to `/account/following`.

## Commits

Not committed.

## Deployment Status

Not deployed. No CPD.

## Verification Results

Contract tests this turn.

## Remaining Risks

Footer still says **Eating Plans** (not renamed; this turn was the personal page). Hero **Add a dining photo** is identity upload, not a section CTA.

## Follow-Up Work

CPD when Andre says `cpd`.

## Final Verdict

Hub labels are clickable names. No click-coaching on the section heads.
