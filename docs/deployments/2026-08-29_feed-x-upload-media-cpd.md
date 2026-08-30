# CPD — Feed X Upload media + category picker

**Date:** 2026-08-29

## Shipped

| Layer | Commit | Notes |
|-------|--------|-------|
| FE | `5782982` | X sheet: Share My Menuply → Upload media + category sub-step → library compose; My Menu Stack Add menu removed; More Add a menu camera icon |
| FE tip | `menubloc-frontend-58tpm3rty-menuply.vercel.app` / `index-1IEptLv3.js` | tip-gate PASS |
| BE | — | FE-only |

## E2E (pre-CPD local)

`npx playwright test tests/playwright/feedXUploadMedia.e2e.spec.js --config=playwright.local.config.js` — 5/5 PASS

## Human smoke

1. `/feed` → X → **Upload media** (no Share My Menuply in sheet)
2. Upload → pick category → library picker / compose opens
3. `/feed/menus` — no Add menu in header or empty state
4. More → **Add a menu** shows camera icon (signed in)
