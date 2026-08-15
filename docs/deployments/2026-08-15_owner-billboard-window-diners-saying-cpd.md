# CPD — Owner billboard/window APIs + What Diners Are Saying consolidate

**Date:** 2026-08-15  
**STATUS: COMPLETE** — tip-gate PASS apex + www; Railway health MATCH; migration `0249` applied

## Shipped

Owner menu-console APIs to add entrance-splash billboards and profile Windows creatives (`content_type=window`). Restaurant profile social consolidated under a single **What Diners Are Saying** heading (Tips & discussion functionality retained without a second label).

| Repo | Commit | Message |
|------|--------|---------|
| BE | `321a04d0` | OWNER BILLBOARD/WINDOW — menu-console APIs + content_type window |
| FE | `caf4c7e` | PROFILE DINERS SAYING — single section; keep tips without second heading |

## Deploy path

| Step | Result |
|------|--------|
| BE path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` @ clean `main` |
| BE path-gate | PASS |
| BE push | `origin/main` → Railway |
| BE health | `commit_hash` `321a04d0…` MATCH |
| Migration | `0249` billboard `content_type=window` — RESULT=PASS (applied) |
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| FE deploy | `menubloc-frontend-nrrimolxv-menuply.vercel.app` |
| Alias | `menuply.com`, `www.menuply.com`, `crm.menuply.com` (venues cert retry pending) |
| Bundle | `index-Cf7g9qd7.js` |
| Tip-gate | **PASS** apex + www (after tip lock update) |

## Tip / LKG lock updated

- `scripts/assert-menuply-production-tip.sh` → `nrrimolxv` / `index-Cf7g9qd7.js`
- `.cursor/rules/frontend-production-deploy-path-guardrail.mdc`
- `.cursor/rules/production-deploy-and-lkg-contract.mdc`
- `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md`
- `docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md`

Do **not** restore `3ejgczu00` / `index-BrTJV97-.js` unless rolling back this FE ship.

## Human smoke (optional)

1. Open any restaurant profile — one **What Diners Are Saying** card; comments present; no **Tips & discussion** heading  
2. Owner session: `POST /api/owner/menu-console/restaurants/:id/billboards` and `.../windows` (after auth)  
