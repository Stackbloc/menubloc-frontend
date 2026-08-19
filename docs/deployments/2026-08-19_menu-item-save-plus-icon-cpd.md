# CPD — Menu item save + icon (2026-08-19)

## Summary

Shipped signed-in-only **+** icon as the last action on menu item detail. Tapping it opens `/account/menu-item/save` where the diner chooses **What I ate** or **What I want to eat**. Removed the two full-width add buttons from the sticky hero.

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `9935730` |
| Deploy | `npx vercel --prod --yes` |
| Deployment | `menubloc-frontend-c7nyeh8xt-menuply.vercel.app` |
| Bundle | `index-gxB9JJHj.js` |
| Aliases | `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com` |
| Tip gate | PASS (apex + www) |
| API probe | `menubloc-backend-production` ×59, `localhost:3001` ×9 |

## Backend

Not deployed — this feature uses existing `createWhatIAteToday` / `createWantToEat` APIs. Incomplete eating-video migration `0277` remains uncommitted in `menubloc-backend-main`.

## Tests

- `npm run test:food-social-contract` — 31/31 PASS
- `tests/menu-item-detail-sticky-verdict.test.js` — PASS

## Human verify

1. Sign in on menuply.com
2. Open any menu item detail (e.g. Wendy's Spicy Chicken Sandwich)
3. Confirm **+** is last icon in the dish action row (after comment)
4. Tap **+** → choice screen → pick ate or want → confirm success notice
5. Signed out: **+** should not appear

## Rollback

```bash
npx vercel alias set menubloc-frontend-6o01ok4ww-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-6o01ok4ww-menuply.vercel.app www.menuply.com
# + crm / venues if needed
```

Prior tip: `6o01ok4ww` / `index-D0BpzNQF.js` @ `3d81100`
