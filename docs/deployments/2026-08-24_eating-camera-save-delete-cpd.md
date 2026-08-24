# CPD — Eating camera flip, durable media, hard-press delete

**Date:** 2026-08-24

## Deploy path

| Layer | Path | Branch | Notes |
|-------|------|--------|--------|
| FE | `menubloc-frontend-main` | `main` | camera flip + delete UX |
| BE | `menubloc-backend-main` | `main` | inline serve + durable storage + delete cascade |

## Ship summary

- Live camera sheet: deviceId front/rear flip; Photo + Video
- Ate/want uploads: Supabase durable (prod fail-closed); Content-Disposition inline
- Hard-press delete: soft-deletes diary + linked food_activity; hub reload

## Env

Production BE needs Supabase storage configured. Optional: `DINER_MEDIA_STORAGE_BUCKET` (defaults to `MENU_ITEM_PHOTO_STORAGE_BUCKET` or `diner-media`).
