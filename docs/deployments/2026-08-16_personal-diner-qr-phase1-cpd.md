# CPD: Personal Diner QR Phase 1 — 2026-08-16

## Summary

Shipped Personal Diner QR + Diner Card (Phase 1) to production. Migration `0257` already applied. Also included Dining Crew invite ShareModal FE helpers that were local and required for a clean FE tree.

## Commits

| Layer | Path | Commit | Message |
|-------|------|--------|---------|
| BE | `menubloc-backend-main` | `77f40426` | feat(diner-qr): Phase 1 personal Diner QR + card APIs |
| FE | `menubloc-frontend-main` | `bd3a8e5` | feat(diner-qr): Phase 1 Diner Card + connect landing |

## Frontend tip

- Deployment: `menubloc-frontend-7xp2ldvwr-menuply.vercel.app`
- Bundle: `index-Dgg_SRjs.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update

## Backend

- Railway `/health` `commit_hash`: `77f40426…`
- Migration `0257` tracked (applied earlier same day)
- Smoke: `/api/public/diner-qr/:token` + `/d/:token` return `qr_not_found` for unknown UUID (route live); `/account/diner-qr` HTTP 200

## Verification

- BE path-gate PASS before push
- Bundle API scan: railway >> localhost
- `/d/:token` rewrite reaches Railway (x-railway headers)

## Human verify

- Sign in as phone-verified diner → Account → My Diner QR → card + scannable QR
- Phone scan → connect landing → Connect on Menuply
- No selfie still shows initials card

## Prior tip (rollback)

- `menubloc-frontend-aae62r0rr-menuply.vercel.app` / `index-CEl-scxL.js` (Waiter additive)
