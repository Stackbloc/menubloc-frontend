# CPD — Multiplier camera Record video viewport

**Date:** 2026-09-13  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — `ConsumerCameraSheet portals to body + keeps Record actions in viewport` + hybrid/native camera contracts (5/5) |
| Server | **NOT REQUIRED** — FE layout/portal only (no mutation API / upload wiring change) |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `252720c6` |
| Tip | `menubloc-frontend-q9ciqu2ov-menuply.vercel.app` |
| Bundle | `index-CD1wbQR4.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `100dvh - 140px` in live JS |

## Backend

Unchanged this ship (`be_commit` noted by cpd-fe: `38513906`).

## Product / fix

1. `ConsumerCameraSheet` **portals to `document.body`** so Multiplier compose (scrollable `EatingComposeSheet`) cannot clip Cancel / Record video.  
2. Overlay/sheet use **`100dvh`**; preview **flex-shrinks** (`maxHeight: min(62vh, calc(100dvh - 140px))`); actions row **`flexShrink: 0`** + safe-area padding.  
3. Covers **all Multiplier video categories** that open the shared picker/sheet (I'm Eating, Wanna Eat, reviews, cooking/@home, Happy Hour).

## Regression

Multiplier → any video option → Record video / Cancel visible on short mobile viewports without scrolling under the fold.
