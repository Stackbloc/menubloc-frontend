# CPD — Month in Food Moments-only + spend/visited + empty-menu places

**Date:** 2026-09-17  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **NOT REQUIRED** — presentation/GET enrichment only; no Save/mutation UI; not Feed Edit/Connect ship class |
| Server | **PASS** — `cpd-be.sh --no-push` `RESULT=PASS`; `health_commit=58ebcf9d244cf1194d02b8384df7a94af54aada2` matches HEAD |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `e0cce682` |
| Tip | `menubloc-frontend-qd9kjmsep-menuply.vercel.app` |
| Bundle | `index-CQ58OcAu.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `Moments To Remember` in live JS **PASS** |

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit / health | `58ebcf9d` / `58ebcf9d244cf1194d02b8384df7a94af54aada2` |
| Smoke | **PASS** (30/30), includes `consumer_month_in_food` 401 |
| Path-gate | **PASS** |

## Product / fix

1. Month in Food keeps **Moments To Remember** only; removes **Top Highlights** (profile already has My Highlights).  
2. Moments = this month’s diary photos only (no profile gallery pin mix-in).  
3. Visited restaurants prefer billboard → logo → menu-item photo.  
4. Stats show estimated **Restaurant $** from CK item prices.  
5. Mobile overflow / h-scroll rails tightened.  
6. Food-activity place search hides restaurants with empty CK menus; drops “Canonical” jargon from diner place UI.

## Verify

- https://menuply.com/my-menuply/month-in-food — Moments section title; no Top Highlights.  
- Place pickers for eating / CK picker do not offer empty-menu restaurants.
