# CPD — Hybrid camera Photo|Video + TikTok-class video limits

**Date:** 2026-08-25  
**Trigger:** Andre `cpd`

## What shipped

- Consumer camera sheet: **Photo | Video** modes
- Video → native OS `<input capture>` (not MediaRecorder), then upload to Menuply
- Duration/size: **10 minutes** / **~287 MB** (FE + BE diner-media storages)
- Avatar headshot remains photo-only; dining-crew chat remains photo-only (BE)

## Deploy path

| Layer | Path | Branch | Commit | Tree before deploy |
|-------|------|--------|--------|--------------------|
| FE | `menubloc-frontend-main` | `main` | `598b299` | clean |
| BE | `menubloc-backend-main` | `main` | `e53dc7a4` | clean (path-gate PASS) |

## Frontend

| Field | Value |
|-------|-------|
| Vercel | `menubloc-frontend-kp8teptm7-menuply.vercel.app` |
| Bundle | `index-DCAdIaFJ.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | **PASS** apex + www |
| Bundle API | railway=59 localhost=9 |
| Smoke | `Record video`, `consumer-camera-mode-video`, `10 minutes`, `287` present in live bundle |

## Backend

| Field | Value |
|-------|-------|
| Railway health `commit_hash` | `e53dc7a4a7e5852f52d7a81adcec5119ee7b3698` |
| Change | `MAX_VIDEO_BYTES = 287 * 1024 * 1024` on what-i-ate, want-to-eat, food-activity, profile-media |

## Tip lock

Locked via `scripts/lock-menuply-production-tip.sh` then tip-gate PASS. LKG docs + FE/BE mirrors updated. Panic-restore avoided.

## Human verify

1. My Menuply → X → What I'm Eating → camera opens with **Photo | Video**
2. Video → Record video → phone camera → clip attaches → Post
3. Avatar compose still photo-only
