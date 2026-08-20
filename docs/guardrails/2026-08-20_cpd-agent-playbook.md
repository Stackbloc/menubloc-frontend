# CPD Agent Playbook (keep it simple)

**Established:** 2026-08-20  
**Audience:** agents when Andre says `cpd`  
**Purpose:** one short procedure so deploy does not turn into a 20-step archaeology session  
**Authority for live tip / BE SHA:** [2026-08-14_production-deploy-and-lkg-contract.md](./2026-08-14_production-deploy-and-lkg-contract.md)  
**Full path rules:** [FE](./2026-07-24_frontend-production-deploy-path-contract.md) · [BE](./2026-07-28_backend-production-deploy-path-contract.md)

---

## What `cpd` means

**Commit → Push → Deploy → tip-gate PASS → lock LKG → write one CPD note.**

Do only the layers that changed. FE-only ships do **not** push Railway. BE-only ships do **not** `vercel --prod`.

---

## Paths (memorize these two)

| Layer | Directory | Branch | Tree |
|-------|-----------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | **clean** |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | **clean** |

**Never deploy from:** `menubloc-frontend/`, `menubloc-backend/` (quarantined), any `_quarantine/**` tree.

Workspace root `menubloc/` is **not** a git remote for production code. Feature lives in the FE/BE checkouts above.

---

## FE CPD (copy this block)

Run from `menubloc-frontend-main` with **full shell permissions** (see traps below).

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

# 3) Alias menuply hosts (vercel --prod does NOT move menuply.com)
DEPLOY="menubloc-frontend-<id>-menuply.vercel.app"
vercel alias set "$DEPLOY" menuply.com
vercel alias set "$DEPLOY" www.menuply.com
vercel alias set "$DEPLOY" crm.menuply.com
vercel alias set "$DEPLOY" venues.menuply.com

# 4) Read live bundle
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1

# 5) Update tip lock FIRST, then tip-gate (order matters — see traps)
# Edit scripts/assert-menuply-production-tip.sh LOCKED_BUNDLE + LOCKED_DEPLOY
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://menuply.com
bash /Users/andrebarber/Desktop/menubloc/scripts/assert-menuply-production-tip.sh https://www.menuply.com
# Both must print RESULT=PASS

# 6) Smoke
BUNDLE=$(curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1)
curl -s "https://menuply.com/assets/$BUNDLE" | grep -o 'localhost:3001\|menubloc-backend-production' | sort | uniq -c
# railway count must be >> localhost (localhost ≤ ~9 dead DEV strings is OK)
curl -s "https://menubloc-backend-production.up.railway.app/health"
# record commit_hash as live BE (even if FE-only ship)

# 7) Lock LKG in these places (same tip values everywhere)
# - scripts/assert-menuply-production-tip.sh
# - .cursor/rules/production-deploy-and-lkg-contract.mdc
# - .cursor/rules/frontend-production-deploy-path-guardrail.mdc
# - docs/guardrails/2026-08-14_production-deploy-and-lkg-contract.md
# - docs/guardrails/2026-07-24_frontend-production-deploy-path-contract.md
# - copy LKG contract → menubloc-frontend-main/docs/guardrails/… and menubloc-backend-main/docs/guardrails/…
# - write docs/deployments/YYYY-MM-DD_<slug>-cpd.md (+ FE/BE mirrors)

# 8) Commit docs lock (usually FE repo + BE mirror commit). Do not redeploy for docs-only.
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

## Traps (read once — avoid forever)

| Trap | What goes wrong | Do this instead |
|------|-----------------|-----------------|
| **Sandbox / no `all` perms** | `vercel alias` fails (`auth.json` / fetch failed); tip-gate curl 403 | Re-run deploy/alias/tip-gate **outside sandbox** (`required_permissions: ["all"]`) |
| **`npx vercel` upgrades mid-flight** | Random CLI 59.x, auth/alias errors | Use the logged-in local `vercel` on PATH (today: CLI 54.x under nvm). Do not `npx vercel@latest` during CPD |
| **`vercel --prod` ≠ menuply.com** | New deployment URL is live but apex still old tip | Always alias `menuply.com` + `www` + `crm` + `venues` |
| **Aliased only grubbid.com** | CLI may auto-alias grubbid; menuply untouched | Explicit menuply aliases every time |
| **Tip-gate before lock update** | Fresh tip is live; gate prints `FAIL: bundle != locked tip` | Alias → note new bundle/deploy → **update lock script** → then tip-gate |
| **Tip-gate FAIL mid-CPD** | Panic-restore to wrong tip | If aliases already point at the new good deploy, update locks. Only restore prior tip if the new deploy is bad |
| **Deploy from dirty / wrong tree** | Ship quarantine work | Only `*-main` @ clean `main` |
| **Stale FE/BE LKG mirrors** | Next agent restores wrong tip from mirror | Copy root `docs/guardrails/2026-08-14_…lkg…md` into **both** `menubloc-frontend-main` and `menubloc-backend-main` mirrors |
| **Treating tip-gate FAIL as “deploy failed”** | Re-deploys / rolls back a good ship | Read the message: `bundle != locked tip` usually means locks not updated yet |
| **BE health vs old LKG note** | Docs say old SHA; live `/health` moved | Always `curl` live health at certify time; write that SHA |
| **Docs-only commit → another `vercel --prod`** | Waste + tip thrash | Docs/LKG commits do not need a new FE deploy |
| **FE/BE confusion** | Pushing BE from FE tree or vice versa | Separate repos, separate gates |
| **Missing `VITE_API_BASE_URL`** | Bundle full of `localhost:3001`; login “Failed to fetch” | Abort CPD; fix env; redeploy; re-check railway ≫ localhost |
| **Long prior-tip archaeology** | Token burn rewriting history tables | Update CURRENT LKG + add one Prior tip row for the tip you just replaced. Do not rewrite the whole restore list |

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

Copy the same file into FE/BE `docs/deployments/` mirrors when those repos track deployment notes.

---

## Agent response after CPD

Keep the user reply short:

1. Tip URL + bundle + FE commit  
2. Tip-gate PASS (apex + www)  
3. BE health SHA (even if unchanged)  
4. One verify URL/action  
5. Mandatory certifications (FE/BE deploy path, etc.)

Do **not** narrate every alias attempt, sandbox failure, or tip-gate FAIL that was only “lock not updated yet.”

---

## Related files

- Tip gate: `scripts/assert-menuply-production-tip.sh`  
- BE path gate: `scripts/assert-backend-deploy-path.sh`  
- Cursor entry: `.cursor/rules/production-deploy-and-lkg-contract.mdc`  
- This playbook: `docs/guardrails/2026-08-20_cpd-agent-playbook.md`
