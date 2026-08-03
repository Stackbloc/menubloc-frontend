# FE CPD — Fixins section title sticky overflow

**Date:** 2026-08-03  
**Commit:** `6137b04` on `menubloc-frontend-main` @ `main`  
**Deploy:** `menubloc-frontend-lqaskgcbb-menuply.vercel.app`  
**Bundle:** `index-DhdKors_.js`  
**Alias:** `menuply.com` + `www.menuply.com` → `lqaskgcbb`

## Change

Removed `overflow: "hidden"` from Menu Appearance surface wrappers on `PublicMenuPage` and `CatalogMenuRenderer` so Classic/Fine sticky headers no longer cover the first section title.

## Verification

- Tip-gate updated lock → PASS expected after lock update
- Playwright Fixins `#984`: sticky.bottom 233, `LIL' BITS` top 261, gap +28, `covered: false`
- Contract: `test/publicMenuSectionTitleVisibilityContract.test.js`

## Audit

`docs/audits/2026-08-03_fixins-section-title-sticky-overflow.md`
