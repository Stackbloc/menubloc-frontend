# Production Deploy + Last Known Good (LKG) Contract

**Established:** 2026-08-14  
**Type:** Contract (required procedure) + LKG registry  
**Cursor rule:** `.cursor/rules/production-deploy-and-lkg-contract.mdc` (`alwaysApply`)  
**Related:**  
- [Frontend deploy path](./2026-07-24_frontend-production-deploy-path-contract.md)  
- [Backend deploy path](./2026-07-28_backend-production-deploy-path-contract.md)  
**Tip gate:** `scripts/assert-menuply-production-tip.sh`  
**BE path gate:** `scripts/assert-backend-deploy-path.sh`  
**Priority:** Production safety — overrides convenience

---

## Purpose

Give every new agent a single place to find:

1. **Where** to deploy from  
2. **What** is currently live (LAST KNOWN GOOD)  
3. **Which prior tips** are restore targets (and what rolling back would undo)  
4. **How** to update LKG after a successful CPD  

Do **not** deploy from memory or from quarantined checkouts.

---

## CURRENT LAST KNOWN GOOD (live production — 2026-08-17)

Update this section **only** after tip-gate `RESULT=PASS` on apex + www **and** Railway `/health` matches the shipped BE SHA.

### Frontend (menuply.com)

| Field | Value |
|-------|-------|
| Authorized path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| Git commit | `2b0b024` — Account dashboard four tabs |
| Vercel deployment | `menubloc-frontend-kgtgek3l4-menuply.vercel.app` |
| Live bundle | `index-Br9O-thi.js` |
| Aliases | `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com` |
| Tip-gate | **PASS** (apex + www) verified 2026-08-17 |
| Feature | `/account` Profile / Social & Crew / Wallet & Activity / Security & Account over existing diner APIs |

### Backend (Railway)

| Field | Value |
|-------|-------|
| Authorized path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` @ clean `main` |
| Git commit | `fc669272` — Venue Phase 6 deferred docs (What We Doing APIs from `4a03818e`) |
| Health URL | `https://menubloc-backend-production.up.railway.app/health` |
| `commit_hash` | starts with `fc669272` |
| Migrations | `0250`–`0263` applied (`0263` what_we_doing + consumer_notifications) |
| Smoke | Health MATCH; four-tab dashboard strings in live FE bundle; BE unchanged |

### Restore current tip (if tip-gate fails mid-change)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
npx vercel alias set menubloc-frontend-kgtgek3l4-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-kgtgek3l4-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-kgtgek3l4-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-kgtgek3l4-menuply.vercel.app venues.menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://www.menuply.com
```

---

## Correct deployment routes (ONLY defaults)

### Frontend

1. Directory: `menubloc-frontend-main`  
2. Branch: `main`  
3. Working tree: **clean**  
4. `npx vercel --prod --yes`  
5. Alias apex + www (+ crm / venues as needed)  
6. Tip gate PASS on apex + www  
7. Update **this contract**, tip-gate script locks, and `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` together  

**Forbidden:** `menubloc-frontend/` (dirty mds), `_quarantine/frontend-deploy-forbidden/**`

### Backend

1. Path gate PASS on `menubloc-backend-main`  
2. Branch: `main`, tree **clean**  
3. Push `origin/main` (Railway auto-deploy) **or** `railway up` **only** from that directory  
4. `/health` `commit_hash` matches shipped SHA  
5. Apply scoped migrations/seeds only with `CONFIRM_PRODUCTION_TARGET=true` + `--allow-production`  

**Forbidden:** `menubloc-backend/` on `feature/billboard-multi-slot`, any dirty billboard checkout

### CPD meaning (“cpd”)

When Andre says **cpd**, agents must:

1. Commit on authorized clean `main` checkouts  
2. Push / deploy FE + BE as required by the feature  
3. Run tip-gate + health verify  
4. Update LKG locks in: tip-gate script · FE deploy guardrail · **this contract**  
5. Write `docs/deployments/YYYY-MM-DD_<topic>-cpd.md`  
6. Certify FE + BE deploy paths in the task response  

---

## Git checkpoint tags (code LKG — not tip aliases)

| Tag | Repo | SHA (at tag) | Meaning |
|-----|------|--------------|---------|
| `menuply-last-known-good-2026-08-14` | FE + BE authorized mains | FE `5c06c787` · BE `856d70dd` | Pre–Social Engine code checkpoint |
| `menuply-social-engine-known-good-2026-08-14` | FE + BE | FE `a89e0d6` · BE `b001e41e` | Pre–Social Onboarding |

These are **git** rollbacks. Live **Vercel tip** restore uses the deployment/bundle table below — not `git checkout` alone.

---

## Prior production tip restore points (do not restore unless Andre names them)

Newest superseded first. Restoring drops everything shipped after that tip.

| Deployment id | Bundle | Approx feature / CPD |
|---------------|--------|----------------------|
| `e2toazdpi` | `index-Cx2bTWAc.js` | **CURRENT** — diner-qr CORP blank + Invite align (`42c415b`) |
| `nzkm72fy0` | `index-DyvhJLLC.js` | Dining Crew invite ShareModal tip lock (`4ec654f`) — superseded by `e2toazdpi` |
| `aae62r0rr` | `index-CEl-scxL.js` | Waiter additive cluster updates (`2736d0c`) |
| `p1q70m1e8` | `index-xVp-udQI.js` | Diner onboarding guided introduction (`2eb3c23`) |
| `dkyh8n497` | `index-UoLq1e4f.js` | UCLA Place Westwood courtyard (`bd2e0a7`) |
| `8siyrjdn2` | `index-CTBCiaj0.js` | hide dead Google/Apple SSO |
| `8u2p5tci4` | `index-b_Ovc7EK.js` | USC/UCLA campus Place themes |
| `3ejgczu00` | `index-BrTJV97-.js` | Campus Dining |
| `a38ku52a4` | `index-BLw4kaBB.js` | All-profile readable white cards |
| `e9kop4og8` | `index-Di87A4Tc.js` | Social Onboarding text-invite |
| `1hqxwet9z` | `index-B0JBd4cG.js` | Pre text-invite onboarding |
| `6sk4due4f` | `index-D-I_Y4hm.js` | Social Onboarding (pre text-invite) |
| `4ru4hekmg` | `index-LSnxUvLR.js` | Profile readable surfaces |
| `5cd91e4s5` | `index-Cs95NUwq.js` | In-N-Out mobile splash-only |
| `gbli18jhr` | `index-BYCUQwwR.js` | In-N-Out splash logo centering |
| `ermw9wrlu` | `index-V7CvAska.js` | Dish photo clamps |
| `n0cvd9sri` | `index-CFRkrIiH.js` | Detail icons / Klaudette menu photos |
| `5crseazko` | `index-BJMGH4Bz.js` | Larger detail photo / hours |
| `1ac66vdd5` | `index-C9tZU1bB.js` | Compact sticky-hero dish photo |
| `p8hcw06bz` | `index-BcI_7aKO.js` | Dish photos desktop detail + search |
| `o7cgkvl22` | `index-D5A5vKki.js` | Dated Today hours all profiles |
| `hbxnqj1t3` | `index-CW_1SxW1.js` | Menu share menuply.com lock |
| `9jexq5xmv` | `index-DiSf7Eg5.js` | Public menu photo slot wrap |
| `99vcsavcl` | `index-BG0vkREZ.js` | Windows photo orientation |
| `ey3zs9v0a` | `index-COCr3wlP.js` | Owner+operator menu item photos |
| `om3o4bid8` | `index-DPIOa7vR.js` | ShareModal Copy Link primary |
| `dnpfzz326` | `index-DDTfE6hN.js` | Invite to Eat |
| `5bgthc6ie` | `index-BTCcz1Bv.js` | Food discussions MVP |
| `cmj2flhb5` | `index-CJWgOLqD.js` | Full SiteFooter hide (forbidden restore without confirmation) |
| `gltqad07l` | `index-shszZZc5.js` | Marketplace morning tip — NONSUBSCRIBER risk |
| `l0vcijcnl` | `index-CT17TZbQ.js` | Fine-only — drops Marketplace + Subscription Designer |

Full historical “do not restore” list also lives in `.cursor/rules/frontend-production-deploy-path-guardrail.mdc`.

---

## After every successful tip-gate PASS — update together

1. `scripts/assert-menuply-production-tip.sh` — `LOCKED_DEPLOY` + `LOCKED_BUNDLE`  
2. `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` — Current production tip  
3. `docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md` — Locked live tip table  
4. **This file** — CURRENT LAST KNOWN GOOD section + prepend new row to prior tips  
5. CPD under `docs/deployments/`  

If any of these disagree, treat tip-gate script + live `menuply.com` bundle as source of truth, then reconcile docs.

---

## Quick verify commands

```bash
# FE tip
bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com

# BE path + health
bash scripts/assert-backend-deploy-path.sh /Users/andrebarber/Desktop/menubloc/menubloc-backend-main
curl -sS https://menubloc-backend-production.up.railway.app/health

# Campus Dining smoke
curl -sS https://menubloc-backend-production.up.railway.app/public/clusters/usc/campus-dining
```

---

## Mandatory certifications (every task)

> ☐ FE DEPLOY PATH CERTIFICATION: …  
> ☐ BE DEPLOY PATH CERTIFICATION: …  

Full wording remains in the FE/BE path guardrail rules.
