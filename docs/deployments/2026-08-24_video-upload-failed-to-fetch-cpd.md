# CPD — Video upload Failed-to-fetch fix — 2026-08-24

**Status:** **COMPLETE**

## Summary

Eating video clips were dying with browser `Failed to fetch` on upload (photos OK). Ship caps record length/bitrate, rejects oversized clips client-side, maps network errors to a shorter-clip message, and accepts codec MIME params on the BE upload path.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE feature | `menubloc-frontend-main` | `main` | `bc104af` | tip live |
| FE tip lock docs | `menubloc-frontend-main` | `main` | `12a530b` | tip-gate PASS |
| BE feature | `menubloc-backend-main` | `main` | `9174dbc9` | health match |
| BE LKG mirror | `menubloc-backend-main` | `main` | `3245a341` | docs only |

## Production tip

- Deployment: `menubloc-frontend-626p0j6hy-menuply.vercel.app`
- Bundle: `index-D_Nc-5PD.js`
- Tip-gate: **PASS** apex + www
- Lock check: tip-gate script locked to same deploy/bundle **before** PASS
- Bundle smoke: railway=59 localhost=9
- BE `/health` `commit_hash`: `9174dbc9`

## Verify

1. Signed in → X → What I'm Eating → Video → Record ≤15s → Stop → Use video → Post
2. Oversized/long clip should show clear shorter-clip message (not raw Failed to fetch)
3. Photo path still works

## Rollback

Prior tip `rh505od55` / `index-B1mo46YC.js`
