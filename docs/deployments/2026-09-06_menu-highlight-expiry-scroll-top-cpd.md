# CPD — Menu highlight expiry scroll to restaurant top

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `ff2ef4a7` — `fix(menu): after dish highlight expires, scroll menu to restaurant top` |
| Also pushed | `e460ce7b` — owner Menu Manager zero-insert UX (prior local commit) |
| **Live tip** | `menubloc-frontend-omf33mwn7-menuply.vercel.app` / `index-pD5Ej4N9.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (lock noted `62f6ad4c`) |

## What shipped

- After the 7s green `?highlightItem=` dish highlight ends, scroll `.menu-catalog-scroll` (Menu Browser) or the window (public menu) back to top so the restaurant name is visible
- Unmount during highlight does not force scroll-to-top

## Verification

- `cpd-fe.sh` → **RESULT=PASS**
- `tests/menu-item-menu-highlight.test.js` PASS pre-ship

## Human smoke

1. Open Menu Browser / menu with a highlighted dish → scrolls to item  
2. Wait ~7s → highlight clears and view returns to menu top / restaurant name  

## Docs

Tip-gate + LKG locked by `cpd-fe.sh`.
