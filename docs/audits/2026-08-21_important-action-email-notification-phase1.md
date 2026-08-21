# Summary

Phase 1 audit (read-only) for Menuply’s **Important Action Email Notification System**. Transactional email transport (Resend + `sendEmail`) and social action models (Connect, Join Me, Invite to Eat, Crews, venue events, What We Doing votes) already exist. **Important-action email fan-out does not.** Closest in-app system is `consumer_notifications`, currently written only by What We Doing.

# Problem Statement

Menuply is web-first; diners need rare, actionable email when something requires Accept / Decline / Vote / View — not a social engagement digest. Before building, map existing systems so agents reuse them and do not duplicate Connect/Invite/Crew/Event/email stacks.

# Root Cause

N/A (audit). Gap is intentional product lag: social features shipped as **link-share + in-app**, with email reserved for auth/ops/orders.

# Evidence Collected

## Executive matrix

| Area | Status | Notes |
|------|--------|-------|
| Email transport | **EXISTS** | Resend prod; Postmark/SMTP fallbacks; `sendEmail` |
| Domain / deliverability docs | **EXISTS** | `menuply.com` verified in Resend; `EMAIL_SETUP_REFERENCE.md` |
| Social important-action email | **MISSING** | Connect / Invite / Join Me / Crew / RSVP / vote never call `sendEmail` |
| In-app notifications | **PARTIAL** | `consumer_notifications` + `/account/notifications`; WWD writers only |
| Consumer email templates | **PARTIAL** | Inline HTML for password reset / edu / claim; no action templates |
| Invitation / Connect / Crew / Event / Vote models | **EXIST** | Mature APIs + token URLs; no email |
| Important-email preference UI/API | **MISSING** | Prefs table is marketing/deals stubs only |
| Deep-link landings (FE) | **MOSTLY EXIST** | Gaps: Connect accept URL; diner social event detail |
| Abuse / idempotency for outbound social email | **MISSING** | |

## Email provider (reuse)

- **Service:** `menubloc-backend-main/src/services/email/emailTransportService.js` — `sendEmail`, Resend / Postmark / SMTP / stdout
- **Prod config (documented):** `EMAIL_PROVIDER=resend`, `EMAIL_FROM=Menuply <menus@menuply.com>`, domain `menuply.com` verified
- **Inbound:** `src/routes/inboundEmail.js` — not for social outbound
- **Do not use for this product:** MailerLite (`mailerliteService.js`), CRM email (`crmEmail*`), claim’s direct Resend bypass (`sendClaimEmail.js`) as the pattern to copy long-term — prefer `sendEmail`

## In-app notification model (extend, do not duplicate)

Migration `20260816_0263_what_we_doing.sql` → `public.consumer_notifications`:

- `consumer_user_id`, `type`, `title`, `body`, `href`, `ref_type`, `ref_id`, `read_at`, `created_at`
- **Missing vs desired:** `actor_user_id`, `email_sent_at`, `email_provider_message_id`, unique/idempotency key
- Writers today: `whatWeDoingService.notifyParticipants` only
- Routes: `GET /api/consumer/notifications`, `POST …/:id/read`
- FE: `/account/notifications` (`ConsumerNotificationsPage.jsx`) — **no global bell**

## Prefs (extend)

- `public.consumer_notification_preferences` — marketing / deal / location flags; inserted at signup
- No consumer GET/PUT for prefs; no “important action email” toggle
- Doctrine already separates transactional vs `marketing_opt_in` (`0109`)

## Social domains (emit into central service — do not rewrite)

| Domain | Backend | Token / deep link today |
|--------|---------|-------------------------|
| Connect | `consumerConnectionsService.js` | QR `/connect/d/:token`; pending list `/account/connections` — **no accept deep-link** |
| Invite to Eat | `eatInvitationsService.js` | `/invite/:token`, `/eat/:token` |
| Join Me | `joinMeService.js` | `/join-me/:token` |
| Dining Crews | `diningCrewsService.js` | `/account/dining-crews/invite/:token` |
| Venue event / group | `venueEventGroupsService.js` | `/events/:slug`, `/events/groups/invite/:token` |
| What We Doing / vote | `whatWeDoingService.js` | `/account/what-we-doing/:token` (+ in-app notify) |
| Diner My Events | `dinerSocialEventsService.js` | Create/list only — **no invite/RSVP/public detail URL** |
| Crew join-request vote | `diningCrewsService.js` | In-crew UI only — no standalone vote URL |

## Explicit non-email list (product rule already matches code)

No email today (and Phase policy says keep it that way) for likes, comments, views, Want This, ordinary posts, routine feed/crew activity.

## Gaps that block “perfect” CTAs

1. Connect request email needs either `/account/connections` + highlight or a new accept deep-link / inbox `href`
2. Diner social events have no invite/RSVP model yet — Event invitation emails should prefer **venue event groups** + WWD/Invite until My Events gains invitations
3. Guests without `consumer_users.email` cannot receive email (Join Me / Invite already support guest RSVP via link)

# Files Examined

Primary BE: `emailTransportService.js`, `EMAIL_SETUP_REFERENCE.md`, `0263_what_we_doing.sql`, `whatWeDoingService.js`, eat/joinMe/connections/diningCrews/venueEvents/dinerSocialEvents services, `consumer_notification_preferences` migrations, auth signup prefs.

Primary FE: `App.jsx`, `ConsumerNotificationsPage.jsx`, Join Me / Invite / Crew / Event / WWD / Diner QR landings, share libs.

# Database Queries Executed

None (read-only code/docs audit). Live Resend domain status not re-probed this turn; rely on `EMAIL_SETUP_REFERENCE.md` + prior CPD notes.

# Changes Made

None (Phase 1). This audit file + index entry only.

# Commits

N/A until Phase 2 authorized.

# Deployment Status

N/A.

# Verification Results

N/A.

# Remaining Risks

- Treating `consumer_notifications` as WWD-only may bias agents to create a second table — prefer **extend** with email columns + central writer
- Docs-only domain verification may drift; Phase 9 must re-verify SPF/DKIM/DMARC in Resend before claiming production-ready
- Docs commits that touch Railway may change `/health` SHA without feature change

# Follow-Up Work (approved order)

1. **Phase 2** — Central `importantActionNotification` (or equivalent) service: create notification row → check prefs → `sendEmail` → deep link; extend `consumer_notifications` (+ idempotency)
2. **Phase 3** — Connect request + accepted
3. **Phase 4** — Join Me / Invite to Eat
4. **Phase 5** — Crew invites / meaningful membership
5. **Phase 6** — Venue event group invites + material changes (not diner My Events invent)
6. **Phase 7** — What We Doing vote (reuse existing session URL)
7. **Phase 8** — Important-email ON/OFF preference (default ON)
8. **Phase 9** — Delivery log, rate limits, observability, domain verify

# Final Verdict

**Ready for Phase 2 design/implementation after Andre approval.** Reuse Resend/`sendEmail`, extend `consumer_notifications`, emit from existing social services. Do not rebuild social features or add a second email stack.

**Recommended Phase 2 stop-line before coding:** confirm (1) extend `consumer_notifications` vs new table, (2) Connect CTA = inbox vs new accept route, (3) skip diner My Events invites until invitation model exists.
