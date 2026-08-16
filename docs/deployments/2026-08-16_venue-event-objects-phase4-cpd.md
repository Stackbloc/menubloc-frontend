# CPD: Venue Event Objects Phase 4 — 2026-08-16

## Summary

Shipped reusable Venue Event Objects + ticket type configuration for Venue-capable restaurants. Public `/events/:slug`, profile Upcoming Events links, purchase stubbed (`purchase_enabled` false). Migration `0260` applied before BE push.

## Commits

| Layer | Path | Commit | Message |
|-------|------|--------|---------|
| BE | `menubloc-backend-main` | `d9178a7e` feature / tip `17beca0b` | feat(venue): Phase 4 Venue Event Objects and ticket config. |
| FE | `menubloc-frontend-main` | `7e85661` feature / tip `43f2d4a` docs | feat(venue): Phase 4 event editor and public event pages. |

## Frontend tip

- Deployment: `menubloc-frontend-hzs2u21r1-menuply.vercel.app`
- Bundle: `index-DfVlLYXq.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## Backend

- Railway `/health` `commit_hash`: `17beca0b…`
- Migration `0260` applied (`venue_events`, `venue_event_ticket_types`)
- Routes: operator `/restaurants/:id/events*`; public `GET /public/events/:slug`

## Verification

- BE path-gate PASS before push
- Bundle API scan: railway 61 >> localhost 9
- Contract tests PASS (BE + FE venue events)

## Human verify

- Operator → Events / Venue → enable Venue → Manage events → create/publish event + ticket types
- Public profile Upcoming Events links to `/events/:slug`
- Event page shows age requirement when set; Buy tickets disabled/stub

## Prior tip (rollback)

- `menubloc-frontend-o3qnf739i-menuply.vercel.app` / `index-CxIJlzl-.js` (Phase 3)
