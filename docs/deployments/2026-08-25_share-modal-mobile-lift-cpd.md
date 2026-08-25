# CPD — ShareModal above bottom nav on mobile

**Date:** 2026-08-25  
**Trigger:** Andre `cpd`

## What shipped

- **ShareModal** lifted above fixed bottom nav on mobile (`zIndex: 1200`, scrollable max height)
- Fixes Month in Food and other share sheets clipped behind bottom nav
- Matches MenuplyActionSheet lift pattern

## Deploy path

| Layer | Path | Branch | Commit | Tree before deploy |
|-------|------|--------|--------|--------------------|
| FE | `menubloc-frontend-main` | `main` | `1ef546c` | clean |
| BE | — | — | — | FE-only ship |

## Frontend

| Field | Value |
|-------|-------|
| Vercel | `menubloc-frontend-2pxw8wkr2-menuply.vercel.app` |
| Bundle | `index-BTEvldYm.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | **PASS** apex + www |
| Bundle API | railway=59 localhost=9 |

## Backend

| Field | Value |
|-------|-------|
| Railway health `commit_hash` | `b0781d7a…` |
| Change | none (FE-only) |

## Tip lock

Locked via `scripts/lock-menuply-production-tip.sh` then tip-gate PASS. LKG docs + FE/BE mirrors updated.

## Human verify

1. Mobile → Month in Food (or any share) → ShareModal fully visible above bottom nav
2. Copy Link still primary; share URLs remain `https://menuply.com/...`
