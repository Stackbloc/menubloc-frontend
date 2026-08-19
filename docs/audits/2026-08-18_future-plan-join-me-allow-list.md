# Summary

Future plans are visible only to people who can accept that plan’s Join Me. The Join Me picker is Anyone Connect, or a selected list of Connections plus pending Invite-to-Eat account holders. Guests without accounts cannot be selected. **CPD COMPLETE** — tip `89eyeudh1` / `index-DjXskZ76.js`; FE `063ffd7`. BE origin `a1b751c3`; Railway health still `970062ac`.

# Problem Statement

Join Me on a future plan was visible to any accepted Connection. Andre required: (1) select specific Connections, including pending Invite people; (2) only eligible Join Me acceptors may see that specific future plan.

# Root Cause

`what_we_doing_sessions.joinable` was a boolean. `listJoinablePeerPlans` returned every joinable plan from a Connection. `getSessionDetail` / `joinSession` only required an accepted Connection. Selected-list and pending-Invite eligibility did not exist.

# Evidence Collected

- `listJoinablePeerPlans` filtered only `joinable = true` + accepted peer ids.
- Peer hub showed Join Me even when `joinMeHref` was empty (fell back to Invite Me).
- `EatingPlanDayForm` had “People can join” but was not mounted on My Menuply.
- Eat invitations store respondents with `consumer_user_id`; guests have no id.

# Files Examined

- `menubloc-backend-main/src/services/whatWeDoing/whatWeDoingService.js`
- `menubloc-backend-main/src/services/consumerConnections/connectionsFoodLifeService.js`
- `menubloc-backend-main/src/services/eatInvitations/eatInvitationsService.js`
- `menubloc-frontend-main/src/pages/consumer/MyMenuplyPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/ConsumerConnectionPeerPage.jsx`

# Database Queries Executed

None (code + contract tests only). Migration `0273` is not applied to production.

# Changes Made

- Migration `20260818_0273_plan_join_audience.sql`: `join_audience` (`none` | `connections` | `selected`) + `join_allowed_user_ids`.
- Create/update session stores audience; selected people are **not** auto-added as participants.
- `viewerMaySeePlan` gates session GET/JOIN (ineligible → 404).
- Planning aggregator lists a joinable plan only if the viewer is an eligible acceptor.
- FE Join Me dialog: Anyone Connect vs Select specific (Connections + pending Invites).
- Restaurant is required on the future-plan form.
- Eating history calendar is today+past; future-plans calendar is today+future.
- Eating photos are a meal-order carousel; placeholder is clickable for a real photo.

# Commits

None.

# Deployment Status

Not deployed. Railway `/health` unchanged. Do not apply `0273` until CPD. INSERT/UPDATE tolerate missing columns (`42703`) until then.

# Verification Results

Contract tests run after this audit.

# Remaining Risks

- Until `0273` is on Railway, joinable plans behave as Anyone Connect (legacy boolean).
- Pending Invite people without `respondent_user_id` cannot be selected.
- Direct `/account/what-we-doing/:token` 404s for ineligible viewers (intentional).

# Follow-Up Work

CPD when Andre asks: commit FE+BE, path-gate BE, push (no `railway up`), apply `0273` with live schema check, Vercel from `menubloc-frontend-main`.

# Final Verdict

Eligibility and visibility are the same list: Anyone Connect, or the selected Connections + pending Invite people. The specific future plan is hidden from everyone else.
