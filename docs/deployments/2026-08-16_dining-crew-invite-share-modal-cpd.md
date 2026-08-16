# CPD — Dining Crew invite ShareModal (replace prototype)

**Date:** 2026-08-16  
**Scope:** FE (invite share UX). BE unchanged this CPD.

| Field | Value |
|-------|-------|
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| Feature commit | `bd3a8e5` (Share invite helper + UI; also in later tips) |
| Tip (this CPD) | Updated after deploy of tip including Share invite + pending FE HEAD |
| Bundle | set after tip-gate PASS |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | PASS apex + www (post-alias) |
| BE | unchanged for this feature; health at CPD start `5d111f78…` |
| Exception | none |

## Feature

Prototype Dining Crew invite (raw `<code>` URL + member id) replaced with ShareModal: Copy Link primary + SMS/Email/WhatsApp. Optional on social onboarding after Create Dining Crew. URLs locked to `https://menuply.com/...`.

## Verify

- Live bundle contains `Share invite`, `dining-crew-share-invite`, `Join my Dining Crew on Menuply`
- No `Member id (optional)` / `Create invite link` prototype dump
- `npm run test:share-contract` — pass (ShareModal consume-only)
- Contract: `test/diningCrewInviteShareContract.test.js`

## Restore

Use CURRENT LKG tip from `scripts/assert-menuply-production-tip.sh` after this CPD updates locks.
