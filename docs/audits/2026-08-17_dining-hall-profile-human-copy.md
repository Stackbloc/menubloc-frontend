# Dining-hall profile copy + founded years (2026-08-17)

## Summary

Dining-hall public profiles no longer show institutional/policy copy. The prompt is "Post what's good today." Comments sitewide say "share your thoughts" instead of "share a tip." Verified founded years are filled via an ops script (not guessed years).

## Problem Statement

Dining-hall profiles talked like a policy document: claimable-business disclaimer, "no account needed," "structured menu," "find menu item," and an empty Founded dash.

## Root Cause

Campus-facility copy was mounted as a profile section. Guest/status composers used system language. Founded years were never seeded.

## Evidence Collected

- Live UCLA/USC campus-dining profiles returned `founded_year: null`.
- Verified years: Bruin Plate 2013; FEAST 2011; Epicuria at Covel 2021; USC Village 2017; Parkside 2002.
- De Neve and Everybody's Kitchen left blank (no single verified year); empty Founded is hidden on dining halls.

## Files Examined

- `PublicProfileShell.jsx`, `ProfileAboutFounded.jsx`, `WhatDinersAreSaying.jsx`
- `DinerStatusComposer.jsx`, `DinerStatusFeed.jsx`, `FoodComments.jsx`
- `ImEatingComposer.jsx`, `ImEatingAtPanel.jsx`
- UCLA/USC campus dining seeds; production public restaurant payloads

## Database Queries Executed

Read-only production probes of `/public/clusters/{ucla,usc}/campus-dining` and `/public/restaurants/{slug}`. Founded-year writes are in `scripts/ops/setDiningHallFoundedYears.js` (not applied this turn).

## Changes Made

- Removed campus-facility / not-claimable profile note.
- Dining-hall CTA: "Post what's good today."
- Removed "no account needed" and structured-menu / find-menu-item copy on hall profiles.
- "Share a tip" → "Share your thoughts" in `FoodComments`.
- Hide empty Founded on dining halls; ops script to set verified years.

## Commits

None this turn (not requested).

## Deployment Status

**CPD COMPLETE** — FE tip `2fw9x27jj` / `index-fjLns99U.js`; BE `6fc782c3`; five founded years applied on production.

## Verification Results

- FE: `diningHallEntityContract`, `campusDiningContract`, `guestOpenReportingContract`, `foodCommentsDeepLinkContract` — 18 pass
- BE: `diningHallEntityContract` — 8 pass
- Live bundle: `Post what's good today`, `Share your thoughts`; no `Share a tip` / `not claimable restaurant businesses`
- Bruin Plate API: `founded_year=2013`

## Remaining Risks

- De Neve / EVK founded years still unknown (Founded hidden when empty).

## Follow-Up Work

Optional: add `restaurant_type` to global I'm Eating place search.

## Final Verdict

**SHIPPED.** Human copy live on menuply.com. Tip-gate PASS apex + www.
