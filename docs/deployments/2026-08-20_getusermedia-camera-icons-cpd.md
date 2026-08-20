# CPD — Live getUserMedia camera on social icons

**Date:** 2026-08-20  
**Issue:** Camera icons still opened a file picker (`<input type="file" capture>`).

## Root cause

`preferInlineCamera()` returned `false` and `MenuplyMediaPicker` only clicked a hidden file input. On phones that path often opens Files/Downloads, not the camera. Menu upload paths were left alone.

## Fix

- `MenuplyMediaPicker` → `ConsumerCameraSheet` (live preview + Capture / Record)
- `preferInlineCamera()` → `inlineCameraSupported()`
- Dining Crew food photo uses the same picker
- Post about **Upload from library** unchanged (`source="library"`)

## Deploy path

| Layer | Path | Branch | Commit |
|-------|------|--------|--------|
| FE | `menubloc-frontend-main` | `main` | `7eaf78a` |
| BE | _(unchanged)_ | — | health `cce63630` |

## Production tip

| Field | Value |
|-------|-------|
| FE tip | `menubloc-frontend-bm2jkijow-menuply.vercel.app` / `index-BkJqmepa.js` |
| Tip-gate | PASS (apex + www) |

## Verify on phone

1. Hard refresh My Menuply  
2. Tap a meal-slot camera or compose camera icon  
3. Allow camera → live preview → **Capture**
