# Objective

Fix My Account Menu / Settings / Password tabs so panels actually switch; verify before CPD.

# Current Status

**LOCAL COMPLETE** — tests pass; awaiting CPD.

# Files Changed

- `menubloc-frontend/src/pages/operator/OperatorMyAccount.jsx`
- `menubloc-frontend/test/operatorMyAccountHubContract.test.js`
- `menubloc-frontend/test/myAccountTabNav.test.jsx`
- `menubloc-frontend/test/myAccountHref.unit.test.js`
- `docs/audits/2026-07-17_my-account-tabs-not-switching.md`

# Database Changes

None.

# Decisions Made

- Local `tab` / `menuPanel` state is source of truth for which panel renders
- URL synced via `navigate(myAccountHref(...), { replace: true })`
- Kept Link elements for href semantics; `preventDefault` + `onSelect` drives state

# Remaining Work

- CPD FE (commit only My Account files; stash demo / nested-nav WIP)
- Human verify on menuply.com

# Risks / Known Issues

- Unrelated local WIP must not ship with this deploy

# Verification Status

- Contract + href unit + vitest panel switch → pass

# Resume Instructions

1. CPD FE if not done
2. Open `/operator/my-account`, click Menu → Settings → Password
3. Confirm URL `?tab=` updates and panels change

# Git Status

FE branch `feature/mds-homepage-controls` — My Account fix uncommitted among other WIP.
