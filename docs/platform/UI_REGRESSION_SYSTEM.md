# Menuply UI Regression System

**Established:** 2026-06-18  
**Status:** Active — baselines captured, tests passing

---

## Overview

Two-layer Playwright test suite protecting production UI at `https://menuply.com`.

| Layer | Script | Purpose |
|---|---|---|
| Smoke | `npm run ui:smoke` | Load verification — routes return content, no React crashes, BottomNav present |
| Visual | `npm run ui:visual` | Screenshot comparison — pixel diff against frozen baseline images |

---

## Scripts

```bash
npm run ui:smoke            # Run smoke tests (fast, ~10s)
npm run ui:visual           # Run visual comparison tests (~20s)
npm run ui:update-baselines # Regenerate baseline screenshots after intentional visual changes
```

---

## Smoke Tests — Protected Routes

File: `tests/playwright/smoke.spec.js`

| Route | Check |
|---|---|
| `/` | Search input visible |
| `/search?q=burger&city=Los+Angeles&state=CA` | Body contains search result text |
| `/waiter` | Body contains waiter-related text |
| `/account/following` | Redirects to `/account/following` or `/account/login` |
| `/checkout` | Body contains checkout/basket text |
| `/restaurant/signup` | Body contains signup-related text |
| `/build-info` | Page heading "Menuply Build Info" visible |
| `/build-info.json` | Valid JSON with `app: "menuply-frontend"`, `gitSha`, `buildTime` |

**BottomNav presence** verified on: `/`, `/search`, `/waiter`  
(`/checkout` excluded — empty-basket early-return path does not mount BottomNav)

---

## Visual Tests — Baseline Screenshots

File: `tests/playwright/visual.spec.js`  
Baselines: `tests/baseline-screenshots/visual.spec.js-snapshots/`

12 baselines captured 2026-06-18 against production (Chromium):

| Route | Desktop | Mobile (Pixel 5) |
|---|---|---|
| `/` (home) | `desktop-home-desktop-darwin.png` | `mobile-home-mobile-darwin.png` |
| `/search` (burger, LA) | `desktop-search-desktop-darwin.png` | `mobile-search-mobile-darwin.png` |
| `/waiter` | `desktop-waiter-desktop-darwin.png` | `mobile-waiter-mobile-darwin.png` |
| `/account/following` | `desktop-following-desktop-darwin.png` | `mobile-following-mobile-darwin.png` |
| `/checkout` | `desktop-checkout-desktop-darwin.png` | `mobile-checkout-mobile-darwin.png` |
| `/restaurant/signup` | `desktop-signup-desktop-darwin.png` | `mobile-signup-mobile-darwin.png` |

**Threshold:** `maxDiffPixelRatio: 0.03` (3% pixel difference allowed)  
**Animations:** disabled during capture  
**Time-varying elements** (timestamps) masked with `page.locator("time")`

---

## Configuration

File: `playwright.config.js`

- `baseURL`: `https://menuply.com` (always tests production)
- `timeout`: 30 seconds per test
- `retries`: 0
- `screenshot`: saved on failure to `test-results/`
- Projects:
  - `desktop` — Chromium, 1280×800
  - `mobile` — Chromium (Pixel 5 device emulation, 393×851)

---

## When to Update Baselines

Run `npm run ui:update-baselines` after any intentional visual change:
- Layout changes (padding, spacing, card sizes)
- Color or typography changes
- New UI elements added to protected routes
- BottomNav changes

**Do NOT run `ui:update-baselines` to "fix" a failing test** without first verifying the visual change was intentional.

---

## Failure Triage

| Failure type | Likely cause |
|---|---|
| Smoke: body blank | React crash or failed hydration |
| Smoke: BottomNav missing | BottomNav removed from page import, or early-return path hit |
| Smoke: HTTP 5xx | Vercel/CDN failure |
| Visual: diff > 3% | Unintentional layout regression, or intentional change needing baseline update |
| Visual: "snapshot missing" | First run on new machine — run `ui:update-baselines` |

---

## Known Limitations

- Tests run against production only — local dev server not supported
- Visual baselines are OS-specific (darwin). Re-generate baselines if CI runs on Linux.
- `/build-info` body check verifies the static heading only, not async-loaded JSON data (data loads after `domcontentloaded`)
- Baseline images captured when unauthenticated — authenticated states are not covered
