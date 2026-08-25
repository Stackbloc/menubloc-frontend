# CPD — Android video soft-accept + X Upload media

**Date:** 2026-08-25  
**Trigger:** Andre `cpd`

## What shipped

- **Android video fix:** soft-accept OS-captured clips when browser `<video>` decode fails (hard reject only size/duration/type/empty)
- **Copy:** “Record video” → **Upload video**; sheet title **Upload video (up to 10 minutes)**
- **X sheet:** new **Upload media** action → `/my-menuply?compose=ate&media=library` (gallery pick path)

## Deploy path

| Layer | Path | Branch | Commit | Tree before deploy |
|-------|------|--------|--------|--------------------|
| FE | `menubloc-frontend-main` | `main` | `5d6e26a` | clean |
| BE | — | — | — | FE-only ship (no Railway push) |

## Frontend

| Field | Value |
|-------|-------|
| Vercel (this CPD) | `menubloc-frontend-azxhntx1m-menuply.vercel.app` |
| Bundle (this CPD) | `index-DTFzIdfb.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | **PASS** apex + www at ship time |
| Bundle API | railway=59 localhost=9 |
| Smoke | `Upload video`, `Upload media` present in live bundle |

**Later tip:** superseded by ad-branding fix `99h0x2fbh` / `index-5cwRXhcD.js` (`9fe5181`), which **includes** this commit. Current live bundle still has `Upload video` + `Upload media`.

## Backend

| Field | Value |
|-------|-------|
| Railway health `commit_hash` | `e36d248943c1d72cf2226cafafddf0d6ebe54a35` |
| Change | none (FE-only) |

## Tip lock

Locked via `scripts/lock-menuply-production-tip.sh` then tip-gate PASS. LKG docs + FE/BE mirrors updated. Panic-restore avoided.

## Human verify

1. X → **What I'm Eating** → Video → record on Android → clip attaches → **Post** visible (no stuck “Could not read that video”)
2. X → **Upload media** → pick from gallery → Post
3. Avatar compose still photo-only
