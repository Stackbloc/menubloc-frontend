# Summary

Phase 1 Personal Diner QR + Diner Card implemented locally in authorized `menubloc-backend-main` / `menubloc-frontend-main`. Eligible diners (active + phone-verified) auto-receive a permanent personal QR via lazy ensure. Not CPD’d. Migration `0257` not applied to production.

# Problem Statement

Eligible Menuply diners needed an automatic personal QR and polished Diner Card so scanners can connect without exposing private profile/activity data. Contextual QR actions (Meet Me Here, crews, events) are explicitly out of scope for Phase 1.

# Root Cause

N/A — new feature. No prior personal/consumer QR existed (restaurant `/qr` and sticker `/r` only).

# Evidence Collected

- No paid diner subscription; eligibility = `requireConsumerAuth` gate (active + phone verified).
- No consumer avatar column before migration `0257`.
- Connections already support `source` / `source_ref`; extended with `diner_qr`.
- Share contract requires absolute `https://menuply.com/...` URLs.

# Files Examined

- `menubloc-backend-main/src/services/qr/qrBrandingService.js`
- `menubloc-backend-main/src/services/consumerConnections/consumerConnectionsService.js`
- `menubloc-backend-main/src/routes/qr.js`, `qrRedirect.js`
- `menubloc-frontend-main/src/pages/consumer/ConsumerProfile.jsx`
- `menubloc-frontend-main/vercel.json`
- Existing share helpers (`shareUtils`, dining-crew invite share)

# Database Queries Executed

Production apply (2026-08-16):

```bash
CONFIRM_PRODUCTION_TARGET=true railway run --service menubloc-backend -- \
  node scripts/applyOneMigration.js 20260816_0257_consumer_personal_diner_qr.sql --allow-production
```

Result: `Applied and tracked: 20260816_0257_consumer_personal_diner_qr.sql`

Post-apply verify: `consumer_qr_codes` exists; profile avatar/privacy columns present; `user_connections_source_check` includes `diner_qr`; migration row tracked.

# Changes Made

## Backend

- Table `consumer_qr_codes` (`kind` personal|contextual; Phase 1 writes personal only)
- Profile columns: `avatar_url`, `diner_qr_show_avatar`, `diner_qr_show_edu`
- `user_connections.source` includes `diner_qr`
- Service `consumerPersonalQrService.js` — ensure, card, public resolve, connect
- Routes: `/api/consumer/diner-qr*`, `/api/consumer/profile/avatar`, `/api/public/diner-qr/:token`, `/d/:token`, `/d/:token/image`

## Frontend

- `/account/diner-qr` Diner Card (branding, optional selfie, QR image, privacy toggles, Share My Menuply)
- `/connect/d/:token` scanner landing
- Profile section links
- Vercel rewrites for `/d/:token` and `/d/:token/image`

# Commits

None (local implementation; commit not requested).

# Deployment Status

**CPD COMPLETE 2026-08-16.** Migration `0257` applied. FE tip `7xp2ldvwr` / `index-Dgg_SRjs.js`. BE health `77f40426`. See `docs/deployments/2026-08-16_personal-diner-qr-phase1-cpd.md`.

# Verification Results

- `node --test test/consumerPersonalDinerQr.test.js test/consumerConnectionsUnit.test.js` — pass
- `node --test test/dinerQrPhase1Contract.test.js` — pass
- `npm run build` (frontend-main) — pass
- Phone camera scan / live DB ensure — **not run** (migration not applied; no CPD)

# Remaining Risks

- Backend/frontend Phase 1 code not yet deployed — APIs will 404/fail on production until BE/FE CPD.
- Avatar storage is local `/uploads` (same pattern as dining-crew photos); durable object storage may be needed for multi-instance Railway.
- Contextual QR columns exist but unused; do not overload personal kind for Meet Me Here later.

# Follow-Up Work

- Apply `0257` + CPD when Andre authorizes
- Phase 2+ contextual QR kinds (explicitly stopped here)
- Optional backfill job for all eligible diners (lazy ensure already covers on first open)

# Final Verdict

Phase 1 complete locally: permanent Personal Diner QR + Diner Card + privacy-safe connect landing. Stop — do not proceed to Phase 2.
