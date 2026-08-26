# CPD Agent Playbook (keep it simple)

**Established:** 2026-08-20  
**Updated:** 2026-08-25 — one-door hardening (`cpd-fe.sh`); STALE_LOCK vs UNHEALTHY  
**Audience:** agents when Andre says `cpd`  
**Purpose:** one short procedure so deploy does not turn into a 20-step archaeology session  
**🔴 TIP LOCK (read first after every FE alias):** [2026-08-24_production-tip-lock-atomic-contract.md](./2026-08-24_production-tip-lock-atomic-contract.md) — `STALE_LOCK` is usually stale locks, **not** a reason to restore  
**Authority for live tip / BE SHA:** [2026-08-14_production-deploy-and-lkg-contract.md](./2026-08-14_production-deploy-and-lkg-contract.md)  
**Full path rules:** [FE](./2026-07-24_frontend-production-deploy-path-contract.md) · [BE](./2026-07-28_backend-production-deploy-path-contract.md)

---

## What `cpd` means

**Commit → Push → Deploy → alias → verify live → lock tip-gate (+ sync existing LKG) → tip-gate PASS → write one CPD note.**

Do only the layers that changed. FE-only ships do **not** push Railway. BE-only ships do **not** `vercel --prod`.

### CPD complete vs incomplete

| Outcome | When |
|---------|------|
| **CPD complete** | Deploy/alias succeeded **and** intended tip verified live **and** tip locked **and** existing LKG records synced **and** tip-gate `RESULT=PASS` on apex + www |
| **CPD=INCOMPLETE** | Production may have moved, but lock / LKG / tip-gate PASS did not finish — **do not** narrate as done |

`vercel --prod` success alone is **never** CPD complete.

---

## Paths (memorize these two)

| Layer | Directory | Branch | Tree |
|-------|-----------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | **clean** |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | **clean** |

**Never deploy from:** `menubloc-frontend/`, `menubloc-backend/` (quarantined), any `_quarantine/**` tree.

Workspace root `menubloc/` is **not** a git remote for production code. Feature lives in the FE/BE checkouts above.

---

## FE CPD — ONE DOOR (preferred)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
# commit + push first if needed (clean tree required before deploy)

bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-fe.sh "short feature note"
# Must print RESULT=PASS. If RESULT=INCOMPLETE or UNHEALTHY → stop; do not declare done.

# Docs-only commit of tip-gate + LKG (no second vercel --prod)
```

`cpd-fe.sh` runs the existing sequence only: path/branch/tree gate → `vercel --prod` → alias menuply hosts → curl live bundle → `lock-menuply-production-tip.sh` → tip-gate apex+www. It does **not** create a second tip authority.

Lock-only after a mid-flight interrupt (production already moved):

```bash
INTENDED_DEPLOY=menubloc-frontend-<id>-menuply.vercel.app \
  bash /Users/andrebarber/Desktop/menubloc/scripts/cpd-fe.sh --lock-only "finish incomplete cpd"
```

---

## FE CPD (manual equivalent — same end state required)

Run from `menubloc-frontend-main` with **full shell permissions** (see traps below). Prefer `cpd-fe.sh` so steps cannot be skipped.

```bash
# 0) Prove path
pwd   # must end with menubloc-frontend-main
git status --porcelain   # must be empty after commit, before deploy
git branch --show-current   # main

# 1) Commit + push (only if there are changes)
git add -A && git commit -m "…"   # or skip if already committed
git push origin main

# 2) Deploy
vercel --prod --yes
# Note the Production URL: menubloc-frontend-<id>-menuply.vercel.app
# WARNING: this may already move production aliases — you are now in CPD=INCOMPLETE until lock+PASS

# 3) Alias menuply hosts (always; do not assume --prod moved apex)
DEPLOY="menubloc-frontend-<id>-menuply.vercel.app"
vercel alias set "$DEPLOY" menuply.com
vercel alias set "$DEPLOY" www.menuply.com
vercel alias set "$DEPLOY" crm.menuply.com
vercel alias set "$DEPLOY" venues.menuply.com

# 4) Read live bundle
BUNDLE=$(curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)

# 5) Lock tip-gate + sync existing LKG records, then tip-gate
bash /Users/andrebarber/Desktop/menubloc/scripts/lock-menuply-production-tip.sh \
  "$DEPLOY" "$BUNDLE" \
  --fe-commit "$(git rev-parse --short HEAD)" \
  --note "cpd"
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://menuply.com
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://www.menuply.com
# Both must print RESULT=PASS — else CPD=INCOMPLETE
# Do NOT restore on RESULT=STALE_LOCK alone

# 6) Smoke
curl -s "https://menuply.com/assets/$BUNDLE" | grep -o 'localhost:3001\|menubloc-backend-production' | sort | uniq -c
curl -s "https://menubloc-backend-production.up.railway.app/health"

# 7) Commit docs lock (FE repo + BE mirror). Do not redeploy for docs-only.
```

---

## BE CPD (only when backend changed)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-backend-main
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-backend-deploy-path.sh "$(pwd)"
# RESULT=PASS required
git push origin main   # Railway deploys from this path only
# Wait, then:
curl -s "https://menubloc-backend-production.up.railway.app/health"
# commit_hash must match the SHA you pushed (or document lag explicitly)
```

---

## Bypasses (detect / prohibit as normal path)

| Bypass | Risk | Rule |
|--------|------|------|
| Raw `vercel --prod` outside `cpd-fe.sh` | Moves production before lock | Not the normal door; if used, finish with lock + tip-gate PASS or leave `CPD=INCOMPLETE` |
| Bare `vercel alias set … menuply.com` outside CPD | Same | Same — lock immediately or incomplete |
| Declaring done after deploy URL prints | Stale lock / wrong LKG | Forbidden |

Vercel project settings may auto-attach production domains on `--prod`. Treat any production move as requiring the lock+PASS tail.

---

## Traps (read once — avoid forever)

| Trap | What goes wrong | Do this instead |
|------|-----------------|-----------------|
| **Sandbox / no `all` perms** | `vercel alias` fails; tip-gate curl 403 | Re-run deploy/alias/tip-gate **outside sandbox** |
| **`npx vercel` upgrades mid-flight** | Random CLI / auth errors | Use logged-in local `vercel` on PATH |
| **`vercel --prod` may move apex** | Tip live before lock | Always lock + tip-gate PASS; prefer `cpd-fe.sh` |
| **Aliased only grubbid.com** | menuply untouched | Explicit menuply aliases every time |
| **Tip-gate before lock** | `RESULT=STALE_LOCK` | Lock live tip → re-run tip-gate. **Do not restore** |
| **Panic-restore on STALE_LOCK** | Undo good ship | Update locks only |
| **Deploy from dirty / wrong tree** | Ship quarantine work | Only `*-main` @ clean `main` |
| **Treating STALE_LOCK as deploy failed** | Re-deploys / rolls back a good ship | Lock + PASS |
| **Docs-only → another `vercel --prod`** | Waste + tip thrash | Docs/LKG commits do not need a new FE deploy |
| **Narrating incomplete CPD as done** | Next agent trusts stale LKG | Print `CPD=INCOMPLETE` until PASS |

---

## Minimum CPD note (template)

Write `docs/deployments/YYYY-MM-DD_<slug>-cpd.md`:

```md
# CPD — <title> (YYYY-MM-DD)

## Summary
One sentence.

## Deploy path
| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | <sha> | tip-gate PASS |
| BE | unchanged or menubloc-backend-main | main | <sha> | health |

## Production tip
- Deployment: menubloc-frontend-<id>-menuply.vercel.app
- Bundle: index-….js
- Tip-gate: PASS apex + www

## Verify
1. …

## Rollback
Prior tip `<id>` / `index-….js`
```

---

## Agent response after CPD

1. Tip URL + bundle + FE commit  
2. Tip-gate PASS (apex + www) — or explicit `CPD=INCOMPLETE`  
3. BE health SHA (even if unchanged)  
4. One verify URL/action  
5. Mandatory certifications  

Do **not** narrate every alias attempt or a mid-CPD `STALE_LOCK` that was only “lock not updated yet.”

---

## Related files

- One door: `scripts/cpd-fe.sh`  
- Tip gate: `scripts/assert-menuply-production-tip.sh`  
- Tip lock: `scripts/lock-menuply-production-tip.sh`  
- BE path gate: `scripts/assert-backend-deploy-path.sh`  
- Cursor entry: `.cursor/rules/production-deploy-and-lkg-contract.mdc`  
- This playbook: `docs/guardrails/2026-08-20_cpd-agent-playbook.md`
