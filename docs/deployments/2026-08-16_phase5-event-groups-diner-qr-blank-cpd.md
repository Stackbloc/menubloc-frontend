# CPD: Phase 5 Event Groups + diner-qr blank-page fix — 2026-08-16

## Summary

Shipped Venue Event Groups Phase 5 (RSVP + groups; Phase 6 volume offers skipped) and fixed `/account/diner-qr` full white-screen (`ShareModal` + `buildShareLinks(null)`). Migration `0261` applied before BE push.

## Commits

| Layer | Path | Commit | Message |
|-------|------|--------|---------|
| BE | `menubloc-backend-main` | `cff8658a` | feat(venue): Phase 5 Event Groups and RSVP (skip Phase 6). |
| FE | `menubloc-frontend-main` | `5ce2616` | feat(venue): Phase 5 event groups UI and RSVP (skip Phase 6). |
| FE | `menubloc-frontend-main` | `e612c63` | fix(diner-qr): stop ShareModal null crash blanking /account/diner-qr. |
| FE | `menubloc-frontend-main` | `ced3f53` | docs: audit diner-qr blank page ShareModal null crash. |

## Frontend tip

- Deployment: `menubloc-frontend-ro8l1scif-menuply.vercel.app`
- Bundle: `index-BVISDgrs.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle API scan: railway 61 >> localhost 9

## Backend

- Railway `/health` `commit_hash`: `cff8658a…`
- Migration `0261` applied (`venue_event_rsvps`, `venue_event_groups`, `venue_event_group_members`, `venue_event_group_invitations`)
- Routes: consumer event groups; public event social projection; package `event_groups=ready`, `group_offers=shell`

## Verification

- BE path-gate PASS before push
- `CONFIRM_PRODUCTION_TARGET=true railway run … applyOneMigration.js 20260816_0261_venue_event_groups.sql --allow-production` → Applied and tracked
- `npm run test:share-contract` PASS (10) before FE tip
- Live tip locks updated in tip-gate script + LKG contracts

## Human verify

- Logged-in `/account/diner-qr` shows Diner Card chrome (not blank white)
- Invite to Eat selection radios aligned
- Public `/events/:slug` RSVP + create group; `/events/groups/:slug` + invite accept path
- No Phase 6 group volume offers UI

## Prior tip (rollback)

- `menubloc-frontend-hzs2u21r1-menuply.vercel.app` / `index-DfVlLYXq.js` (Phase 4)
