# CPD — Quiet Edit View audience presets + All Connects

**Date:** 2026-09-10  
**Status:** **CPD COMPLETE**

## Pre-CPD gate

| Check | Result |
|-------|--------|
| E2E | **NOT REQUIRED** — label + presentation only (`variant="preset"`); no new mutation path |
| Server | **NOT REQUIRED** — FE-only UI |

## Frontend

| Field | Value |
|-------|--------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Feature commit | `529e7843` — quiet Edit View audience presets + All Connects label |
| Tip | `menubloc-frontend-6umqwa193-menuply.vercel.app` |
| Bundle | `index-BVdPHhoU.js` |
| Tip-gate apex/www | **PASS** |
| Door | `bash scripts/cpd-fe.sh "quiet Edit View audience presets + All Connects"` → `RESULT=PASS` |

## Backend

Unchanged this ship. Live health remains `fdf7e1cf` (prior Edit View meal CPD).

## Product

- Edit View Join Me / Take Me Out audience controls use quiet preset styling (aligned with status lines)
- Label **Anyone Connect → All Connects**
- Join Me ≠ Invite Me Out allow-lists unchanged

## Verify

Hard-refresh My Menuply Edit View → On for Take Me Out / Join Me → options read as quiet text, not fat green pills; **All Connects** / Select specific.
