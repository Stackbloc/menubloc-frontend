# CPD — My Menuply presentation rails + exhibit palette (2026-08-19)

| Field | Value |
|-------|-------|
| Date | 2026-08-19 |
| FE path | `menubloc-frontend-main` @ clean `main` |
| FE commit | `2108f37` |
| Deployment | `menubloc-frontend-9yjbhvqe2-menuply.vercel.app` |
| Bundle | `index-B4EE7_sD.js` |
| Aliases | menuply.com, www, crm, venues |
| BE path | `menubloc-backend-main` @ clean `main` (unchanged) |
| BE commit | `ad3d097a` |
| BE health | `ad3d097a` |
| Tip gate | PASS |
| Bundle API | railway=60 localhost=9 |

## Shipped

- My Menuply: cream/forest-green exhibit palette, green hero band, serif section titles
- Presentation layer: stats bar, connection avatar strip, highlights grid, followed-restaurant rails
- Compose moved to `EatingComposeSheet` (+ Log trigger); journal day nav more prominent
- Honest restaurant-backed filler (followed places, saved dishes) when diary empty

## Rollback

```bash
npx vercel alias set menubloc-frontend-8zfz8l0px-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-8zfz8l0px-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-8zfz8l0px-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-8zfz8l0px-menuply.vercel.app venues.menuply.com
```

Prior tip: `8zfz8l0px` / `index-B855g_K3.js` / `56c5d44`

## Verify on production

- https://menuply.com/my-menuply — green styling, stats/highlights, + Log sheet
- Journal day bar visible with green border shell
