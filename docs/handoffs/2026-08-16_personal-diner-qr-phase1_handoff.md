# Objective

Ship Phase 1 only: automatic Personal Diner QR + Diner Card for active phone-verified diners, with privacy-safe connect landing. No Venue/Events/Meet Me Here/contextual QR.

# Current Status

**CPD COMPLETE** — FE tip `menubloc-frontend-7xp2ldvwr-menuply.vercel.app` / `index-Dgg_SRjs.js` (`bd3a8e5`); BE `77f40426`; migration `0257` applied. Stopped before Phase 2.

# Files Changed

## Backend (`menubloc-backend-main`)

- `sql/migrations/20260816_0257_consumer_personal_diner_qr.sql` (+ rollback)
- `src/services/consumerQr/consumerPersonalQrService.js`
- `src/services/storage/dinerAvatarStorage.js`
- `src/routes/consumer/dinerQr.js`
- `src/routes/publicDinerQr.js`
- `src/routes/dinerQrRedirect.js`
- `src/routes/consumer/index.js`
- `src/server.js`
- `src/services/consumerConnections/consumerConnectionsService.js` (`diner_qr` source)
- `test/consumerPersonalDinerQr.test.js`
- `test/consumerConnectionsUnit.test.js`

## Frontend (`menubloc-frontend-main`)

- `src/pages/consumer/DinerQrPage.jsx`
- `src/pages/consumer/DinerQrConnectPage.jsx`
- `src/lib/dinerQrShare.js`
- `src/lib/consumerApi.js`
- `src/pages/consumer/ConsumerProfile.jsx`
- `src/App.jsx`
- `vercel.json`
- `test/dinerQrPhase1Contract.test.js`

## Docs

- `docs/audits/2026-08-16_personal-diner-qr-phase1.md`
- `docs/handoffs/2026-08-16_personal-diner-qr-phase1_handoff.md`

# Database Changes

Migration `0257` **applied and tracked on production** (2026-08-16):

- `consumer_profiles.avatar_url`, `diner_qr_show_avatar`, `diner_qr_show_edu`
- `consumer_qr_codes` (+ partial unique one active personal per user)
- `user_connections.source` CHECK adds `diner_qr`

# Decisions Made

- Eligible = active + phone-verified (not paid)
- Opaque token URL `https://menuply.com/d/{token}` — never PII in QR
- Separate from restaurant `/qr` and sticker `/r`
- `kind=personal` vs reserved `contextual` columns
- Connect = Connection request with `source=diner_qr` (accept still required)
- Optional selfie; card works without avatar

# Remaining Work

1. Apply migration `0257` on production when authorized
2. BE push from `menubloc-backend-main` @ clean `main` + FE deploy/alias from `menubloc-frontend-main` when CPD requested
3. Live phone scan validation after deploy
4. Phase 2+ only when Andre instructs

# Risks / Known Issues

- Local upload avatars may not survive multi-instance without durable storage
- Until migration applied, diner-qr APIs will error on missing tables/columns

# Verification Status

| Check | Result |
|-------|--------|
| BE unit tests | PASS |
| FE contract tests | PASS |
| FE build | PASS |
| Migration applied | YES (production, tracked) |
| Production deploy | YES — CPD 2026-08-16 |
| Phone camera scan | Human verify remaining |

# Resume Instructions

1. ~~Apply `20260816_0257_consumer_personal_diner_qr.sql`~~ **DONE**
2. Deploy BE then FE (authorized paths only) if CPD
3. Smoke: login → `/account/diner-qr` → card + image → scan → `/connect/d/:token` → Connect
4. Do **not** implement contextual QR / Meet Me Here without new Phase instruction

# Git Status

Uncommitted local changes in `menubloc-backend-main` and `menubloc-frontend-main` (commit not requested this turn).
