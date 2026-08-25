# Frontend Production Deploy Path Contract + Guardrail

**Established:** 2026-07-24  
**Type:** Contract (required procedure) + Guardrail (hard stops)  
**Cursor rule:** `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` (`alwaysApply`)  
**Tip gate:** `scripts/assert-menuply-production-tip.sh`  
**Priority:** Production safety — overrides convenience

**Incidents this prevents:** 2026-07-23 mds alias wipe (NONSUBSCRIBER); 2026-07-24 Fine-only restore that dropped Marketplace + Subscription Designer; repeated `vercel --prod` from dirty `feature/mds-homepage-controls`; tip thrash that re-aliased morning `gltqad07l` / `index-shszZZc5.js` and brought NONSUBSCRIBER + broken Tabl M billboard back.

---

## Correct deployment route (the only default)

| Step | Required |
|------|----------|
| 1. Checkout | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| 2. Branch | `main` |
| 3. Working tree | **Clean** (`git status --porcelain` empty) |
| 4. Align remote | `git fetch origin` then `HEAD` matches `origin/main` (or document ahead-by-N after push) |
| 5. Deploy | From that directory: `npx vercel --prod --yes` |
| 6. Alias | `npx vercel alias set <deployment-url> menuply.com` **and** `www.menuply.com` |
| 7. Tip gate | `bash scripts/assert-menuply-production-tip.sh https://menuply.com` (and www) → both `RESULT=PASS` |
| 8. Certify | End response with **FE DEPLOY PATH CERTIFICATION** (below) |
| 9. CPD | Record **Deploy path** table in the CPD |

Anything else is **not** the correct route unless Andre’s **current-turn** message names an exception path + branch.

Silence, prior CPDs, “Marketplace isn’t on main yet,” or debugging convenience ≠ permission.

---

## Locked live tip (restore target — not a deploy-from path)

**Agents: this is the current production FE tip.** Re-read before any alias/restore/CPD. After every successful tip-gate PASS, update this table + `.cursor/rules/frontend-production-deploy-path-guardrail.mdc` + `scripts/assert-menuply-production-tip.sh` together.

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-99h0x2fbh-menuply.vercel.app` |
| Live bundle | `index-5cwRXhcD.js` |
| Aliases | `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com` |
| Locked | 2026-08-25 (FE `9fe5181` ad branding; incl. `5d6e26a` Android video; BE `b08b53c8`) |
| Notes | Current tip supersedes `azxhntx1m` / `DTFzIdfb`, `m67fxdy8z` / `ClE3rSAk`. Deploy/push only from clean `menubloc-frontend-main` @ `main`. Tip lock: `docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md`. |

Restore commands:

```bash
npx vercel alias set menubloc-frontend-99h0x2fbh-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-99h0x2fbh-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-99h0x2fbh-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-99h0x2fbh-menuply.vercel.app venues.menuply.com
```

Do **not** restore superseded tips (`kp8teptm7`/`DCAdIaFJ`, `2q95zr9z7`/`Bc6lB1Ap`, `5qoxa42t4`/`B45apyHC`, `89jj1mz2b`/`6lPa6XN2`, `5hahxk6st`/`CYtSPDxP`, `626p0j6hy`/`D_Nc-5PD`, `rh505od55`/`B1mo46YC`, `cey0mwaa7`/`BXhQToJa`, `fli5934kq`/`D_zxLTdZ`, `a304s1jgd`/`CvkADiUB`, `7jj41b2cs`/`Dy18r6lv`, `b8kmlp3k2`/`DcJ2rrvn`, `6sm7u9cwb`/`GXbrWt3V`, `g8uuar69o`/`BpozLIHf`, `9acktyci6`/`lG7D8UuY`, `6nzh7hvv5`/`RmW9q_Gr`, `k2hpeyh3s`/`DygwUgB7`, `hzqhp15u6`/`DZq-yI_T`, `bm2jkijow`/`BkJqmepa`, `l7pg7dpir`/`C18CZMc2`, `8pl3zm05l`/`DxsHvAHk`, `aj3cufw78`/`B2nAFBvm`, `pvekgpaay`/`DOGT2NT-`, `c07vv7d3s`/`BUPZP4ci`, `fnn23dmbl`/`UMv0E4Zu`, `ro8l1scif`/`BVISDgrs`, `hzs2u21r1`/`DfVlLYXq`, `o3qnf739i`/`CxIJlzl-`, `e2toazdpi`/`Cx2bTWAc`, `nzkm72fy0`/`DyvhJLLC`, `ard1xo2ay`/`ChMndpoc`, `7xp2ldvwr`/`Dgg_SRjs`, `aae62r0rr`/`CEl-scxL`, `dkyh8n497`/`UoLq1e4f`, `8u2p5tci4`/`b_Ovc7EK`, `2zp3dc8qr`/`BkaKyAh2`, `1y5s6np0s`/`C2oEXWML`, `3363ed8na`/`DgrW5Jp2`, `jfonf570v`/`bXMEeelE`, `nrrimolxv`/`Cf7g9qd7`, `3ejgczu00`/`BrTJV97-`, `a38ku52a4`/`BLw4kaBB`, `e9kop4og8`/`Di87A4Tc`, `5cd91e4s5`/`Cs95NUwq`, `gbli18jhr`/`BYCUQwwR`, `ermw9wrlu`/`V7CvAska`, `n0cvd9sri`/`CFRkrIiH`, `5bgthc6ie`/`BTCcz1Bv`, `5zyfysc6d`/`BxC57MCe`, `4jqlqd3hr`/`NLdILVlC`, `m37gzyigo`/`Cp1jUXBJ`, `9oizfbmm2`/`DtrqjgyL`, `kfg4dznl9`/`jC_qINxe`, `oyhiq7f5v`/`B2LgNBCx`, `2fihqdros`/`jpkhi3pl`, `fvutufj8k`/`BbCfKWPa`, `p030mjw9s`/`CVVYzMJE`, `ggandazd7`/`CW3cbIM7`, `diczui6bk`/`5v6CEdEL`, `52risw9xb`/`Da4oetaO`, `b35hl7fdk`/`DaVDJi2q`, `lqaskgcbb`/`DhdKors_`, `qxv3nknvy`/`CGduqkJT`, `cvwot6151`/`B_urB9ER`, `mmxd28z81`/`Bj4ARjqe`, `d7g8pgf7s`/`CmyU_d_D`, `ctono3prh`/`Blsro3bI`, `ojq8s04k3`/`aYq2FlcY`, `jzr5jksx9`/`BUWRnnh8`, `ch3lz2de4`/`C5sVBRYU`, `7eibttikj`/`DtEgMpsm`, `m3tz7fpzy`/`CVaavDWL`, `4bovvv2oo`/`l5iPuTlz`, `foqkj8eae`/`C51uHPPN`, `nug9aum1i`/`yDAGjBXP`, `2cu2l3fps`/`9riEvbLS`, `61r6e3n4q`/`8OJFrFA-`, `k7nyczbiw`/`DivDzTpD`, `lrlt72lwy`/`BlRjkY9o`, `ltaga46ta`/`Aq-qW_jU`, `imzavo4v7`/`BJuwyHGd`, `o4husz8eq`/`D0QRCw-k`, `qcowwqjdd`/`D_ISHEMS`, `h4n5i2spn`/`D_ISHEMS`, `2n4ap2oez`/`DL7k39LL`, `99dry9fzi`/`BNX-ogYB`, `n1w11rczt`/`BHcRDvh-`, `5hy2ys8zx`/`D9J1MWH7`, `lk6ad851u`/`DXesCCEK`, `2j6x6fwmr`/`CwSotmcJ`, `70vbs58xh`/`CwSotmcJ`, `a9lbs1a0f`/`Cb2jJBL7`, `ebx8sqfwc`/`BYDuqkjZ`, `7hw88h03y`/`DOLvszeR`, `dhcdpqu8q`/`Cq7u4RFh`, `ad4fjjrfw`/`B0ov0E5L`, `2tkb6t6t0`/`DwEtRPrK`, `gdn1nk4p4`/`CE12xbvw`, `e9m20i9xl`/`BdR_9nij`, `3zf7v6lj3`/`CDHjhD1b`, `mx8z7aeau`/`DycE1gGZ`, `4onz8k9nw`/`DFwUYp9y`, `3y5622h6k`/`CEZBeYMs`, `fv41tme5z`/`DcXzkK6N`, `1fhl66453`/`BASJhs79`, `gltqad07l`/`shszZZc5`, Fine-only `l0vcijcnl`/`CT17TZbQ`, `kwtx9hw7x`/`CdOPUvIf`) unless Andre names an exception.

**Includes:** Profile refinement (no auto Featured, compact Menu Preview, claim At a Glance, Now Hiring), classification-aware hero, Phase 2 hierarchy, Phase 1.5 destination hierarchy, Marketplace hub, Subscription Designer FE, profile View-menu, **NONSUBSCRIBER pills hidden**, Tabl M JPEG.

### Forbidden restore / alias targets

| Deployment / bundle | Why forbidden |
|---------------------|---------------|
| `ad4fjjrfw` / `index-B0ov0E5L.js` | Billboard removal tip that dropped entrance splash — superseded by splash restore |
| `2tkb6t6t0` / `index-DwEtRPrK.js` | Contact-dedupe tip — superseded by billboard-removal/PWA CPD |
| `gdn1nk4p4` / `index-CE12xbvw.js` | Classification CPD tip — superseded by contact-dedupe CPD |
| `e9m20i9xl` / `index-BdR_9nij.js` | Phase 2 tip — superseded by classification CPD |
| `3zf7v6lj3` / `index-CDHjhD1b.js` | Phase 1.5 tip — superseded by Phase 2 |
| `mx8z7aeau` / `index-DycE1gGZ.js` | Hero icon-spacing tip — superseded by Phase 1.5 |
| `4onz8k9nw` / `index-DFwUYp9y.js` | Layout-tighten tip — superseded |
| `3y5622h6k` / `index-CEZBeYMs.js` | Experience-first tip — superseded |
| `fv41tme5z` / `index-DcXzkK6N.js` | Prior unified-shell tip — superseded |
| `1fhl66453` / `index-BASJhs79.js` | Prior locked tip — superseded |
| `gltqad07l` / `index-shszZZc5.js` | Morning Marketplace tip — still has NONSUBSCRIBER; missing Tabl M JPEG |
| `kwtx9hw7x` / `index-CdOPUvIf.js` | Prior emergency tip — superseded |
| `l0vcijcnl` / `index-CT17TZbQ.js` | Fine-only — drops Marketplace + Subscription Designer |
| Any tip failing tip-gate | Do not alias |

If tip-gate FAIL → restore:

```bash
npx vercel alias set menubloc-frontend-n94crxvtt-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-n94crxvtt-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-n94crxvtt-menuply.vercel.app crm.menuply.com
bash scripts/assert-menuply-production-tip.sh https://menuply.com
```

---

## Quarantine (local — not deploy options)

Bad FE checkouts were moved out of the top-level deploy set on 2026-07-24:

| Path | Role |
|------|------|
| `menubloc-frontend-main` | **Only authorized** production deploy checkout |
| `menubloc-frontend/` | Dirty `feature/mds-homepage-controls` — **DO NOT DEPLOY** (left in place only because it hosts git worktree metadata); `.vercel` disabled; `DO_NOT_DEPLOY_PRODUCTION.md` present |
| `_quarantine/frontend-deploy-forbidden/2026-07-24/*` | Former `menubloc-frontend-*` worktrees + tmp deploy trees — **DO NOT DEPLOY**; `.vercel` disabled |

Agents must **not** `vercel --prod` or alias from quarantine paths or from `menubloc-frontend/`.

---

## Hard stops (guardrail)

**Never without Andre’s current-turn named exception:**

- `vercel --prod` from `menubloc-frontend` or any `_quarantine/…` tree
- `vercel --prod` from a dirty tree
- Alias `menuply.com` to a deployment not built from the certified route (or named exception)
- Alias to Fine-only or to `gltqad07l` / `shszZZc5` to “fix” something

### Agent stop line

> This frontend production deploy requires leaving the authorized `menubloc-frontend-main` @ `main` path. I have not run `vercel --prod` or changed the menuply.com alias. Explicit authorization naming the checkout and branch is required (or merge to main first).

---

## Pre-deploy checklist (mandatory)

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
pwd
git branch --show-current    # must be main
git status --porcelain       # must be empty
git log -1 --oneline
git rev-parse HEAD
git fetch origin
git rev-parse origin/main
bash ../../scripts/assert-menuply-production-tip.sh https://menuply.com   # baseline before change
npx vercel --prod --yes
npx vercel alias set <deployment-url> menuply.com
npx vercel alias set <deployment-url> www.menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://www.menuply.com
```

Tip-gate must assert at least: locked bundle (or newly CPD’d replacement), `subscription-designer` ≥ 20, Marketplace `Coming Soon`, `qr-kits/order`, Railway ≫ localhost, door-hanger SVG, **NONSUBSCRIBER = 0**, Tabl M billboard `image/jpeg`.

---

## Mandatory certification

### On every task completion (always)

> ☐ FE DEPLOY PATH CERTIFICATION: Production FE deploy/alias [not attempted | attempted]. If attempted: from `[path]` on `[branch]` @ `[commit]`; tree `[clean|dirty]`; menuply.com → `[deployment]`; live bundle `[index-….js]`; tip-gate `[PASS|FAIL|not run — reason]`; exception `[none | Andre-authorized: …]`.

### On every FE production ship / alias change (also in CPD)

```markdown
## Deploy path

| Field | Value |
|-------|-------|
| Checkout | menubloc-frontend-main |
| Branch | main |
| Commit | <hash> |
| Working tree | clean |
| Vercel deployment | https://menubloc-frontend-….vercel.app |
| Alias | menuply.com, www.menuply.com |
| Live bundle | index-….js |
| Tip gate | PASS |
| Exception | none |
```

If any required field is unknown → ship is **NOT COMPLETE**.

---

## Exception form (rare)

Andre must say substantially:

> You may deploy frontend production from `<absolute-path>` on branch `<branch>` for this task only.

Still run tip-gate + certification. Record exception in CPD.
