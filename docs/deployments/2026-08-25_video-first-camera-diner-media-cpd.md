# CPD — Video-first camera + diner-media video uploads

**Date:** 2026-08-25  
**Trigger:** Andre `cpd`

## Shipped

### Frontend (`menubloc-frontend-main`)

| Field | Value |
|-------|-------|
| Commit | `a53280c` |
| Deploy | `menubloc-frontend-p15q2zbam-menuply.vercel.app` |
| Bundle | `index-BvGoNScn.js` |
| Tip-gate | PASS apex + www |
| Changes | Video\|Photo chips (Video first); Record video via `<label>`+`capture` (not `input.click`); E2E verification completion contract |

### Backend (`menubloc-backend-main`)

| Field | Value |
|-------|-------|
| Commit / health | `d3449e93` |
| Changes | Diner media uploads use `diner-media` only (no `menu-item-photos` fallback that rejected `video/mp4`) |
| Ops | Created public Supabase bucket `diner-media` with video MIME; `DINER_MEDIA_STORAGE_BUCKET=diner-media` |

## E2E proof (production)

| Hop | Result |
|-----|--------|
| `buildPhotoRecordFromUpload` video/mp4 | PASS → durable `…/diner-media/what-i-ate-today/…` |
| `createEntry` with `video_url` | PASS (row id 14, then soft-deleted) |
| HEAD durable URL | **200** `video/mp4` |
| Soft-delete cleanup | PASS |

Audit: `docs/audits/2026-08-25_eating-video-upload-diner-media-e2e.md`

## Path gates

- FE: `menubloc-frontend-main` @ clean `main` after docs lock commit  
- BE: path-gate PASS before push; health `d3449e93…`
