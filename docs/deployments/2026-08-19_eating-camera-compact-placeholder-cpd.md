# CPD — Camera-first eating media + compact empty rows (2026-08-19)

## Summary

Follow-up to Eating hub CPD: inline camera sheet on all supported browsers (not desktop file-picker fallback), remove fake empty-day photo hero, show full 168px media only when photo/video exists.

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `f7b6c0e` |
| Deployment | `menubloc-frontend-5gd67czv9-menuply.vercel.app` |
| Bundle | `index-Cd48RTdf.js` |

## Backend

Unchanged — live `/health` `57e08927` (Eating hub + Waiter want-list from prior CPD).

## Verification

- Tip gate: `RESULT=PASS` apex + www
- Bundle: `menubloc-backend-production` ×59, `localhost:3001` ×9
- Strings: `Add photo or video`, `eating-calendar` in bundle

## Rollback

```bash
npx vercel alias set menubloc-frontend-j027bdhch-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-j027bdhch-menuply.vercel.app www.menuply.com
```
