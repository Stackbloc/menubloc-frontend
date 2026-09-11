# Pre-CPD E2E + Server Check Gate Contract

**Established:** 2026-09-08  
**Updated:** 2026-09-11 — post-alias live-tip E2E required for Feed shell / overlay / nav ships (lab Playwright alone forbidden)  
**Incident:** 2026-09-08 — quick food-status CPD tip-gate PASS; authenticated E2E not run; `/feed/profile` blank on production. Agent claimed CPD while Completeness hops were skipped.  
**Incident:** 2026-09-11 — Edit/Connect CPD tip-gate PASS + localhost mocked E2E; live mobile buttons dead.  
**Type:** Hard process guardrail — applies before any `cpd` acceptance and before Complete claims  
**Priority:** Overrides tip-gate PASS, “FE-only,” lab-only E2E, and “CPD first, verify later”  
**Related:** [E2E completion](./2026-08-25_end-to-end-verification-completion-contract.md) · [Server runtime](./2026-08-29_server-runtime-check-completion-contract.md) · [Health proof that counts](./2026-09-03_backend-health-proof-counts-contract.md) · [CPD playbook](./2026-08-20_cpd-agent-playbook.md)

---

## Hard rule

**At the START of every task** (first agent reply after the user states the work), **and again before Complete / before accepting `cpd`**, the agent must:

1. **Classify** whether this task requires **E2E check** and whether it requires **server check**
2. **State both classifications explicitly** in chat (yes / no + one-line why)
3. If either is **required**, plan to run it before Complete; **paste PASS results before `cpd`**
4. **Refuse `cpd`** until required checks are PASS (or Andre grants a named current-turn exception)

Tip-gate / `cpd-fe.sh` / path-gate alone never replace this gate.

**Start-of-task is non-negotiable.** Do not wait until the end, until deploy, or until Andre asks “did you check E2E?”  
**Do not begin implementation** (edits, commits, deploy) until the START classify block has been stated in the first reply.  
**Do not accept `cpd`** until the results block shows PASS or NOT REQUIRED for both axes.

---

## Classification (at task START — not after deploy)

### E2E check REQUIRED when any of

- UI that creates/updates/deletes via API (Post, Save, upload, invite, report, compose, etc.)
- New or changed consumer/owner/operator mutation path
- Media upload / durable URL path
- Auth session mutation that must succeed for the feature
- Blank-screen risk on a primary route changed this turn (`/`, `/feed`, `/feed/profile`, Waiter, etc.)
- Feed shell / primary nav / mobile header / Edit·Connect / media overlay leftover handling

### After FE tip alias (same ships)

Lab E2E on `localhost` may **start** confidence during coding. **Completeness / CPD done** for the ships above also requires a **post-alias live-tip hop** on `https://menuply.com` (or the aliased prod URL) per the E2E contract “Production tip hop” section. Tip-gate PASS does not replace that hop.
### E2E check NOT required when all of

- Docs / guardrails / LKG tip-lock text only
- Pure static copy with no runtime path change
- Read-only display tweak with no new fetch/mutation (still verify no blank screen if a primary route file changed — treat route crash risk as E2E-required)

### Server check REQUIRED when any of

- Backend routes/services/migrations changed
- FE mutation UI shipped that depends on production API behavior (even if BE files unchanged this turn)
- Smoke probes / health must match for Completeness of a BE ship

### Server check NOT required when

- Docs-only / tip-lock-docs-only after a prior PASS the same turn already pasted
- Pure FE presentation with **no** API mutation and **no** BE change (E2E still may be required for blank-screen / render)

**Default when unsure:** REQUIRED for both. Ask Andre only if classification is truly ambiguous — do not default to skip.

---

## Mandatory statement

### At task START (first reply — before edits/deploy)

```
☐ PRE-CPD GATE (classify — task START):
  E2E check required: [YES | NO] — [one-line why]
  Server check required: [YES | NO] — [one-line why]
```

### Before Complete and before accepting `cpd` (re-classify + results)

```
☐ PRE-CPD GATE (classify — before cpd):
  E2E check required: [YES | NO] — [one-line why]
  Server check required: [YES | NO] — [one-line why]

☐ PRE-CPD GATE (results — required before accepting cpd):
  E2E: [NOT REQUIRED | PASS — evidence… | FAIL — … | NOT RUN → CPD FORBIDDEN]
  Server: [NOT REQUIRED | PASS — paste cpd-be/smoke/health… | FAIL — … | NOT RUN → CPD FORBIDDEN]
```

If user says `cpd` and either required line is `NOT RUN` or `FAIL` → **do not deploy**. Stop with:

> Pre-CPD gate blocked. E2E and/or server check is required and not PASS. I have not started CPD. Results must be confirmed first.

---

## Accepting `cpd`

| Gate | Allowed to start `cpd-fe.sh` / `cpd-be.sh`? |
|------|-----------------------------------------------|
| E2E required + PASS (or NOT REQUIRED) | Yes for that axis |
| Server required + PASS (or NOT REQUIRED) | Yes for that axis |
| Either required + NOT RUN / FAIL | **No** — refuse |
| Andre current-turn exception naming the skip | Yes — document exception on cert line |

After CPD doors run, Completeness still follows E2E + server contracts. This gate is the **entry** lock so agents cannot “ship then shrug.”

---

## Relationship to existing contracts

- Does **not** weaken E2E or server-runtime contracts — it **front-loads** them before CPD
- Tip-gate PASS remains required for FE tip Completeness — **in addition**, not instead
- Health proof that counts remains required for BE Completeness — **in addition**, not instead

---

## Agent stop lines

**Classification skipped at START:**

> I did not state E2E vs server-check requirements at task start. Per the Pre-CPD gate contract I must classify both in the first reply before continuing.

**CPD refused:**

> Pre-CPD gate blocked. E2E and/or server check is required and not PASS. I have not started CPD.

---

## Mandatory on EVERY task

- **First reply:** PRE-CPD GATE classify (task START) block  
- **Every completion / before `cpd`:** PRE-CPD GATE results block (results may be `NOT RUN` if work is still local — then Complete/`cpd` is forbidden if those checks were required)
