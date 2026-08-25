# CPD — Restore Record video copy on camera sheet

**Date:** 2026-08-25  
**Trigger:** Andre `cpd`

## What shipped

- Camera sheet / native video control: **Upload video** → **Record video** (title + button)
- Soft-accept path unchanged; X **Upload media** remains the library picker

## Deploy path

| Layer | Path | Branch | Commit | Tree before deploy |
|-------|------|--------|--------|--------------------|
| FE | `menubloc-frontend-main` | `main` | `01ddc2d` | clean (tip lock sync `e3210c6` then deploy) |
| BE | — | — | — | FE-only |

## Frontend

| Field | Value |
|-------|-------|
| Vercel | `menubloc-frontend-2cgb8v0pn-menuply.vercel.app` |
| Bundle | `index-DP4hQTxR.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | **PASS** apex + www |
| Smoke | `Record video (up to` in live bundle |

## Backend

| Field | Value |
|-------|-------|
| Railway health | `b0781d7a…` |
| Change | none |

## Human verify

1. X → What I'm Eating → Video → button says **Record video**
2. Record on phone → clip attaches → **Post**
