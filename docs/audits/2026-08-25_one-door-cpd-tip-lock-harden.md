# Summary

Audited the existing FE one-door CPD / tip-lock / tip-gate / LKG architecture after a LIVE≠LOCK incident (`l1u8ibp3k`/`D3_g8ZsE` live while lock still referenced `131htahdl`/`DSw0msiq`). Hardened that door; discarded a parallel production-state WIP (`what-is-live-tip`, `scripts/state`, second lock authority).

# Problem Statement

CPD could move production (`vercel --prod` / alias) and be narrated as progress while tip-gate locks and LKG docs lagged. Tip-gate historically used a single `FAIL` for both stale locks and unhealthy tips, enabling panic-restore or false “done.”

# Root Cause

Enforcement was procedural (playbook checklist), not gated. Tip-lock atomic contract existed but agents could stop after deploy. No `CPD=INCOMPLETE` outcome. Lock did not sync existing LKG files. Parallel WIP would have added a second authority — rejected.

# Evidence Collected

- Playbook: multi-step manual FE CPD; lock after alias; LKG hand-sync step 7.
- Tip-gate (pre-harden): `FAIL: bundle != locked tip` exit 1 for healthy mismatch.
- Live verify 2026-08-25 post-harden: apex+www `RESULT=PASS` for `l1u8ibp3k` / `index-D3_g8ZsE.js`.
- Parallel files deleted: `what-is-live-tip.sh`, `restore-menuply-production-tip.sh`, `scripts/lib/*`, `test/menuplyProductionTipState.test.js`.

# Files Examined

- `docs/guardrails/2026-08-20_cpd-agent-playbook.md`
- `docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md`
- `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md`
- `scripts/assert-menuply-production-tip.sh`, `lock-menuply-production-tip.sh`
- Cursor rules: production-deploy-and-lkg, frontend-production-deploy-path, tip-lock-atomic

# Database Queries Executed

None.

# Changes Made

1. Tip-gate: `PASS` (0) / `STALE_LOCK` (3) / `UNHEALTHY` (2) — no lib dependency.
2. Lock: still updates tip-gate; now best-effort syncs existing LKG docs/rules/mirrors (no `scripts/state`).
3. `cpd-fe.sh`: thin orchestrator of existing steps; exits `CPD=INCOMPLETE` if tip-gate not PASS.
4. Playbook + tip-lock contract + Cursor rules: one door; bypasses called out; completion = PASS only.
5. Removed parallel WIP scripts.

# Commits

Not committed this turn (await Andre if desired). Workspace + `menubloc-frontend-main/scripts/` updated in place.

# Deployment Status

No FE/BE production deploy. Live tip unchanged: `l1u8ibp3k` / `index-D3_g8ZsE.js`. Tip-gate PASS verified.

# Verification Results

```
bash scripts/assert-menuply-production-tip.sh https://menuply.com  → RESULT=PASS
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com → RESULT=PASS
```

STALE_LOCK path: intentional mismatch → exit 3, restore hints absent for healthy mismatch.

# Remaining Risks

- Vercel can still move production via raw `--prod` / alias — cannot fully disable in-repo; detected as incomplete unless lock+PASS finish.
- LKG markdown sync is best-effort regex; tip-gate `LOCKED_*` remains authority if docs drift.
- FE repo docs commit still required for versioned tip-gate.

# Follow-Up Work

- Commit tip-gate + lock + playbook/contracts into `menubloc-frontend-main` (docs-only).
- Optional: mirror playbook into BE docs if desired.
- Smoke `cpd-fe.sh --lock-only` on next intentional tip move.

# Final Verdict

Hole in the existing door closed without building a second door. One normal entry: `cpd-fe.sh`. Tip-gate distinguishes stale lock vs unhealthy. Lock owns existing LKG sync. Incomplete CPD is explicit.
