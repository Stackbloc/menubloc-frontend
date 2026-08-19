# Food Social MVP Stages 1–2 — CPD

**Date:** 2026-08-19  
**Agent:** Cursor Auto

## Summary

Shipped Food Social Network MVP **Stages 1–2**: Post (X) action wiring, Events browse page, I'm Eating At photo uploads, and authenticated publish mirror to My Menuply.

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `fba813a` |
| Deploy | `npx vercel --prod --yes` |
| URL | `menubloc-frontend-ns16qypm7-menuply.vercel.app` |
| Bundle | `index-BcsalcQZ.js` |
| Aliases | menuply.com, www.menuply.com, crm.menuply.com, venues.menuply.com |
| Tip-gate | **PASS** apex + www |

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit | `492dd058` |
| Path-gate | **PASS** |
| Health SHA | `492dd0581c93258e3e82e9cea353ac7216c0bc75` |
| Smoke | `GET /public/events?lat=34.05&lng=-118.24` → ok |

## Features shipped

- Post sheet: Add to Want to Eat → `/my-menuply?focus=want`
- Post sheet: Invite to Eat → `/account/invite-to-eat`
- Post sheet: Find events → `/events`
- Events browse page + `GET /public/events`
- I'm Eating At photo capture/upload
- Authenticated publish → `food_activity` + `what_i_ate_today` mirror
- What Diners Are Saying photo URL fix

## Verification

- Bundle API: railway=59, localhost=9 (≤6 acceptable dead DEV branches)
- Tip-gate PASS on menuply.com + www.menuply.com
- BE health matches `492dd058`

## Rollback

```bash
npx vercel alias set menubloc-frontend-4iy54g5qc-menuply.vercel.app menuply.com
# (+ www, crm, venues)
```

Prior tip: `4iy54g5qc` / `index-6H0iynJH.js` (Future plans calendar events)

## Human verification requested

- Post (X) → Add to Want to Eat → compose on My Menuply
- Post (X) → Invite to Eat → restaurant picker → modal
- Post (X) → Find events → `/events` (not clusters)
- I'm Eating At → add photo → Publish → appears on My Menuply + restaurant What Diners Are Saying
