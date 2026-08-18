# Objective

Calendar eating plans with place + optional join seats; Invite Me under the section.

# Current Status

Implemented locally on `menubloc-frontend-main` and `menubloc-backend-main`. Not committed unless Andre says so. Not deployed.

# Files Changed

FE: `MyMenuplyPage.jsx`, `EatingPlanDayForm.jsx`, `WhatIAteTodayCalendar.jsx` (testId), `WhatWeDoingSessionPage.jsx`, `consumerApi.js`, contracts.

BE: migration `0271`, `whatWeDoingService.js`, `whatWeDoing.js` routes, `connectionsFoodLifeService.js`.

# Database Changes

`0271` — `what_we_doing_sessions.restaurant_id`, `place_label`, `joinable`, `join_capacity`. Not applied to production this turn.

# Decisions Made

Reuse What We Doing sessions, not a new table. Joinable = accepted connections until capacity. Invite Me stays `/account/what-we-doing`, below the calendar.

# Remaining Work

CPD both trees; apply `0271` on Railway with BE push.

# Risks / Known Issues

FE without `0271` will 500 on create if extra columns are missing.

# Verification Status

FE 10 contract tests pass. BE whatWeDoing contract pass.

# Resume Instructions

`cpd` from authorized mains. Apply migration with BE deploy.

# Git Status

Uncommitted feature work on both authorized mains (FE also still ahead 2 from prior Share/Settings commits).
