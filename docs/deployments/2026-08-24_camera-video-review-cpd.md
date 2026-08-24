# CPD — Camera video review (Use / Retake) — 2026-08-24

**Status:** **COMPLETE**

## Summary

X → What I'm Eating auto-opens camera; video Record shows REC+timer; Stop opens a playable **Review** with **Retake** / **Use video**; recording is video-only to avoid black/unplayable clips.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE feature | `menubloc-frontend-main` | `main` | `29b1eef` | tip live |
| FE tip lock docs | `menubloc-frontend-main` | `main` | `7a40166` | tip-gate PASS |
| BE | unchanged this ship | `main` | health `be70eae1` | — |

## Production tip

- Deployment: `menubloc-frontend-rh505od55-menuply.vercel.app`
- Bundle: `index-B1mo46YC.js`
- Tip-gate: **PASS** apex + www
- Lock check: **PASS**
- Bundle smoke: railway=59 localhost=9

## Verify

1. Signed in → X → What I'm Eating → camera opens
2. Photo → Capture works
3. Video → Record (REC) → Stop → review plays → Use video
4. Meal board shows muted looping preview

## Rollback

Prior tip `1s4sa4h5c` / `index-Bs7F6aGK.js`
