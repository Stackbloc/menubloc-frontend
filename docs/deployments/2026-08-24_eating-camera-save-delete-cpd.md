# CPD — Eating camera flip, durable media, hard-press delete

**Date:** 2026-08-24

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | `menubloc-frontend-main` | `main` | `9acc99a` | tip-gate PASS |
| BE | `menubloc-backend-main` | `main` | `9901800b` | health `9901800b` |

## Production tip

- Deployment: `menubloc-frontend-fa0lpz0yi-menuply.vercel.app`
- Bundle: `index-BKIe5jXc.js`
- Tip-gate: PASS apex + www (locks synced via tip-lock atomic contract)

## Ship summary

- Live camera sheet: deviceId front/rear flip; Photo + Video
- Ate/want uploads: Supabase durable (prod fail-closed); Content-Disposition inline
- Hard-press delete: soft-deletes diary + linked food_activity; hub reload

## Tip lock process (new)

Agents must follow `docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md` on every FE alias:
Alias → `lock-menuply-production-tip.sh` → tip-gate PASS → sync LKG mirrors. Never panic-restore on `bundle != locked tip` alone.

## Env

Production BE needs Supabase storage configured. Optional: `DINER_MEDIA_STORAGE_BUCKET` (defaults to `MENU_ITEM_PHOTO_STORAGE_BUCKET` or `diner-media`).
