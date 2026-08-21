# Summary

Phase 2–3 (+ prefs) for important-action email: central notification service on extended `consumer_notifications`, Connect request/accepted emitters, important-email preference default ON.

# Problem Statement

Diners need rare actionable email for Connect (and later Join Me / Crew / Events / Votes) without rebuilding social systems or creating a marketing feed.

# Root Cause

N/A — net-new delivery layer on existing social + Resend transport.

# Evidence Collected

Phase 1 audit: Resend/`sendEmail` exists; `consumer_notifications` was WWD-only; Connect had no email.

# Files Examined / Changed

## Backend (`menubloc-backend-main`)

- `sql/migrations/20260821_0284_important_action_notifications.sql` (+ rollback)
- `src/services/importantActionNotifications/*`
- `src/services/consumerConnections/consumerConnectionsService.js` — emit notify on request/accept
- `src/routes/consumer/notificationPreferences.js` + `index.js` mount
- `test/importantActionNotificationsContract.test.js`

## Frontend (`menubloc-frontend-main`)

- `src/lib/consumerApi.js` — get/update notification preferences
- `src/pages/consumer/accountDashboard/SecurityAccountTab.jsx` — Important Menuply emails toggle
- `test/importantActionEmailPreferenceContract.test.js`

# Database Queries Executed

None in this turn (migration not yet applied to production).

# Changes Made

1. Extend notifications with actor, idempotency, email delivery fields
2. Pref `important_action_email_enabled` default true
3. Central `createImportantActionNotification` → prefs → rate limit → `sendEmail`
4. Connect request + accepted enqueue (fire-and-forget; deep link `/account/connections`)
5. Account Security toggle for important emails

# Commits

Pending Andre CPD.

# Deployment Status

Not deployed. Apply `0284` before enabling Connect emails in production.

# Verification Results

- `node test/importantActionNotificationsContract.test.js` — PASS (after fix)
- FE preference contract — pending run

# Remaining Risks

- Production migration not applied
- Connect CTA is Connections list (no one-tap accept URL yet)
- Phases 4–7 (Join Me, Crew, Event, Vote) not wired yet
- Domain SPF/DKIM not re-verified this turn

# Follow-Up Work

1. Apply `0284` on production; CPD FE+BE
2. Phase 4 Join Me / Invite emitters
3. Phase 5–7 Crew / Event / Vote
4. Optional Connect accept deep-link

# Final Verdict

Phases 2–3 + basic Phase 8 implemented locally. Ready for migration apply + CPD after Andre confirmation.
