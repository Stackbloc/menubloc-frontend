# Production Tip Lock Atomic Contract

**Established:** 2026-08-24  
**Updated:** 2026-08-25 — `RESULT=STALE_LOCK` vs `UNHEALTHY`; lock syncs existing LKG; one-door `cpd-fe.sh`  
**Type:** Contract (hard stop) — tip thrash prevention  
**Cursor rule:** `.cursor/rules/production-tip-lock-atomic-guardrail.mdc` (`alwaysApply`)  
**One door:** `scripts/cpd-fe.sh`  
**Helper:** `scripts/lock-menuply-production-tip.sh`  
**Tip gate:** `scripts/assert-menuply-production-tip.sh`  
**Related:** [CPD playbook](./2026-08-20_cpd-agent-playbook.md) · [LKG contract](./2026-08-14_production-deploy-and-lkg-contract.md)

---

## Incident this prevents

Agents ship a good FE tip, alias `menuply.com`, then run tip-gate **before** updating `LOCKED_BUNDLE` / `LOCKED_DEPLOY`. Tip-gate used to print `FAIL: bundle != locked tip`. Agents treat that as a failed deploy and **restore the old tip**, undoing the ship — or they leave docs/rules pointing at a dead tip while live apex is new. Next agent restores the wrong tip from stale mirrors.

**Healthy live ≠ locked tip is a lock/CPD-incomplete problem, not a bad deploy.**

---

## Hard rule (atomic tip lock)

After every FE production alias that intentionally moves `menuply.com`:

1. **Alias** the new deployment to menuply hosts  
2. **Lock** tip-gate + sync **existing** LKG docs/rules/mirrors (`lock-menuply-production-tip.sh`)  
3. **Prove** tip-gate `RESULT=PASS` on apex + www  
4. **Commit** the lock/docs (docs-only — do **not** redeploy for locks)

Prefer: `bash scripts/cpd-fe.sh "…"`.

**Never** restore `LOCKED_DEPLOY` solely because tip-gate returns `STALE_LOCK` while the live apex bundle is the ship you just aliased.

**CPD is incomplete** until step 3 PASS (and LKG sync ran). Deploy success alone ≠ complete.

---

## Tip-gate results

| Result | Exit | Meaning | Action |
|--------|------|---------|--------|
| `PASS` | 0 | Live matches lock + healthy | OK |
| `STALE_LOCK` | 3 | Live healthy, lock outdated | Lock live tip — **do not restore** |
| `UNHEALTHY` | 2 | Content/identity failure | Investigate; restore only with explicit LKG deploy |

---

## Canonical order (copy this)

```bash
# Preferred one door:
bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-fe.sh "short feature label"

# Manual equivalent:
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
vercel --prod --yes
DEPLOY=menubloc-frontend-<id>-menuply.vercel.app
vercel alias set "$DEPLOY" menuply.com
vercel alias set "$DEPLOY" www.menuply.com
vercel alias set "$DEPLOY" crm.menuply.com
vercel alias set "$DEPLOY" venues.menuply.com
BUNDLE=$(curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)
bash /Users/andrebarber/Desktop/menubloc/scripts/lock-menuply-production-tip.sh \
  "$DEPLOY" "$BUNDLE" \
  --fe-commit "$(git rev-parse --short HEAD)" \
  --be-commit "$(curl -s https://menubloc-backend-production.up.railway.app/health | sed -n 's/.*"commit_hash":"\([^"]*\)".*/\1/p' | cut -c1-8)" \
  --note "short feature label"
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://menuply.com
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://www.menuply.com
# Both must print RESULT=PASS — else CPD=INCOMPLETE
```

---

## Decision tree when tip-gate is not PASS

| Message / situation | Meaning | Action |
|---------------------|---------|--------|
| `RESULT=STALE_LOCK` and apex bundle **is** the new ship | Locks not updated yet | Run `lock-menuply-production-tip.sh` → re-run tip-gate. **Do not restore.** |
| `RESULT=STALE_LOCK` and apex bundle is **unexpected** | Wrong alias | Fix alias to intended tip, then lock |
| `RESULT=UNHEALTHY` (NONSUBSCRIBER / API / Marketplace / Tabl M / no bundle) | Content health failure | Do **not** call it a lock miss — restore prior LKG tip if new tip is unhealthy |
| Tip-gate PASS but Cursor rules / LKG docs still show old tip | Docs drift (should be rare — lock syncs) | Re-run lock or fix mirrors; CPD incomplete until they match tip-gate |

---

## Files that must agree (same tip)

| # | File | What to set |
|---|------|-------------|
| 1 | `scripts/assert-menuply-production-tip.sh` (**workspace + FE repo**) | `LOCKED_DEPLOY` + `LOCKED_BUNDLE` (**source of truth for tip-gate**) |
| 2 | `.cursor/rules/production-deploy-and-lkg-contract.mdc` | CURRENT LKG FE tip row |
| 3 | `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` | One-door CPD + tip-gate results (not a second tip ID store) |
| 4 | `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md` | CURRENT LAST KNOWN GOOD + restore commands |
| 5 | `docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md` | Locked live tip table |
| 6 | `menubloc-frontend-main/docs/guardrails/2026-08-14_…lkg….md` | Mirror of #4 |
| 7 | `menubloc-backend-main/docs/guardrails/2026-08-14_…lkg….md` | Mirror of #4 |

`lock-menuply-production-tip.sh` updates #1 and best-effort syncs #2/#4/#5/#6/#7. **No** `scripts/state/*.json` parallel authority.

If any disagree: **tip-gate script + live menuply.com bundle win** → re-lock.

---

## Never without Andre current-turn exception

- Treat `STALE_LOCK` alone as reason to roll back a just-aliased good tip  
- Leave tip-gate script and Cursor LKG rules on different tips after claiming CPD complete  
- Redeploy FE solely to “fix” a lock mismatch  
- Update only one of the tip-lock files above  
- Build a second tip/LKG state store beside tip-gate  

---

## Agent stop lines

When tip-gate is STALE_LOCK after a deliberate alias:

> Tip-gate `STALE_LOCK` after aliasing the intended tip. I am locking the tip-gate script to the live deploy/bundle and re-running tip-gate. I am not restoring the previous tip. CPD remains incomplete until PASS.

When docs still disagree after PASS:

> Tip-gate PASS but LKG mirrors disagree. CPD is incomplete until tip-lock files match. I have not declared done.

---

## Mandatory certification (every FE prod alias / CPD)

End the response with:

> ☐ TIP LOCK CERTIFICATION: Intended tip [deploy / bundle]; tip-gate script locked [yes|no]; tip-gate apex/www [PASS|STALE_LOCK|UNHEALTHY|not run]; LKG docs+rules+mirrors match tip-gate [yes|no|pending]; panic-restore avoided [yes|n/a].

---

## Relationship to other contracts

- **This contract owns:** when/how to lock tip after alias, and how to interpret `STALE_LOCK`.  
- **LKG contract owns:** what the current tip *is* and prior restore targets.  
- **FE deploy path owns:** which directory may run `vercel --prod` / `cpd-fe.sh`.  
- **CPD playbook owns:** the short Commit→Deploy checklist (must cite this contract for tip lock).
