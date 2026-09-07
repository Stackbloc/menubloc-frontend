# CPD — Multiplier/Post rail + sheet label

**Date:** 2026-09-06  
**Status:** **CPD COMPLETE** (FE tip-gate PASS)  
**Scope:** FE only

## Ship

| Field | Value |
|-------|--------|
| Feature commit | `e9958117` — `feat(feed): use Multiplier/Post consistently on rail and sheet` |
| **Live tip** | `menubloc-frontend-1xbag4iua-menuply.vercel.app` / `index-C91Tk04-.js` |
| Tip-gate apex/www | **RESULT=PASS** |
| FE path | `menubloc-frontend-main` @ clean `main` |
| BE | unchanged this CPD (lock noted `6469d3d0`) |

## What shipped

- Desktop rail button: **Multiplier/Post** (was Post)
- Multiplier sheet title: **Multiplier/Post**
- Mobile X aria-label: Open Multiplier/Post menu

## Verification

- `cpd-fe.sh` → **RESULT=PASS**
- `test/feedShellContract.test.js` PASS pre-ship

## Docs

Tip-gate + LKG locked by `cpd-fe.sh`.
