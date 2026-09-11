# CPD — Edit/Connect + Month in Food chrome (stuck media overlays)

**Date:** 2026-09-11  
**Door:** `bash scripts/cpd-fe.sh` with `CPD_CONTENT_GREP=profile-view-chrome`  
**RESULT:** PASS

## Ship

| Layer | Value |
|-------|--------|
| FE path | `menubloc-frontend-main` @ clean `main` |
| FE commit | `57b8c43b` |
| Tip | `menubloc-frontend-jewhhgn28-menuply.vercel.app` / `index-uNozvY7r.js` |
| Tip-gate apex/www | PASS |
| Content probe | `profile-view-chrome` PASS |
| BE | unchanged this CPD |

## What shipped

- `ProfileViewChrome` portal (z-index 14000) owns Edit/Connect + Month in Food on `/feed/profile`
- `clearStuckMediaChrome` restores scroll + dispatches force-close to camera/compose sheets
- `MenuplyMediaPicker` closes sheet before parent `onFile` (queueMicrotask) to avoid leftover overlay
- Desktop in-page toggle removed; chrome is the single control

## Pre-CPD gates

- E2E: PASS — `highlightsStageSaveNav.e2e.spec.js` (mobile): stage→Save→Edit/Connect URL flip→MMIF→nav
- Server: NOT REQUIRED (FE overlay/routing only)

## Verify (human)

1. Hard refresh `https://menuply.com/feed/profile`
2. Toggle Edit ↔ Connect — URL gains/loses `?view=connect`
3. After Highlights camera/library, toggle and MMIF still work
4. Month in Food icon → `/my-menuply/month-in-food`
