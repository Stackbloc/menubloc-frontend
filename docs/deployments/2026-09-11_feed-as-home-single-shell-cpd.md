# CPD — Feed-as-home single shell (`/` → `/feed`)

**Date:** 2026-09-11  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **PASS** — lab + **live tip** `feedHomeToProfileNav.e2e.spec.js` **8/8** (mobile + desktop; apex `/` redirect; Profile→Deals/Home; Multiplier dismiss; desktop rail) |
| Server | **NOT REQUIRED** — FE routing only |

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `747a2b88` |
| Tip | `menubloc-frontend-owubpaie2-menuply.vercel.app` |
| Bundle | `index-IlGk7Y_L.js` |
| Tip-gate apex/www | **PASS** |
| Live tip hop | **PASS** — `PLAYWRIGHT_BASE_URL=https://menuply.com` 8/8 |

## Backend

Unchanged this ship (lock noted `b53dd366`).

## Product / fix

Feed-as-home no longer mounts a second `FeedShell` on `/`. `HomeRoot` redirects `/` → `/feed` so **one** shell + Outlet owns Feed → Profile → Deals on **mobile** (bottom nav) and **desktop** (left rail).
