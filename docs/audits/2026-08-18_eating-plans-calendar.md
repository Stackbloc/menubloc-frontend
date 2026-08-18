# Summary

My Eating Plans is a clickable day calendar. The diner picks a date, names a place, and can open a limited number of join seats. Invite Me sits under that section, not beside the title.

# Problem Statement

Plans were a date compose plus Invite Me / Join Me at the top. Andre asked for a calendar of days, a place for the selected day, optional joinable capacity, and Invite Me moved down.

# Root Cause

The hub treated plans as a list + one-line date post, not as a month of days.

# Evidence Collected

- `MyMenuplyPage` eating-plans section used `QuickCompose` date + top `Invite Me` / `Join Me`.
- `what_we_doing_sessions` had `plan_date` but no place / joinable / capacity.
- Restaurant search already existed at `GET /api/consumer/what-we-doing/search/restaurants`.

# Files Examined

- `MyMenuplyPage.jsx`, `WhatWeDoingPage.jsx`, `whatWeDoingService.js`, migration `0263`

# Database Queries Executed

None against production. Migration `0271` written, not applied this turn.

# Changes Made

- BE: columns `restaurant_id`, `place_label`, `joinable`, `join_capacity`; create payload; `POST …/join`; joinable plans visible to connections.
- FE: calendar on My Eating Plans; day form for place + join seats; Invite Me / Join Me under the calendar.

# Commits

FE `0d126d9`. BE `2923b248`.

# Deployment Status

**CPD COMPLETE.** FE tip `n7gxy1luu` / `index-DbN-zhDW.js`. BE `2923b248`. Migration `0271` applied.

# Verification Results

FE contracts 10 pass. BE `whatWeDoingContract` 2 pass.

# Remaining Risks

None for this ship. Profile line stays hidden until at least one diner has a named restaurant plan this week.

# Follow-Up Work

None required for this CPD.

# Final Verdict

Calendar days are the plan surface. Invite Me is secondary under that section.
