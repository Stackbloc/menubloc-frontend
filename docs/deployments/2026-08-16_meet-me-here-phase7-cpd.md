# CPD: Phase 7 Meet Me Here — 2026-08-16

## Summary

Shipped Contextual QR + Meet Me Here. Temporary `/d/:token` QR opens existing Invite to Eat (accept/counter). Permanent Personal Diner QR unchanged. Migration `0262` applied before BE push. Phase 6 still skipped; Phase 8 E2E not started.

## Commits

| Layer | Path | Commit | Message |
|-------|------|--------|---------|
| BE | `menubloc-backend-main` | `068b36e4` | feat(qr): Phase 7 Meet Me Here contextual QR via Invite to Eat. |
| FE | `menubloc-frontend-main` | `9dec266` | feat(qr): Phase 7 Meet Me Here page and account entry. |

## Frontend tip

- Deployment: `menubloc-frontend-fnn23dmbl-menuply.vercel.app`
- Bundle: `index-UMv0E4Zu.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle API scan: railway 61 >> localhost 9

## Backend

- Railway `/health` `commit_hash`: `068b36e4…`
- Migration `0262` applied (`meet_me_here` contextual constraints)
- Routes: `POST /api/consumer/meet-me-here`; `/d/:token` personal→connect / meet_me_here→invite

## Verification

- BE path-gate PASS before push
- `applyOneMigration.js 20260816_0262_contextual_meet_me_here_qr.sql --allow-production` → Applied and tracked
- Contract tests PASS pre-ship (BE 4, FE 3, share 10)

## Human verify

- Account → Meet Me Here → pick restaurant → Show QR
- Second phone scans QR → Invite landing (accept/counter)
- `/account/diner-qr` still personal connect path

## Prior tip (rollback)

- `menubloc-frontend-ro8l1scif-menuply.vercel.app` / `index-BVISDgrs.js` (Phase 5 + diner-qr blank fix)
