# CPD: Venue Capability Phase 3 — 2026-08-16

## Summary

Shipped attachable Venue capability + Events/Venue package shell. Does not change `restaurant_type`. Upcoming Events section gates on capability (empty until Phase 4). Migration `0259` applied before BE push.

## Commits

| Layer | Path | Commit | Message |
|-------|------|--------|---------|
| BE | `menubloc-backend-main` | `ec4019a3` | feat(venue): Phase 3 Venue capability and Events package shell. |
| FE | `menubloc-frontend-main` | `d1a33ad` | feat(venue): Phase 3 Venue package shell and Upcoming Events profile. |

## Frontend tip

- Deployment: `menubloc-frontend-o3qnf739i-menuply.vercel.app`
- Bundle: `index-CxIJlzl-.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## Backend

- Railway `/health` `commit_hash`: `ec4019a3…`
- Migration `0259` applied (`restaurant_capabilities`)
- Routes: `GET/PUT /operator/restaurants/:id/capabilities*`; public `venue_capability_enabled` + `upcoming_events: []`

## Verification

- BE path-gate PASS before push
- Bundle API scan: railway 61 >> localhost 9
- Contract tests PASS (BE + FE venue capability)

## Human verify

- Operator → Marketing → Events / Venue → enable Venue capability
- Public profile shows Upcoming Events (blank) only when enabled
- Non-venue restaurants unchanged

## Prior tip (rollback)

- `menubloc-frontend-e2toazdpi-menuply.vercel.app` / `index-Cx2bTWAc.js`
