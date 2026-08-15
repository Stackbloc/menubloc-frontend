# CPD — College Cluster Campus Dining

**Date:** 2026-08-14  
**STATUS: COMPLETE** — tip-gate PASS apex + www; Railway health MATCH; migration `0248` + USC seed applied

## Shipped

Lightweight Campus Dining on `university` clusters: place shells + `food_activity` (place-only I'm Eating allowed). No menu analysis / ingestion platform.

| Repo | Commit | Message |
|------|--------|---------|
| BE | `a2ae326c` | CAMPUS DINING — university cluster locations + place-only food activity |
| FE | `eb1b377` | CAMPUS DINING — College Cluster section + place-only I'm Eating |

## Deploy path

| Step | Result |
|------|--------|
| BE path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` @ clean `main` |
| BE path-gate | PASS |
| BE push | `origin/main` → Railway |
| BE health | `commit_hash` `a2ae326c2abd12baa713cfdee339cfe5e83dc3c7` |
| Migration | `0248` `is_campus_dining` — RESULT=PASS |
| Seed | USC Village / Parkside / Everybody's Kitchen — RESULT=PASS count=3 |
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| FE deploy | `menubloc-frontend-3ejgczu00-menuply.vercel.app` |
| Alias | `menuply.com`, `www.menuply.com`, `crm.menuply.com` (venues cert retry pending) |
| Bundle | `index-BrTJV97-.js` |
| Tip-gate | **PASS** apex + www |

## Smoke

- `GET /public/clusters/usc/campus-dining` → 3 locations  
- Tip-gate railway≈61 localhost≈9; NONSUBSCRIBER=0  

## Tip / LKG lock updated

- `scripts/assert-menuply-production-tip.sh` → `3ejgczu00` / `index-BrTJV97-.js`  
- `.cursor/rules/frontend-production-deploy-path-guardrail.mdc`  
- `.cursor/rules/production-deploy-and-lkg-contract.mdc` (**new**)  
- `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md` (**new** authoritative LKG registry)  
- `docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md`  

Do **not** restore `a38ku52a4` / `index-BLw4kaBB.js` unless rolling back Campus Dining FE.

## Human smoke (optional)

1. Open `https://menuply.com/clusters/usc` — Campus Dining section with 3 halls  
2. Non-university cluster — no Campus Dining section  
3. Logged-out can view; account needed to post I'm Eating / comments  
