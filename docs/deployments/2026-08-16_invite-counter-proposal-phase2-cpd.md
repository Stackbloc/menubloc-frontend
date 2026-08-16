# CPD: Invite Counter Proposal Phase 2 — 2026-08-16

## Summary

Shipped Invite to Eat Counter Proposal (Phase 2) to production. Migration `0258` applied before BE push.

## Commits

| Layer | Path | Commit | Message |
|-------|------|--------|---------|
| BE | `menubloc-backend-main` | `ad899a6e` | feat(invite): Phase 2 Invite Counter Proposal APIs and history. |
| FE | `menubloc-frontend-main` | `a0abef2` | feat(invite): Phase 2 counter-proposal UI on Invite to Eat. |

## Frontend tip

- Deployment: `menubloc-frontend-ard1xo2ay-menuply.vercel.app`
- Bundle: `index-ChMndpoc.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## Backend

- Railway `/health` `commit_hash`: `ad899a6e…`
- Migration `0258` applied and tracked (`20260816_0258_eat_invitation_counter_proposals.sql`)
- Routes: `POST /public/eat-invitations/:token/proposals`, `POST .../proposals/:id/resolve`

## Verification

- BE path-gate PASS before push
- Bundle API scan: railway 61 >> localhost 9
- Tip-gate PASS after LKG lock update

## Human verify

- Create invite with restaurant negotiable on → recipient Propose a change → counter restaurant/date/time
- Inviter Accept / Counter again / Decline
- Fixed-location invite (restaurant negotiable off) rejects restaurant counter
- Existing Accept / Can't Make It / recipient-chooses schedule still work

## Prior tip (rollback)

- `menubloc-frontend-7xp2ldvwr-menuply.vercel.app` / `index-Dgg_SRjs.js` (Personal Diner QR Phase 1)
