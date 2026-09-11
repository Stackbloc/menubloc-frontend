# CPD — Unified multi-item meals + Month in Food occasions

**Date:** 2026-09-11  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — `railway run` local service + prod DB, consumer 29: `createMealWithItems` 2-item @home → `listMine` `meals.items.length===2` → MiF `meals_count` occasions (`7` meals / `8` items while probe existed) → delete both items + parent meal; leftover=0 |
| Server | **PASS** — `cpd-be.sh` `RESULT=PASS`; smoke `passed=18` including `consumer_ate_meals_create` 401 |

## Migration

Applied directly (full `migrate.js` blocked on old CONCURRENTLY pendings):

- `20260911_0328_diner_meals_multi_item.sql` — tracked `2026-09-11T13:28:55.720Z`

Verified: `public.diner_meals` exists; `what_i_ate_today.meal_id` present.

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit | `a09498b2` |
| Health | `a09498b2f3077700b162897a4ce4e0346c746b61` match |
| Smoke | `RESULT=PASS passed=18` |
| Route | `POST /api/consumer/what-i-ate-today/meals` live (unauth 401, not 404) |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `d7929078` |
| Tip | `menubloc-frontend-9r6ukumw1-menuply.vercel.app` |
| Bundle | `index-DMRlbt9y.js` |
| Tip-gate apex/www | **PASS** |
| Content probe | live JS contains `ate-add-item` |

Interrupted `cpd-fe.sh` already aliased production; finished with `--lock-only` (no second `vercel --prod`).

## Verify (human)

Hard-refresh My Menuply / Multiplier: add a second food on one meal; Month in Food Meals Logged should count occasions, not extra rows. Video still attaches to the first item.
