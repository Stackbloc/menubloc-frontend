# CPD — Edit/Connect multi-toggle state fix

**Date:** 2026-09-11  
**Scope:** FE only  
**RESULT:** PASS

## What shipped

Edit/Connect was updating the address bar to `?view=connect` while React Router `location.search` stayed empty, so the label/page stayed on Edit and further clicks re-applied connect (stuck).

Fix: FeedShell owns Connect/Edit UI state, passes it via `Outlet` context, and writes the URL with `setSearchParams` from `window.location.search`.

## Tip

| Field | Value |
|-------|--------|
| Deploy | `menubloc-frontend-8tcsk3n0y-menuply.vercel.app` |
| Bundle | `index-iOkJ_iEg.js` |
| FE commits | `72a132f9` (fix) · `268d1e10` (prior tip-lock docs at deploy head) |
| Path | `menubloc-frontend-main` @ `main` clean |

## Verification

- Tip-gate apex + www: `RESULT=PASS`
- Content grep `buildProfileViewSearchParams`: failed (minified) — not used as Completeness; live tip E2E used instead
- Live tip E2E `liveTipProfileNav.e2e.spec.js` on `https://menuply.com`: **PASS** (3× Edit↔Connect URL + label + Highlights `+` hide/show; Home + Deals nav)
- Lab multi-toggle (pre-ship): PASS on Vite

## Notes

- First `cpd-fe.sh` aliased production then exited `CPD=INCOMPLETE` on minified content probe; finished with `--lock-only` after live tip E2E PASS.
- Prefer future `CPD_CONTENT_GREP` strings that survive minify (e.g. unique UI copy), not helper export names.
