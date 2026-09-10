# CPD Agent Sandbox Verify Fallback Contract

**Established:** 2026-09-10  
**Incident:** 2026-09-10 — diner-video CPD looped on sandboxed `curl` CONNECT 403 / Vercel `auth.json` write denial while Railway+Vercel production were healthy  
**Audit:** `docs/audits/2026-09-10_cpd-agent-environment-friction.md`  
**Playbook:** `docs/guardrails/2026-08-20_cpd-agent-playbook.md`  
**Cursor rule:** `.cursor/rules/cpd-agent-sandbox-verify-fallback-guardrail.mdc`

## Hard rule

**Do not treat Cursor sandbox network/filesystem blocks as Menuply production outages.**  
When verify hops fail with CONNECT **403**, `fetch failed`, or Vercel cannot write `~/Library/.../com.vercel.cli/auth.json`, switch to the **allowlisted verify path** below. Do not loop the same sandboxed `curl` / `cpd-*.sh` health wait.

This contract does **not** waive tip-gate PASS, `cpd-be` health match, E2E, or tip-lock atomic rules — it only changes **how** those proofs are obtained when the agent sandbox blocks local HTTPS.

## Recognize sandbox (not outage)

| Signal | Meaning |
|--------|---------|
| `curl: (56) CONNECT tunnel failed, response 403` | Sandbox proxy blocked outbound HTTPS |
| Local tip-gate / smoke all fail instantly with “fetch failed” | Same |
| `Not able to create …/com.vercel.cli/auth.json (operation not permitted)` | Sandbox FS blocked Vercel CLI home write |
| `npx vercel` pulls CLI 59 + registry ENOTFOUND / fetch failed | Prefer PATH `vercel` (project-known) outside sandbox |
| `required_permissions: ["all"]` still sandboxed | Do not retry forever; use railway-run verify |

## Required fallback (allowlisted)

From `menubloc-backend-main` (Railway CLI usually allowlisted):

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-backend-main

# Health
railway run --service menubloc-backend --environment production -- \
  node -e 'fetch("https://menubloc-backend-production.up.railway.app/health").then(r=>r.json()).then(j=>console.log(JSON.stringify(j))).catch(e=>{console.error(e);process.exit(1)})'

# Smoke
railway run --service menubloc-backend --environment production -- \
  node scripts/productionSmokeProbe.js

# Tip-gate apex + www
railway run --service menubloc-backend --environment production -- \
  bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://menuply.com
railway run --service menubloc-backend --environment production -- \
  bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://www.menuply.com
```

For Vercel alias when CLI cannot write auth: use Vercel REST `POST /v2/deployments/<dpl_…>/aliases?teamId=…` from a `railway run` Node one-liner (token from existing CLI `auth.json` — never print the token). Prefer unlocking unrestricted shell for `vercel alias set` when Andre can approve.

## Still required for Complete

- FE: live tip verified + tip locked + tip-gate **PASS** apex+www (via local or railway-run) + LKG sync + mutation E2E when applicable  
- BE: shipped HEAD matches `/health` `commit_hash` + smoke PASS (via local `cpd-be.sh` or railway-run equivalent pasted in chat)  
- Never restore tip solely for `STALE_LOCK`  
- Never claim Complete from sandboxed FAIL while railway-run PASS exists undocumented

## Agent stop lines

> Local curl/tip-gate failed with CONNECT 403 (sandbox). I am re-running health/smoke/tip-gate via `railway run`. I have not declared production down.

> Vercel CLI cannot write auth.json under the sandbox. I will use an unrestricted shell or the Vercel API alias path — not loop `npx vercel` installs.

## Mandatory on EVERY CPD / tip-gate / smoke task

End with:

> ☐ CPD SANDBOX FALLBACK CERTIFICATION: Local verify [PASS | blocked CONNECT 403 / auth.json | not run]; fallback used [none | railway run health/smoke/tip-gate | Vercel API alias]; tip-gate apex/www [PASS | FAIL | not run]; smoke/health [PASS | FAIL | not run]; treated sandbox as outage [no].
