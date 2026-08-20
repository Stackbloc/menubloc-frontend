# CPD — Modern Social UI native camera picker (2026-08-19)

| Field | Value |
|-------|-------|
| Date | 2026-08-19 |
| FE path | `menubloc-frontend-main` @ clean `main` |
| Commit | `981329a` |
| Deployment | `menubloc-frontend-n3zkiupxn-menuply.vercel.app` |
| Bundle | `index-Dnt3vj6-.js` |
| Aliases | menuply.com, www, crm, venues |
| BE health | `3cfc3196` (docs mirror; feature `57e08927`) |
| Tip gate | PASS |
| Bundle API | railway=59 localhost=9 |

## Shipped

- `MenuplyMediaPicker` — camera icon → native photo/video capture or library → preview
- `preferInlineCamera()` disabled (no inline `ConsumerCameraSheet` on social surfaces)
- My Menuply: hero 280px eating posts, meal-time chips, master compose copy, visual want list
- Profile avatar/gallery selfie-capable (`facingMode=user`)
- SiteFooter Events → `/events`

## Verification

- `node --test test/menuplySocialUiContract.test.js` + hub contracts — 25 pass
- `npm run build` — pass
- `bash scripts/assert-menuply-production-tip.sh` — PASS

## Rollback

```bash
npx vercel alias set menubloc-frontend-82q3dednw-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-82q3dednw-menuply.vercel.app www.menuply.com
```

Prior bundle: `index-Ied-bxNY.js` @ `ca4bf97`
