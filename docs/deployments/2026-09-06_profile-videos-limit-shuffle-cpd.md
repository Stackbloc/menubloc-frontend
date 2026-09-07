# CPD — Profile Videos initial 3 + portrait grid + shuffle

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `1febced3` — `feat(profile): limit Videos to 3, portrait tiles, shuffle on load` |
| Tip-lock docs | `a6abf709` — tip-gate + LKG synced to this tip |
| **Live tip** | `menubloc-frontend-9qd0c0fqj-menuply.vercel.app` / `index-BfyUWvkz.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (lock noted `a3997be8`) |

## What shipped

- Profile Videos section shows **3** clips initially (expand with View all)
- Portrait **9:16** cover tiles in a responsive `auto-fill` grid (no fixed 280×160 letterbox)
- Fisher–Yates **shuffle on each load** so the first three rotate across visits

## Verification

- `cpd-fe.sh` → **RESULT=PASS**
- `node --test test/profileVideosSectionContract.test.js` PASS pre-ship
- Live tip-gate apex + www **PASS** (`index-BfyUWvkz.js`)

## Human smoke

1. Open a restaurant profile with multiple Videos (e.g. Domino’s franchise fan-out)  
2. Confirm ≤3 tiles initially, portrait framing, “View all” when more exist  
3. Reload — first three should often differ  

## Docs

Tip-gate + LKG locked by `cpd-fe.sh`.
