# CPD — Join Me brand green + cravings header placement

**Date:** 2026-09-12  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab `per-occasion Join Me` |
| Server | **NOT REQUIRED** — FE presentation only |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `124a6363` |
| Tip | `menubloc-frontend-57fnq1jfk-menuply.vercel.app` |
| Bundle | `index-BGtKVqOw.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | `#166534` — **PASS** (174 hits in live JS) |

## Backend

Unchanged this ship (`be_commit` noted by cpd-fe in lock output).

## Product

1. **JoinMeButton** fill → Menuply mid green `#166534` (was near-black `#173404`).  
2. Connect cravings **Join Me** moves into **What I wanna eat** section header aside (not below the scroller / outside the category).

## Regression

Connect View → Cravings: green Join Me on the title row. Plan cards: same green pill.
