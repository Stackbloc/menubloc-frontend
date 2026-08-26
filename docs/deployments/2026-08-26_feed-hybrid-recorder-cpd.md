# CPD — Feed video-only hybrid ConsumerCameraSheet recorder (2026-08-26)

## Summary

Feed X and plan video attach now use the same hybrid `ConsumerCameraSheet` as My Menuply ate/want (REC badge, validate/normalize, review step) with photo mode hidden — not the stripped `NativeVideoCapture` stub.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `ded1f71` | tip-gate PASS |
| BE | unchanged | main | `a007e05e` | health unchanged |

## Production tip

- Deployment: `menubloc-frontend-3dbymospp-menuply.vercel.app`
- Bundle: `index-DRXhbBkl.js`
- Tip-gate: **PASS** apex + www
- Prior tip (rollback): `dy1boxufn` / `index-Wxgt5_-3.js`

## Verify

1. https://menuply.com/feed — tap center X → I'm Eating → camera sheet opens with **Record video** / **REC** on desktop
2. Record → Stop → Review → Use video → post saves to Feed
3. My Menuply plan → **Add plan video** → same sheet (no Photo chip)

## Rollback

```bash
npx vercel alias set menubloc-frontend-dy1boxufn-menuply.vercel.app menuply.com
# + www/crm/venues; lock tip-gate to index-Wxgt5_-3.js
```
