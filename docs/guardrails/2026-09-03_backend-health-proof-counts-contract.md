# Backend Health Proof That Counts Contract

**Established:** 2026-09-03  
**Updated:** 2026-09-05 — FE-only / tip-gate / `not run — FE-only` also invalid when UI mutates production  
**Audience:** **All agents** (Claude Code, Cursor, Codex, Copilot, future) — not Cursor-only  
**Incident:** What I'm Cooking CPD listed BE SHA as “commit / health” without running `cpd-be.sh`; Quick Invite stayed 500 because migration 0305 was pending after code ship  
**Incident (2026-09-05):** After this contract closed SHA-in-table, agents waived E2E with FE-only on DOB/favorites Save → live Server error  
**Type:** Hard process guardrail — production BE completion claims  
**Priority:** Complements [Server runtime check](./2026-08-29_server-runtime-check-completion-contract.md) · [CPD playbook](./2026-08-20_cpd-agent-playbook.md) · [E2E verification](./2026-08-25_end-to-end-verification-completion-contract.md)

---

## Hard rule

**No agent may declare backend production work Complete / CPD done / Fixed / Verified / Working unless this turn pastes live output from the BE one door that includes both:**

1. `RESULT=PASS` from `bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-be.sh "…"`  
   (or `cpd-be.sh --no-push "…"` when push already happened)
2. `health_commit=<full SHA>` where that SHA **equals** the shipped `HEAD` (same as Railway `/health` `commit_hash`)

Prose, markdown tables, git log, “Railway should have deployed,” tip-gate PASS alone, or path-gate alone **do not count**.

---

## Door (mandatory)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-backend-main
# clean main required
bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-be.sh "short note"
# Must print RESULT=PASS and health_commit=<matching HEAD>
```

Already pushed:

```bash
bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-be.sh --no-push "verify after push"
```

`cpd-be.sh` already waits for `/health` SHA match and runs production smoke. Do not invent a parallel health ritual.

---

## Invalid proof (reject — CPD=INCOMPLETE)

| Claim | Why invalid |
|-------|-------------|
| CPD table cell `BE commit / health \| abc123` | No live script output |
| “Health should match after Railway deploy” | Assumption |
| Path-gate PASS only | Path ≠ live server |
| FE `cpd-fe.sh` RESULT=PASS only | Does not prove BE SHA or smoke |
| `/health` curl without smoke when routes changed | Incomplete per server-runtime contract |
| Schema/migration “pending” after code push | Code live + missing column → 500 (Quick Invite) |
| “FE-only” CPD for UI that calls PUT/POST/upload | Tip identity ≠ mutation success; still need E2E ([E2E contract](./2026-08-25_end-to-end-verification-completion-contract.md) 2026-09-05) |
| Cert line `not run — FE-only` + Claim Complete | Same class as SHA-in-table — checkbox theater |

**Note (2026-09-05):** The 2026-09-03 tighten closed **BE SHA-in-table**. Agents then waived **E2E/smoke** with FE-only. That waiver is also invalid. Do not invent a third excuse.

---

## Schema / migration ships

Health SHA match **does not** prove migrations applied.

When the ship adds or requires a DB column/table:

1. Apply the migration on production (or confirm column exists via live schema query)
2. Then run `cpd-be.sh` (or `--no-push`)
3. CPD note must say migration **applied** (not “pending”)

Leaving “migration pending” after BE code is live is **CPD=INCOMPLETE** and a production incident class.

---

## Agent stop line

> Per the Backend Health Proof That Counts Contract, I have not marked this backend work complete. Required: paste `cpd-be.sh` output with `RESULT=PASS` and `health_commit` matching shipped HEAD. A SHA in a CPD table does not count.

---

## Mandatory certification (every task that pushed / claimed BE production)

End with:

> ☐ BE HEALTH PROOF CERTIFICATION: `cpd-be.sh` [not run | RESULT=PASS | RESULT=INCOMPLETE/FAIL]; `health_commit` [sha \| missing]; matches HEAD [yes \| no \| n/a — no BE prod claim]; paste in chat [yes \| no]; migration [n/a \| applied \| still pending — incomplete].

If `cpd-be.sh` was not run or paste is missing → task is **INVALID** for any Complete / CPD done claim.

---

## Where this binds (all agents)

| Surface | Role |
|---------|------|
| This file | Authoritative contract |
| Root `CLAUDE.md` | Claude Code / shared agent entry |
| `menubloc-backend-main/CLAUDE.md` + `AGENTS.md` | Backend checkout agents |
| `.cursor/rules/backend-health-proof-counts-guardrail.mdc` | Cursor alwaysApply mirror |
| CPD playbook | Ship procedure |

Cursor rules alone are **not** sufficient authority — agents on other stacks must read this contract / CLAUDE.md.
