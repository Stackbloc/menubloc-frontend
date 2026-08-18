# Objective

Calendar eating plans with place + optional join seats; Invite Me under the section.

# Current Status

**CPD COMPLETE.** Live tip `n7gxy1luu` / `index-DbN-zhDW.js`. BE `2923b248` health MATCH. Migration `0271` applied.

# Files Changed

FE: `MyMenuplyPage.jsx`, `EatingPlanDayForm.jsx`, `WhatIAteTodayCalendar.jsx` (testId), `WhatWeDoingSessionPage.jsx`, `consumerApi.js`, `WhatDinersAreSaying.jsx`, `foodActivityApi.js`, contracts.

BE: migration `0271`, `whatWeDoingService.js`, `whatWeDoing.js` routes, `connectionsFoodLifeService.js`, `publicFoodActivity.js` (`GET …/upcoming-plans`).

# Database Changes

`0271` — `what_we_doing_sessions.restaurant_id`, `place_label`, `joinable`, `join_capacity`. Applied to production.

# Decisions Made

Reuse What We Doing sessions, not a new table. Joinable = accepted connections until capacity. Invite Me stays `/account/what-we-doing`, below the calendar.

# Remaining Work

None for this CPD. Profile line stays hidden until at least one diner has a named restaurant plan this week.

# Risks / Known Issues

None for this ship.

# Verification Status

Tip-gate PASS apex + www. Railway health MATCH `2923b248`. `0271` applied.

# Resume Instructions

Live. Next agent should not restore `lsmdx3d9x` unless rolling back this CPD.

# Git Status

FE `0d126d9` + docs lock. BE `2923b248` + docs lock.
