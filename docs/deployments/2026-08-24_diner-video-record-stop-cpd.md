# CPD — Diner video record Stop validation fix — 2026-08-24

**Status:** **COMPLETE** (E2E record smoke pending Andre)

## Summary

Record → Stop showed red *Could not play recorded video* because `withVideoPreviewSeek()` appended `#t=0.001` to blob URLs, breaking decode in validation + review. Restore **15s** cap; WebM records live preview stream.

Audit: `docs/audits/2026-08-24_diner-video-record-stop-validation.md`

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE feature | `menubloc-frontend-main` | `main` | `ef4420d` | tip live |
| FE tip lock docs | `menubloc-frontend-main` | `main` | (this commit) | tip-gate PASS |
| BE | unchanged feature | `main` | `d15c9260` durable media | health `62557954` |

## Production tip

- Deployment: `menubloc-frontend-89jj1mz2b-menuply.vercel.app`
- Bundle: `index-6lPa6XN2.js`
- Tip-gate: **PASS** apex + www
- Bundle smoke: railway=59 localhost=9
- BE `/health` `commit_hash`: `62557954`

## Verify (Andre)

1. My Menuply → What I'm Eating → Video → Record 3–5s → Stop
2. Review clip plays (no red error); timer shows **/15s max**
3. Use video → Post → video plays on feed

## Rollback

Prior tip `5hahxk6st` / `index-CYtSPDxP.js`
