# Objective

Ship Phase 4 Venue Event Objects on top of Phase 3 Venue capability.

# Current Status

**CPD COMPLETE** 2026-08-16. Live tip `hzs2u21r1` / `index-DfVlLYXq.js`; BE health `17beca0b`; migration `0260` applied.

# Files Changed

## Backend (`menubloc-backend-main`)

- `sql/migrations/20260816_0260_venue_events.sql` (+ rollback)
- `src/services/venueEvents/venueEventService.js`
- `src/routes/operator/events.js`
- `src/routes/publicEvents.js`
- `src/services/restaurants/restaurantCapabilityService.js`
- `src/routes/operator/index.js`, `src/server.js`
- `test/venueEventsContract.test.js`

## Frontend (`menubloc-frontend-main`)

- `src/pages/operator/OperatorEventsEditor.jsx`
- `src/pages/EventDetailPage.jsx`
- `src/pages/operator/OperatorVenuePackagePage.jsx`
- `src/components/restaurant/publicProfile/ProfileUpcomingEvents.jsx`
- `src/App.jsx`, `src/lib/operatorApi.js`
- `test/venueEventsContract.test.js`

# Database Changes

Tables `public.venue_events`, `public.venue_event_ticket_types`. Migration `0260`.

# Decisions Made

- Gate all writes on Venue capability
- Global public URL `/events/:slug`
- `purchase_enabled` always false in Phase 4
- Age requirement enforced via `assertAgeRequirement` / age-check route
- Phase 5–6 modules remain shell

# Remaining Work

- CPD: apply `0260`, push BE, Vercel FE + alias + tip-gate, update LKG docs
- Phase 5 Groups (do not start until asked)

# Risks / Known Issues

- No event photo upload yet
- No Stripe ticket PI

# Verification Status

Contract tests PASS locally. Live probes pending CPD.

# Resume Instructions

1. Apply `0260` with `--allow-production`
2. Commit + push `menubloc-backend-main` @ main
3. Commit + `vercel --prod` + alias from `menubloc-frontend-main`
4. Tip-gate PASS; update LKG tip locks

# Git Status

Pending commits in both authorized mains (see CPD).
