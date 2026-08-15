# CPD — Operator Camera batch upload

**Date:** 2026-08-15  
**Feature:** Operator `/operator/menu/camera-upload` — select all photos, then Upload & read once  
**Status:** **CPD COMPLETE**

## Deploy path

| Field | Value |
|-------|-------|
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| Branch | `main` (clean after push) |
| Commit | `6087940` — OPERATOR CAMERA — batch select then upload & read all pages |
| Deploy | `npx vercel --prod --yes` → `menubloc-frontend-jfonf570v-menuply.vercel.app` |
| Alias | `menuply.com`, `www.menuply.com`, `crm.menuply.com` (venues cert soft-fail) |
| Bundle | `index-bXMEeelE.js` |
| Tip-gate | **PASS** apex + www |
| BE | unchanged this CPD; live `/health` `commit_hash` `321a04d0…` |

## Verification

- Contract: `node test/operatorMenuCameraBatchUploadContract.test.js` → ok  
- Live bundle contains `Upload & read all pages`  
- Tip-gate markers: sd=32, Coming Soon=7, railway=61 / localhost=9, NONSUBSCRIBER=0  

## LKG locks updated

- `scripts/assert-menuply-production-tip.sh`  
- `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md`  
- `docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md`  
- `.cursor/rules/production-deploy-and-lkg-contract.mdc`  
- `.cursor/rules/frontend-production-deploy-path-guardrail.mdc`  

## Prior tip (restore only if rolling back this CPD)

- `menubloc-frontend-nrrimolxv-menuply.vercel.app` / `index-Cf7g9qd7.js` (`caf4c7e`)

## Notes

- GitHub auto-deploy `re9fqqa5r` also built from push; production custom domains deliberately held on `jfonf570v` after tip probe.  
- FE-only; no capture-worker or Stripe changes.
