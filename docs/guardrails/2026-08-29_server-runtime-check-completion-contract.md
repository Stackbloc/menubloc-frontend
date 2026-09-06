# Server Runtime Check Completion Contract

**Established:** 2026-08-29  
**Updated:** 2026-09-03 — proof-that-counts (all agents): paste `cpd-be.sh` `RESULT=PASS` + matching `health_commit`; see [Backend Health Proof That Counts](./2026-09-03_backend-health-proof-counts-contract.md)  
**Updated:** 2026-09-05 — FE ships that call server mutations cannot waive smoke/E2E with “FE-only”  
**Incident:** Owner Profile Manager billboard upload returned generic **"Server error"** after BE CPD; only `/health` commit match was verified — no route-level smoke before declaring done.  
**Incident (2026-09-05):** FE CPD for DOB/favorites Save; certifications `not run — FE-only`; user hit **Server error** on `PUT` profile. Same class as billboard — mutation never proven.  
**Type:** Hard process guardrail — completion / “done” claims for server work  
**Priority:** Complements [End-to-End Verification Completion Contract](./2026-08-25_end-to-end-verification-completion-contract.md); applies to every backend route/mutation ship **and** FE ships that exercise those mutations  
**Related:** [CPD Agent Playbook](./2026-08-20_cpd-agent-playbook.md) · [Backend production deploy path](./2026-07-28_backend-production-deploy-path-contract.md) · [Health proof that counts](./2026-09-03_backend-health-proof-counts-contract.md)

---

## Hard rule

**No agent may declare backend/server work complete, fixed, CPD-done, or ready to ship unless production (or the declared target environment) passes the backend smoke gate with `RESULT=PASS`.**

Static contract tests, code review, and `/health` commit match alone are **not** sufficient when routes were added or changed.

**Proof that counts (2026-09-03):** Completeness requires **pasted** `cpd-be.sh` output with `RESULT=PASS` and `health_commit` matching shipped `HEAD`. A SHA written into a CPD markdown table does **not** count. See the health-proof contract.

**FE-only is not a waiver (2026-09-05):** Shipping or claiming Complete for UI that POSTs/PUTs/PATCHes production (profile save, upload, order, etc.) **is server-behavior scope**. Tip-gate PASS does not replace smoke + authenticated E2E. Writing `SERVER RUNTIME … not run — FE-only` while claiming the Save works is **INVALID**.

---

## Applies to

Every task that:

- Adds, changes, or fixes a backend route, service, migration, or upload handler
- Ships via `menubloc-backend-main` push / Railway
- Claims Fixed / Working / Verified / Complete / CPD done for server behavior
- **FE CPD / tip ship that adds or changes a control which calls a production API mutation** (even if BE files were not edited this turn)

---

## Required gate (mandatory)

### After every backend production push (CPD)

```bash
bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-be.sh "short note"
```

Or, when push already happened:

```bash
bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-be.sh --no-push "verify after push"
```

**CPD complete only when:**

1. `assert-backend-deploy-path.sh` → `RESULT=PASS`
2. Railway `/health` `commit_hash` matches pushed `HEAD`
3. `assert-backend-production-smoke.sh` → `RESULT=PASS` (no 5xx on probed routes)

### Before declaring any server task complete (even without CPD)

```bash
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-backend-production-smoke.sh
```

Or from `menubloc-backend-main`:

```bash
node scripts/productionSmokeProbe.js
```

---

## What smoke proves

| Proves | Does not prove |
|--------|----------------|
| Probed routes are mounted and return **not 5xx** when unauthenticated | Authenticated mutation success |
| Core search/browse still respond | DB schema correctness for all edge cases |
| Owner menu-console billboard/window mounts respond 401/400 (not 500) | File upload with real image + owner session |

**Authenticated flows** still require E2E hops per the E2E contract (upload → persist → read-back).

When smoke PASS but user still sees 500 with a session, treat as **NOT COMPLETE** until owner-authenticated reproduction + fix + re-smoke.

---

## Probe authority

Canonical list: `menubloc-backend-main/src/deploymentOps/backendProductionSmokeProbes.js`

When adding owner/operator/consumer routes that must not regress to 500:

1. Add a probe row (method, path, allowed statuses without 5xx)
2. Extend `test/backendProductionSmokeContract.test.js` anchor if probe count changes
3. Re-run smoke before declaring done

---

## Never claim complete based only on

- `/health` commit match without smoke
- Static `ownerBillboardWindowContract.test.js` (file reads only)
- “Route exists in source”
- Prior audit for a different route set without re-run after this change
- **“FE-only” / “not run — FE-only”** when the ship includes an API Save/upload/mutation UI
- Unauthenticated **401** as proof the authenticated path works
- Tip-gate / `cpd-fe.sh` PASS as substitute for smoke + E2E on the mutation

---

## Agent stop line

> Per the Server Runtime Check Completion Contract, I have not marked this backend work complete. Production smoke is [not run | FAIL]. `/health` alone is insufficient. FE-only is not an exemption for mutation UI.

---

## Mandatory certification (every task touching backend routes **or FE mutation UI**)

End every response with:

> ☐ SERVER RUNTIME CHECK CERTIFICATION: Production smoke [PASS | FAIL — reason | not run → claim must be not complete if mutation UI/BE in scope]; `/health` SHA [match | lag | not checked]; probed routes [list or n/a]; authenticated E2E [PASS | not run → claim must be not complete if mutation in scope | n/a — no mutation this task].

**Forbidden certification text when claiming Complete/CPD done for a Save/mutation:** `not run — FE-only`, `not run — BE unchanged`, `n/a` for authenticated E2E while the UI Save was shipped.

When backend routes were edited, smoke **must** be PASS before `Complete` / `CPD done`.  
When FE mutation UI was shipped, authenticated E2E for that mutation **must** be PASS (or task remains NOT COMPLETE) even if smoke was not re-run because BE files were unchanged — still run smoke if user reports Server error / 5xx.

---

## Files

| File | Role |
|------|------|
| `scripts/cpd-be.sh` | One-door BE CPD (path → push → health → smoke) |
| `scripts/assert-backend-production-smoke.sh` | Smoke wrapper |
| `menubloc-backend-main/scripts/productionSmokeProbe.js` | Probe runner |
| `menubloc-backend-main/src/deploymentOps/backendProductionSmokeProbes.js` | Canonical probe list |
| `menubloc-backend-main/test/backendProductionSmokeContract.test.js` | Contract test |
