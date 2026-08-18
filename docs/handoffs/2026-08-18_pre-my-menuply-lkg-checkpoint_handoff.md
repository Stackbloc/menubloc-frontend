# Objective

Save a recoverable LAST KNOWN GOOD checkpoint **before** My Menuply IA CPD.

# Current Status

**CHECKPOINT COMPLETE.** My Menuply work remains uncommitted and undeployed.

Verified live production, then tagged authorized `origin/main` (not the dirty My Menuply trees).

# Files Changed

None in application code. Annotated git tags only, plus this handoff and LKG registry rows.

# Database Changes

None.

# Decisions Made

1. Tag **live production**, not uncommitted My Menuply files.
2. FE live tip stayed `2fw9x27jj` / `index-fjLns99U.js` (feature `98687fd`). Git tag peels to `0450a53` (docs lock on `origin/main` after that tip).
3. BE live `/health` `commit_hash` is `fb54f0b4` (docs lock after founded-year `6fc782c3`). Tag peels to that SHA so git LKG matches Railway.
4. Quarantine trees were not tagged.
5. Tags were pushed to origin so the checkpoint is not machine-local only.

# Remaining Work

My Menuply CPD when Andre resumes `cpd`. Restore this checkpoint first if that ship fails.

# Risks / Known Issues

- FE working tree still has uncommitted My Menuply changes on top of `0450a53`.
- BE working tree still has uncommitted My Menuply / `0270` changes on top of `fb54f0b4`.
- `git checkout` of the tag restores **code**, not the Vercel alias. Tip restore remains `npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app menuply.com` (and www/crm/venues).

# Verification Status

| Check | Result |
|-------|--------|
| Tip-gate apex | **PASS** `index-fjLns99U.js` / `2fw9x27jj` |
| Tip-gate www | **PASS** same bundle |
| Railway `/health` | `commit_hash` `fb54f0b4656d77e4f94ba2ae8c28c880abb4c417` |
| FE tag peel | `menuply-last-known-good-2026-08-18` → `0450a53c42ae00c4e89d87a93b3094acb18bb71f` |
| BE tag peel | `menuply-last-known-good-2026-08-18` → `fb54f0b4656d77e4f94ba2ae8c28c880abb4c417` |

# Resume Instructions

1. To restore **website tip** (no git checkout required):

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-2fw9x27jj-menuply.vercel.app venues.menuply.com
bash ../../scripts/assert-menuply-production-tip.sh https://menuply.com
```

2. To restore **code** in authorized trees (explicit Andre authorization for reset):

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
git checkout menuply-last-known-good-2026-08-18

cd /Users/andrebarber/Desktop/menubloc/menubloc-backend-main
git checkout menuply-last-known-good-2026-08-18
```

3. Then resume My Menuply CPD only if Andre says `cpd` again.

# Git Status

## Frontend (`menubloc-frontend-main`)

- Branch: `main` aligned with `origin/main` at `0450a53`
- Tag: `menuply-last-known-good-2026-08-18` (pushed)
- Live tip: `2fw9x27jj` / `index-fjLns99U.js`
- Working tree: dirty My Menuply (not in this tag)

## Backend (`menubloc-backend-main`)

- Branch: `main` aligned with `origin/main` at `fb54f0b4`
- Tag: `menuply-last-known-good-2026-08-18` (pushed)
- Live health: **MATCH** this SHA
- Working tree: dirty My Menuply / `0270` (not in this tag)
