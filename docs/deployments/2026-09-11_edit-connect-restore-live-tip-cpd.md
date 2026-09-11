# CPD — Restore Edit/Connect + live tip E2E gate

**Date:** 2026-09-11  
**RESULT:** PASS (tip-gate + live tip Playwright)

## Ship

| | |
|--|--|
| Tip | `menubloc-frontend-i6j6th3f2` / `index-DmGl8Dzw.js` |
| FE | `1616d00e` fix + `6472ba5b` docs |
| Tip-gate | apex/www PASS |

## What changed

- Edit/Connect back in mobile header + desktop settings (removed floating ProfileViewChrome)
- clearStuckMediaChrome on Feed nav / toggle / route change
- Contract: lab Playwright alone ≠ Complete after FE alias

## Live tip hop (required)

`PLAYWRIGHT_BASE_URL=https://menuply.com` → `liveTipProfileNav.e2e.spec.js` mobile: Edit/Connect URL flip; Home; Deals — **PASS**
