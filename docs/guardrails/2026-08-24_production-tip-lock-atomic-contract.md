# Production Tip Lock Atomic Contract

**Established:** 2026-08-24  
**Type:** Contract (hard stop) — tip thrash prevention  
**Cursor rule:** `.cursor/rules/production-tip-lock-atomic-guardrail.mdc` (`alwaysApply`)  
**Helper:** `scripts/lock-menuply-production-tip.sh`  
**Tip gate:** `scripts/assert-menuply-production-tip.sh`  
**Related:** [CPD playbook](./2026-08-20_cpd-agent-playbook.md) · [LKG contract](./2026-08-14_production-deploy-and-lkg-contract.md)

---

## Incident this prevents

Agents ship a good FE tip, alias `menuply.com`, then run tip-gate **before** updating `LOCKED_BUNDLE` / `LOCKED_DEPLOY`. Tip-gate prints `FAIL: bundle != locked tip`. Agents treat that as a failed deploy and **restore the old tip**, undoing the ship — or they leave docs/rules pointing at a dead tip while live apex is new. Next agent restores the wrong tip from stale mirrors.

**`bundle != locked tip` is usually a lock problem, not a bad deploy.**

---

## Hard rule (atomic tip lock)

After every FE production alias that intentionally moves `menuply.com`:

1. **Alias** the new deployment to menuply hosts  
2. **Lock** the tip-gate script to that exact deploy + bundle (`lock-menuply-production-tip.sh`)  
3. **Prove** tip-gate `RESULT=PASS` on apex + www  
4. **Mirror** the same tip into LKG docs + Cursor rules + FE/BE mirrors  
5. **Commit** the lock/docs (docs-only — do **not** redeploy for locks)

**Never** restore `LOCKED_DEPLOY` solely because tip-gate failed with `bundle != locked tip` while the live apex bundle is the ship you just aliased.

---

## Canonical order (copy this)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
# tree must be clean @ main before vercel --prod

vercel --prod --yes
# Production URL → DEPLOY=menubloc-frontend-<id>-menuply.vercel.app

vercel alias set "$DEPLOY" menuply.com
vercel alias set "$DEPLOY" www.menuply.com
vercel alias set "$DEPLOY" crm.menuply.com
vercel alias set "$DEPLOY" venues.menuply.com

BUNDLE=$(curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)
echo "LIVE_BUNDLE=$BUNDLE DEPLOY=$DEPLOY"

# REQUIRED before tip-gate when tip intentionally moved:
bash /Users/andrebarber/Desktop/menubloc/scripts/lock-menuply-production-tip.sh \
  "$DEPLOY" "$BUNDLE" \
  --fe-commit "$(git rev-parse --short HEAD)" \
  --be-commit "$(curl -s https://menubloc-backend-production.up.railway.app/health | sed -n 's/.*"commit_hash":"\([^"]*\)".*/\1/p' | cut -c1-8)" \
  --note "short feature label"

bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://menuply.com
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://www.menuply.com
# Both must print RESULT=PASS

# Then update CURRENT LKG in the files listed by lock script output (same DEPLOY + BUNDLE everywhere)
```

---

## Decision tree when tip-gate FAIL

| Message / situation | Meaning | Action |
|---------------------|---------|--------|
| `FAIL: bundle != locked tip` and apex bundle **is** the new ship | Locks not updated yet | Run `lock-menuply-production-tip.sh` with live deploy+bundle → re-run tip-gate. **Do not restore.** |
| `FAIL: bundle != locked tip` and apex bundle is **unexpected** / broken | Wrong alias or bad build | Fix alias to intended good tip, or restore prior **known-good** tip from LKG, then lock |
| `FAIL: NONSUBSCRIBER` / API base / Marketplace / Tabl M | Content health failure | Do **not** call it a lock miss — restore prior LKG tip if new tip is unhealthy |
| Tip-gate PASS but Cursor rules / LKG docs still show old tip | Docs drift | Update LKG mirrors immediately; CPD incomplete until they match tip-gate script |

---

## Files that must agree (same tip)

| # | File | What to set |
|---|------|-------------|
| 1 | `scripts/assert-menuply-production-tip.sh` (**workspace + FE repo**) | `LOCKED_DEPLOY` + `LOCKED_BUNDLE` (**source of truth for tip-gate**) |
| 2 | `.cursor/rules/production-deploy-and-lkg-contract.mdc` | CURRENT LKG FE tip row |
| 3 | `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` | Locked live tip block |
| 4 | `docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md` | CURRENT LAST KNOWN GOOD + restore commands |
| 5 | `docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md` | Locked live tip table |
| 6 | `menubloc-frontend-main/docs/guardrails/2026-08-14_…lkg….md` | Mirror of #4 |
| 7 | `menubloc-backend-main/docs/guardrails/2026-08-14_…lkg….md` | Mirror of #4 |

**Versioned tip scripts:** commit tip-gate + lock helper from `menubloc-frontend-main/scripts/` (docs-only commit after CPD). Workspace `menubloc/scripts/` is the agent runtime copy — `lock-menuply-production-tip.sh` updates both.

If any disagree: **tip-gate script + live menuply.com bundle win** → reconcile the rest.

---

## Never without Andre current-turn exception

- Treat `bundle != locked tip` alone as reason to roll back a just-aliased good tip  
- Leave tip-gate script and Cursor LKG rules on different tips after CPD  
- Redeploy FE solely to “fix” a lock mismatch  
- Update only one of the seven files above  

---

## Agent stop lines

When tip-gate fails only on bundle mismatch after a deliberate alias:

> Tip-gate `bundle != locked tip` after aliasing the intended tip. I am locking the tip-gate script to the live deploy/bundle and re-running tip-gate. I am not restoring the previous tip.

When docs still disagree after PASS:

> Tip-gate PASS but LKG mirrors disagree. CPD is incomplete until all seven tip-lock files match. I have not declared done.

---

## Mandatory certification (every FE prod alias / CPD)

End the response with:

> ☐ TIP LOCK CERTIFICATION: Intended tip [deploy / bundle]; tip-gate script locked [yes|no]; tip-gate apex/www [PASS|FAIL|not run]; LKG docs+rules+mirrors match tip-gate [yes|no|pending]; panic-restore avoided [yes|n/a].

---

## Relationship to other contracts

- **This contract owns:** when/how to lock tip after alias, and how to interpret `bundle != locked tip`.  
- **LKG contract owns:** what the current tip *is* and prior restore targets.  
- **FE deploy path owns:** which directory may run `vercel --prod`.  
- **CPD playbook owns:** the short Commit→Deploy checklist (must cite this contract for tip lock).
