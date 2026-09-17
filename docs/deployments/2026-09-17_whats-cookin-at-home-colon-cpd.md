# CPD — What's cookin' `@home:` + customer-facing @home copy

**Date:** 2026-09-17  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — `eatingPlaceLink` / contract tests; live tip hop `/feed/profile` HTTP 200; tip JS contains `OR="@home"` and join `` `${OR}: ${i}` `` (minified; contiguous `@home:` not present) |
| Server | **PASS** — `cpd-be.sh` `RESULT=PASS` `health_commit=358792dd…` matches HEAD (customer-facing `@home dish not found` errors) |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `de101ed8` |
| Tip | `menubloc-frontend-q9cw6ftat-menuply.vercel.app` |
| Bundle | `index-ClzoO0LY.js` |
| Tip-gate apex/www | **PASS** |
| Content proof | Live JS: `OR="@home"`, `xLe="Homemade"` (legacy parse), join `` `${OR}: ${i}` `` |
| Live tip hop | **PASS** — `https://menuply.com/feed/profile` → 200 |

`cpd-fe.sh` with `CPD_CONTENT_GREP='@home:'` returned **INCOMPLETE** (minifier splits prefix). Tip locked manually via `lock-menuply-production-tip.sh`; tip-gate **PASS**. Panic-restore avoided.

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit / health | `358792dd` / `358792ddafc2ce76746a53fbc9fa35fb04fb39d2` |
| Smoke | **PASS** (30 probes) |
| Note | Search cooking caption left as `Homemade` (search approval gate); dish-not-found API messages → `@home dish not found` |

## Product

1. What's cookin' place labels use **`@home:`** (e.g. `@home: Thanksgiving dinner`); legacy `Homemade.` / `@home.` rewrite on display.  
2. Customer-facing Homemade/@Home UI → `@home` (compose chips, search cards, dish detail/compose, Month in Food, share titles).

## Verify

Hard-refresh `https://menuply.com/feed/profile` — What's cookin' @home plans show `@home:` not `Homemade.`
