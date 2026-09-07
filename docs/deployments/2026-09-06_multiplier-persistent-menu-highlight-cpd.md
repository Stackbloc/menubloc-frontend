# CPD — Multiplier sheet + persistent top menu highlight

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `1a720d20` — `feat(feed): Multiplier sheet + persistent menu highlight at restaurant top` |
| **Live tip** | `menubloc-frontend-akxwus4wb-menuply.vercel.app` / `index-BNNaOgba.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (lock noted `4a1610b6`) |

## What shipped

- Menu Browser / public menus open at restaurant top (no scroll-to-dish)
- Dish green border persists for the menu session when `highlightItem` / Feed `menu_item_id` is set
- Feed X sheet title: **Multiplier** (was Create)
- Category label: **Recommend/Review a Dish** (was Food Review)

## Verification

- `cpd-fe.sh` → **RESULT=PASS**
- Contracts: `menu-item-menu-highlight`, `feedShellContract`, `feedMenuBrowserPipContract` PASS pre-ship

## Human smoke

1. Feed → Menu Browser on a dish video → restaurant name at top + green border on that dish for the session  
2. Feed X → sheet title Multiplier; Recommend/Review a Dish in the list  

## Docs

Tip-gate + LKG locked by `cpd-fe.sh`.
