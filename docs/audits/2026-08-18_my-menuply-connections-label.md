# My Menuply — My Connections first

**Date:** 2026-08-18  
**Agent/session:** Cursor  
**Branch:** `menubloc-frontend-main` @ `main`  
**Status:** LOCAL — not committed, not deployed

## Summary

Renamed **What My Connections Are Eating** to **My Connections**, placed it above **What I'm Eating**, and made the heading open the connections eating list.

## Problem Statement

Andre asked for the shorter label **My Connections**, first on the personal page, with a click showing what connections are eating.

## Root Cause

The hub used the long four-questions heading, sat below the diner's own eating photos, and only the small "See all" link was clickable.

## Evidence Collected

- `MyMenuplyPage.jsx` section order and `SectionHead` title/`to`.
- Destination already existed: `/my-menuply/connections-eating` → `listConnectionsEating`.

## Files Examined

- `MyMenuplyPage.jsx`
- `myMenuplyBits.jsx` (`SectionHead`)
- `ConnectionsEatingPage.jsx`
- `myMenuplyFourQuestionsContract.test.js`

## Database Queries Executed

None.

## Changes Made

- Title **My Connections**; section before What I'm Eating.
- `SectionHead` title is a link when `to` is set.
- Destination page header **My Connections**; still loads eating activity.

## Commits

Not committed.

## Deployment Status

Not deployed. No CPD.

## Verification Results

Contract tests run this turn.

## Remaining Risks

**What My Connections Are Planning** is unchanged. Title-as-link now applies to every `SectionHead` with `to`.

## Follow-Up Work

CPD when Andre says `cpd`.

## Final Verdict

My Connections is first on My Menuply and opens what they are eating.
