# Dining-hall profile copy + founded years

## Objective

Make dining-hall profiles talk like people, fill Founded when known, and change "share a tip" to "share your thoughts."

## Current Status

LOCAL code complete. Not committed. Not deployed. Founded-year ops script authored, not applied to production.

## Files Changed

FE (`menubloc-frontend-main`):
- `PublicProfileShell.jsx` — removed campus-facility note; `omitEmptyFounded` for halls
- `ProfileAboutFounded.jsx` — hide empty Founded when `omitEmptyFounded`
- `DinerStatusComposer.jsx` / `DinerStatusFeed.jsx` / `WhatDinersAreSaying.jsx` — "Post what's good today."
- `FoodComments.jsx` — share your thoughts; dining-hall placeholder
- `ImEatingComposer.jsx` / `ImEatingAtPanel.jsx` — skip menu-item finder on halls

BE (`menubloc-backend-main`):
- `scripts/ops/setDiningHallFoundedYears.js` — verified years by slug, no overwrite

## Database Changes

None applied. Script will SET `founded_year` on matching `dining_hall` rows where currently null.

## Decisions Made

- Do not invent De Neve / EVK years.
- Guests can still post; we just deleted the "no account needed" sentence.
- Dining halls stay non-claimable in the claim API; that copy is not shown on the profile.

## Remaining Work

1. Apply founded-year ops script on production.
2. Commit + CPD when Andre asks.
3. Optional: add `restaurant_type` to I'm Eating place search so the global I'm Eating page also skips dish lookup for halls.

## Risks / Known Issues

Empty Founded is hidden until years are applied. Claim API still rejects dining-hall claims.

## Verification Status

FE 18 contract tests pass. BE dining-hall contract 8 pass.

## Resume Instructions

1. Confirm FE copy still contains "Post what's good today" and "Share your thoughts".
2. Apply `scripts/ops/setDiningHallFoundedYears.js --apply --allow-production`.
3. Probe `/public/restaurants/bruin-plate-los-angeles` for `founded_year: 2013`.

## Git Status

Uncommitted on `menubloc-frontend-main` and `menubloc-backend-main` (also unrelated site-activity files present — do not mix).
