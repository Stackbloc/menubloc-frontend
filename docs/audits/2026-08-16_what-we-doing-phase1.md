# What We Doing? Phase 1 — completion report

**Date:** 2026-08-16  
**Paths:** `menubloc-backend-main`, `menubloc-frontend-main`  
**Status:** Implemented locally — migration **not applied** / **not CPD’d**

## Summary

Private group planning: creator picks a calendar date (title → “What we doing Friday, June 12th?”), invites Connections and/or a Dining Crew, participants suggest restaurant / venue / event / custom, one vote per user, optional deadline, Make It a Plan into Invite to Eat or event/venue deep links. Minimal in-app notification inbox.

## Files changed

### Backend
- `sql/migrations/20260816_0263_what_we_doing.sql` (+ rollback)
- `src/lib/whatWeDoingTitle.js`
- `src/services/whatWeDoing/whatWeDoingService.js`
- `src/routes/consumer/whatWeDoing.js`
- `src/routes/consumer/index.js` (mount)
- `test/whatWeDoingContract.test.js`

### Frontend
- `src/lib/whatWeDoingTitle.js`
- `src/lib/consumerApi.js` (API helpers)
- `src/pages/consumer/WhatWeDoingPage.jsx`
- `src/pages/consumer/WhatWeDoingSessionPage.jsx`
- `src/pages/consumer/ConsumerNotificationsPage.jsx`
- `src/pages/consumer/ConsumerProfile.jsx` (entry links)
- `src/App.jsx` (routes)
- `test/whatWeDoingContract.test.js`

## Database / schema

Migration **0263**:
- `what_we_doing_sessions`, `what_we_doing_participants`, `what_we_doing_suggestions`, `what_we_doing_votes`
- `consumer_notifications` inbox

## API changes (`/api/consumer`, auth required)

- `GET/POST /what-we-doing`
- `GET /what-we-doing/:tokenOrId`
- `POST …/participants`, `…/suggestions`, `…/votes`, `…/close-voting`, `…/make-plan`
- `GET /what-we-doing/search/{restaurants,venues,events}`
- `GET /notifications`, `POST /notifications/:id/read`

## Routes (FE)

- `/account/what-we-doing`
- `/account/what-we-doing/:token`
- `/account/notifications`

## Systems reused

- Connections (`listConnections` / accepted peers)
- Dining Crews (active membership snapshot)
- Invite to Eat `createInvitation` (restaurant Make It a Plan)
- Venue capability + `venue_events` (venue/event suggestions)
- ShareModal + menuply.com share URLs

## Notifications

Inserts to `consumer_notifications` on invite, suggestion, vote (creator only), voting closed, planned. FE inbox at `/account/notifications`. No push/email senders in this phase.

## Privacy / security

- Session APIs require auth + participant membership
- Non-participants → 403
- No Cluster Feed publishing
- Crew expansion = active members only at invite time

## Tests

- BE `node --test test/whatWeDoingContract.test.js` — pass
- FE `node --test test/whatWeDoingContract.test.js` — pass
- Route module loads with stub `DATABASE_URL`

## Known limitations

- Migration not applied to production
- No live E2E against DB in this pass (contract/static tests only)
- Event Make It a Plan deep-links to event page (does not auto-create Event Group)
- Custom suggestions cannot Make It a Plan until converted to entity
- Vote notifications go to creator only (anti-spam)
- Restaurant path for venue uses `/r/{slug}` heuristic — may need city/state path on some markets
- No CPD

## Next

1. Apply `0263` with production allow flags when Andre authorizes  
2. CPD FE + BE  
3. Manual validation checklist from product brief  

## Guardrails

- Waiter / HomeNext / Operator login / Stripe / SiteFooter untouched
