# Summary

Personal Diner Card showed a blank QR area because the FE loaded `/d/:token/image` from the Railway API host while helmet sets `Cross-Origin-Resource-Policy: same-origin`. Browsers block that cross-origin `<img>`. Invite to Eat dialog option rows also looked crooked (flex + uneven radio offsets).

# Problem Statement

After Phase 1 CPD, opening **My Diner QR** showed an empty white QR panel. Separately, Invite to Eat selection radios/checkboxes looked misaligned when selected.

# Root Cause

1. **Blank QR:** `DinerQrPage` used `resolveConsumerMediaUrl` → `https://menubloc-backend-production.up.railway.app/d/.../image`. Production responses include `cross-origin-resource-policy: same-origin`, so menuply.com cannot embed the image.
2. **Crooked options:** `InviteToEatModal` used `alignItems: "flex-start"` plus per-input `marginTop: 3` on radios/checkboxes of unequal text height.

# Evidence Collected

- `curl -D -` on Railway `/health` and `/d/.../image` showed `cross-origin-resource-policy: same-origin`.
- Vercel already rewrites `/d/:token/image` → Railway (same-origin from menuply.com).
- Restaurant QR UI often uses relative `/qr/...` paths (avoids CORP); diner card did not.

# Files Examined

- `menubloc-frontend-main/src/pages/consumer/DinerQrPage.jsx`
- `menubloc-frontend-main/src/components/InviteToEatModal.jsx`
- `menubloc-backend-main/src/routes/dinerQrRedirect.js`
- `menubloc-backend-main/src/server.js` (helmet)
- `menubloc-frontend-main/vercel.json`

# Database Queries Executed

None.

# Changes Made

- FE: Diner Card QR `src` uses same-origin `/d/{token}/image` (API host only in `import.meta.env.DEV`).
- BE: `GET /d/:token/image` sets `Cross-Origin-Resource-Policy: cross-origin` (belt-and-suspenders).
- FE: Invite dialog option rows use 18px/1fr grid + shared `radioControl` (no ad-hoc `marginTop: 3`).
- Contract tests updated.

# Commits

Not committed this turn (await Andre).

# Deployment Status

**CPD COMPLETE 2026-08-16.** FE tip `e2toazdpi` / `index-Cx2bTWAc.js`. BE health `45123b8c`. See `docs/deployments/2026-08-16_diner-qr-blank-card-corp-cpd.md`.

# Verification Results

- `node --test test/dinerQrPhase1Contract.test.js test/inviteToEatContract.test.js` → PASS
- `npm run test:share-contract` → PASS
- Live bundle contains same-origin `/d/${encodeURIComponent(String(T))}/image`
- BE `/health` `commit_hash` starts with `45123b8c`

# Remaining Risks

- Avatar photos still use Railway absolute URLs (optional selfie); same CORP risk if reported blank
- Human smoke of a real diner QR PNG still recommended

# Follow-Up Work

1. Human smoke: `/account/diner-qr` shows scannable PNG; Invite radios aligned
2. Optionally harden avatar media CORP / same-origin serving

# Final Verdict

CPD complete. Diner Card QR blank on menuply.com addressed via same-origin image path; Invite dialog option alignment shipped.
