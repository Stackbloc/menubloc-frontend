# Summary

Expanded `/owner/diners` with interval diner-capability activity metrics (sign-ins, posts by category, events, invites, QR connects, videos, avg connects) and a clickable email roster that opens a read-only My Menuply-style dialog via new owner APIs — no diner impersonation.

**Date:** 2026-08-24  
**Trees:** `menubloc-frontend-main`, `menubloc-backend-main`  
**Status:** LOCAL — not committed, not deployed.

# Problem Statement

Owner had a lifetime diner roster (`/owner/diners`) and Growth interval diner logins, but no capability usage reports (posts, events, invites, QR connects, videos, connects) and no way to click a diner email/row to inspect that diner’s My Menuply-shaped activity.

# Root Cause

Capability tables exist (`food_activity`, `what_i_ate_today`, `diner_want_to_eat`, `diner_statuses`, `eat_invitations`, `diner_social_events`, `user_connections`, video URL columns, etc.) but were never aggregated for owner reporting. My Menuply is session-owned (`/my-menuply`); peer hubs require an accepted Connection — owners had no authorized projection.

# Evidence Collected

- Existing roster: `ownerDinerAccountsService` + `GET /api/owner/dashboard/diners`
- Growth already counts `diner_logins` from `auth_login_events`
- Personal diner QR scans are **not** written to `qr_scan_events` (restaurant sticker QR only)
- Activity feed SQL initially broke on unescaped apostrophe in `I'm Eating At` — fixed with `E'I''m Eating At'`

# Files Examined

- `menubloc-backend-main/src/services/ownerDinerAccountsService.js`
- `menubloc-backend-main/src/services/ownerGrowthMetricsService.js`
- `menubloc-backend-main/src/routes/ownerDashboard.js`
- Migrations for food_activity, want/ate, statuses, invites, connections, social events, profile media, QR
- `menubloc-frontend-main/src/pages/owner/OwnerDiners.jsx`
- Peer hub: `/account/connections/:peerId` (Connection-gated)

# Database Queries Executed

Read-only via new services against production-shaped DB (`.env.production` / `.env.local`):

- Interval counts on capability tables with staff exclude ids `2,3,4,29`
- Detail hub snapshot for a live diner id
- No writes

# Changes Made

Backend:

- `src/services/ownerDinerCapabilityStatsService.js` — interval metrics
- `src/services/ownerDinerDetailService.js` — identity + summary + hub sections + recent activity
- `src/routes/ownerDashboard.js` — `GET /diners/stats`, `GET /diners/:id` (registered before list)
- `test/ownerDinerCapabilityStatsService.test.js`

Frontend:

- `src/pages/owner/OwnerDiners.jsx` — interval chips + metric grid + row click
- `src/pages/owner/OwnerDinerHubDialog.jsx` — read-only My Menuply dialog
- `src/lib/ownerApi.js` — `getOwnerDinerCapabilityStats`, `getOwnerDinerDetail`
- `src/pages/owner/intelligence/intelligenceShared.jsx` — optional `onRowClick` on `SimpleTable`
- `test/ownerDinerAccountsContract.test.js` extended

# Commits

None.

# Deployment Status

Not pushed. Not Railway. Not Vercel. Production `/owner/diners` will not show capability stats or dialog until CPD.

# Verification Results

- BE `node --test test/ownerDinerCapabilityStatsService.test.js test/ownerDinerAccountsService.test.js` — 16 pass
- FE `node --test test/ownerDinerAccountsContract.test.js` — 4 pass
- Live detail probe returned hub shape for a real diner (after apostrophe fix, activity feed no longer fails on that string)

# Remaining Risks

- Personal QR **scan** volume still unavailable (documented in UI notes)
- Avg connects denominator = active diners excluding staff (documented)
- Guest reports excluded by design (`consumer_user_id IS NOT NULL`)
- Roster still capped at 2000

# Follow-Up Work

- Commit / CPD when Andre asks
- Optional: log personal diner QR scans on `/d/:token` if scan volume is required

# Final Verdict

Owner diner capability reporting and read-only My Menuply dialog are implemented locally on `/owner/diners`. Not production until CPD.
