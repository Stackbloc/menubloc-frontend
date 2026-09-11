# CPD — Section Edit View presets (Take Me Out / Join Me / Join Crew)

**Date:** 2026-09-10  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — production DB: `mergeDefaults` + UPDATE/SELECT `events_join_me` + `crews_join_me`; prior defaults restored (`E2E_RESULT=PASS`) |
| Server | **PASS** — `cpd-be.sh` `RESULT=PASS` smoke 17/17; `health_commit=7ddc13e4…` |

## Backend

| Field | Value |
|-------|--------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit | `7ddc13e4` — persist `events_join_me` in social defaults JSONB |
| Health | `7ddc13e4d26b24d99a653177335df02698f956e4` match |
| Smoke | `RESULT=PASS passed=17` |

## Frontend

| Field | Value |
|-------|--------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `62573672` — section Edit View presets |
| Tip | `menubloc-frontend-iaslmnf6y-menuply.vercel.app` |
| Bundle | `index-CGA3jM4_.js` |
| Tip-gate apex/www | **PASS** (finished via `--lock-only` after interrupted full CPD) |

## Product

- Edit View: Take Me Out under Wanna Eat; Join Me under Plans + Events; **Join Crew** under Crews
- Connect View keeps craving **Join Me / Take Me Out** CTA
- Event compose prefills from `events_join_me` (not crews)

## Verify

Hard-refresh Edit View → each section shows On/Off status; Connect View (eyes) shows green craving button.
