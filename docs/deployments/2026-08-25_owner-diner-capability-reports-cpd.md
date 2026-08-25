# CPD — Owner diner capability reports + My Menuply dialog

**Date:** 2026-08-25  
**Status:** LIVE (tip-gate PASS on wrap-up)

## What shipped

- `/owner/diners` capability metrics: Today / Yesterday / Week / Month / Year
- Sign-ins, posts by category, events, invites, QR connects, videos, avg connects
- Clickable diner roster → read-only My Menuply hub dialog
- BE: `GET /api/owner/dashboard/diners/stats`, `GET /api/owner/dashboard/diners/:id`

## Commits

| Layer | Commit | Notes |
|-------|--------|-------|
| FE | `e25acc5` (on tip via later `f6f663e`) | Owner diner UI |
| BE | `c368ab73` (on health via later `dadb5bf9`) | Stats + detail APIs |

## Tip / health (wrap-up)

| Field | Value |
|-------|-------|
| Deploy | `menubloc-frontend-bhsmmn3j5-menuply.vercel.app` |
| Bundle | `index-COswfWJg.js` |
| Tip-gate | PASS apex + www |
| BE health | `dadb5bf9` |
| Bundle markers | `diner-capability-metrics`, `diner-stats-interval` present |
| railway / localhost | 59 / 9 |

## Notes

- Concurrent main tip moves during wrap-up; locked tip-gate to live apex (no restore).
- Connections Eating WIP remains stashed / out of this CPD.
- Personal diner QR **scans** still not logged (connects + codes created only).

## Verify

https://menuply.com/owner/diners
