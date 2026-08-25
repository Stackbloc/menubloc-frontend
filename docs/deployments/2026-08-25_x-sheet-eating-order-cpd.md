# CPD — X sheet Eating section order (Upload media last)

**Date:** 2026-08-25  
**Trigger:** Andre `cpd`

## What shipped

- **Create → Eating** order restored: What I'm Eating → What I Want to Eat → Profile gallery → **Upload media**
- Fixes Upload media incorrectly inserted as 2nd item

## Deploy path

| Layer | Path | Branch | Commit | Tree before deploy |
|-------|------|--------|--------|--------------------|
| FE | `menubloc-frontend-main` | `main` | `ecde436` | clean |
| BE | — | — | — | FE-only ship |

## Frontend

| Field | Value |
|-------|-------|
| Vercel | `menubloc-frontend-pu6h2i0ob-menuply.vercel.app` |
| Bundle | `index-DON2o8Iy.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | **PASS** apex + www |
| Bundle API | railway=59 localhost=9 |

## Backend

| Field | Value |
|-------|-------|
| Railway health `commit_hash` | `b0781d7a…` |
| Change | none (FE-only) |

## Human verify

1. X → Create → **Eating** section order: What I'm Eating, What I Want to Eat, Profile gallery, Upload media (last)
