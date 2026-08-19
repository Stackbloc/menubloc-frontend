# Food Social MVP Stages 3–4 — CPD

**Date:** 2026-08-19  
**Agent:** Cursor Auto

## Summary

Shipped Food Social Network MVP **Stages 3–4**: About Me profile media gallery (photos + short videos) and Want to Eat photos with menu-item add path + connection peer want list.

## Migrations (production)

| Migration | Status |
|-----------|--------|
| `20260819_0274_consumer_profile_media.sql` | Applied and tracked |
| `20260819_0275_diner_want_to_eat_photo.sql` | Applied and tracked |

Applied via:

```bash
CONFIRM_PRODUCTION_TARGET=true railway run --environment production -- \
  node scripts/applyOneMigration.js 20260819_0274_consumer_profile_media.sql --allow-production
CONFIRM_PRODUCTION_TARGET=true railway run --environment production -- \
  node scripts/applyOneMigration.js 20260819_0275_diner_want_to_eat_photo.sql --allow-production
```

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commits | `4213c41` (feature), `af0f5a9` (build fix) |
| Deploy | `npx vercel --prod --yes` |
| URL | `menubloc-frontend-asye7pvem-menuply.vercel.app` |
| Bundle | `index-B4WVHrrh.js` |
| Aliases | menuply.com, www.menuply.com, crm.menuply.com, venues.menuply.com |
| Tip-gate | **PASS** apex + www |

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit | `31b40a44` |
| Path-gate | **PASS** |
| Health SHA | `31b40a44c1029e8100f253d8baa0fa409f65269c` |

## Features shipped

- About Me profile gallery (photo/video upload, remove, peer read via connection)
- Want to Eat photo on compose (`QuickCompose acceptPhoto`)
- `WantToEatAddButton` on menu item detail
- Peer want list on connection hub (replaces stub)
- `GET/POST/DELETE /api/consumer/profile/media`
- `POST /api/consumer/want-to-eat/photo`
- `GET /api/consumer/want-to-eat/users/:userId`

## Verification

- Bundle API: railway=59, localhost=9
- Tip-gate PASS on menuply.com + www.menuply.com
- BE health matches `31b40a44`

## Rollback

```bash
npx vercel alias set menubloc-frontend-ns16qypm7-menuply.vercel.app menuply.com
# (+ www, crm, venues)
```

Prior tip: `ns16qypm7` / `index-BcsalcQZ.js` (Food social MVP Stages 1–2)

## Human verification requested

- My Menuply → About Me → add profile photo or video
- My Menuply → What I Want to Eat → compose with photo
- Menu item detail → Add to What I Want to Eat
- Connection hub → peer’s want list visible
