# Objective

Future-plan Join Me: Anyone Connect or selected Connections + pending Invites. Only those eligible acceptors can see that specific plan.

# Current Status

CPD COMPLETE. FE tip `89eyeudh1` / `index-DjXskZ76.js` (`063ffd7`). BE origin `a1b751c3` not Railway-live (health `970062ac`).

# Files Changed

- BE: `whatWeDoingService.js`, `whatWeDoing.js` routes, `eatInvitationsService.js`, `eatInvitations.js` routes, `connectionsFoodLifeService.js`, migration `0273`
- FE: `JoinMeAudiencePicker.jsx`, `joinMeCandidates.js`, `EatingPlanDayForm.jsx`, `MyMenuplyPage.jsx`, `ConsumerConnectionPeerPage.jsx`, `myMenuplyBits.jsx`, `DinerCalendarSheet.jsx`, `WhatIAteTodayCalendar.jsx`, `consumerApi.js`

# Database Changes

Migration `0273` (not applied): `join_audience`, `join_allowed_user_ids` on `what_we_doing_sessions`.

# Decisions Made

- Visibility = Join Me eligibility.
- `none` / not joinable: creator (and existing participants) only.
- `connections`: accepted Connections only.
- `selected`: `join_allowed_user_ids` (Connections + pending Invite account holders).
- Do not auto-add selected people as participants.
- Ineligible GET/JOIN returns 404 (do not leak the plan).
- Guests without accounts cannot be selected.

# Remaining Work

- CPD when Andre says `cpd`.
- Apply `0273` on production only after live schema pre-flight.
- Railway health may still be `942e7c10`; do not `railway up`.

# Risks / Known Issues

Until `0273` is live, code falls back to joinable = anyone Connect.

# Verification Status

Contract tests to be run this session.

# Resume Instructions

1. Read this handoff + `docs/audits/2026-08-18_future-plan-join-me-allow-list.md`
2. Do not deploy unless Andre says `cpd`
3. If CPD: authorized FE/BE paths only; update LKG to the live bundle (do not restore Post X `3vk7ie3cf` unless rolling back diner-hub)

# Git Status

Uncommitted local work in frontend-main and backend-main.
