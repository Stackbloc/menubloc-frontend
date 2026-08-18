# Diner compose — Instagram-easy add

**Date:** 2026-08-18  
**Agent/session:** Cursor  
**Branch:** `menubloc-frontend-main` @ `main`  
**Status:** LOCAL — not committed, not deployed

## Summary

Diner add surfaces use a one-line compose (type + Post, optional photo). My Menuply is the diner’s personal home. Meal times on What I Ate are labeled cards with a compose in each slot.

## Problem Statement

Andre asked for Instagram/Facebook ease of adding data on all diner pages/forms, plus the personal My Menuply structure (About Me with Connections, eating, plans with Invite Me/Join Me, wants, crews, events).

## Root Cause

Adds lived in stacked forms (meal chips, comment, photo, restaurant tag, crew settings, invite checkboxes) separate from the content.

## Evidence Collected

- What I Ate owner form had meal picker, name, tag, suggestions, comment, photo.
- What We Doing create had date, voting close, connection checkboxes, crew select.
- Dining Crews create required settings fields.
- My Menuply mixed connection-feed sections into a personal page.

## Files Examined

- `MyMenuplyPage.jsx`, `DinerIdentityHero.jsx`, `QuickCompose.jsx`
- `WhatIAteTodaySection.jsx`, `WhatWeDoingPage.jsx`, `DiningCrewsPage.jsx`

## Database Queries Executed

None.

## Changes Made

- Shared `QuickCompose` (text/date + optional photo + Post).
- My Menuply: six diner sections; Connections inside About Me; inline compose for eating, plans, crews.
- What I Ate: meal cards + one-line add per meal; no stacked add form.
- What We Doing: date + Post (URL `?with=` still applied).
- Dining Crews: name + Post on create; settings stay on crew detail.

## Commits

Not committed.

## Deployment Status

Not deployed. No CPD.

## Verification Results

Contract tests this turn.

## Remaining Risks

I'm Eating At still needs a restaurant (data model). Want-to-eat has no create API. Diner cannot create venue events.

## Follow-Up Work

CPD when Andre says `cpd`. Do not restore stacked add forms on these diner pages.

## Final Verdict

Adding on the diner personal surfaces is a one-line post, not a multi-field form.
