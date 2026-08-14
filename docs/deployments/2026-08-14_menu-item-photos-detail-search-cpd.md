# 2026-08-14 CPD — Dish photos on detail (desktop) + search

**Type:** Backend + Frontend CPD  
**Authorization:** User requested CPD  
**STATUS:** COMPLETE

## What shipped

- BE: hydrate `item_photo_url` from `public.menu_item_photos` on detail + search (after ranking)
- FE: desktop detail photo below sticky hero; search result 72×72 thumbnails

## Backend

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` |
| Branch | `main` |
| Commit | `72c80f99` |
| Path-gate | PASS |
| Railway health `commit_hash` | `72c80f99192779390f45cfd0897d405675c817f8` |
| Probe | `GET /menu-items/464479` → Patties photo URL present |

## Frontend

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| Branch | `main` |
| Commit | `f778476` |
| Deployment | `menubloc-frontend-1ac66vdd5-menuply.vercel.app` |
| Bundle | `index-C9tZU1bB.js` |
| Tip-gate | PASS (after lock update) |
| Exception | none |

## Bundle API check

- `menubloc-backend-production` = 61
- `localhost:3001` = 9
