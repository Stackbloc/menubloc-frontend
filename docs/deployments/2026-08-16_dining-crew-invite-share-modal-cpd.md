# CPD — Dining Crew invite ShareModal (replace prototype)

**Date:** 2026-08-16  
**Scope:** FE (invite share UX). BE unchanged for this feature.

| Field | Value |
|-------|-------|
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ `main` |
| Feature commits | `bd3a8e5`+; tip lineage includes `42c415b` diner-qr same-origin |
| **CURRENT tip (live)** | `menubloc-frontend-e2toazdpi-menuply.vercel.app` / `index-Cx2bTWAc.js` |
| Historical tip (this CPD first lock) | `menubloc-frontend-nzkm72fy0-menuply.vercel.app` / `index-DyvhJLLC.js` @ `4ec654f` — **superseded** by diner-qr CORP hotfix tip |
| Tip-gate | PASS apex (CURRENT lock) |
| BE health | `45123b8c` (unchanged for invite-share) |
| Exception | none |

## Feature

Prototype Dining Crew invite (raw URL + member id) → ShareModal **Share invite**. Optional on onboarding.

## Verify

- Live bundle (`index-Cx2bTWAc.js`): `Share invite`, `dining-crew-share-invite`, `Join my Dining Crew on Menuply`
- Tip-gate PASS on CURRENT LKG

## Restore (CURRENT LKG — preferred)

```bash
npx vercel alias set menubloc-frontend-e2toazdpi-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-e2toazdpi-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-e2toazdpi-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-e2toazdpi-menuply.vercel.app venues.menuply.com
```

Do **not** restore `nzkm72fy0` / `DyvhJLLC` unless Andre names that tip.
