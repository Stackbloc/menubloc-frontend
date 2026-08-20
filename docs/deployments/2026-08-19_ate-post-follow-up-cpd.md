# CPD — Ate post follow-up + diner visual cards (2026-08-19)

| Field | Value |
|-------|-------|
| Date | 2026-08-19 |
| FE path | `menubloc-frontend-main` @ clean `main` |
| Commit | `109e6fc` |
| Deployment | `menubloc-frontend-fuigm2qkl-menuply.vercel.app` |
| Bundle | `index-Dv-4gviG.js` |
| Aliases | menuply.com, www, crm, venues |
| BE health | `f593a846` (docs; eating/Waiter feature `57e08927`) |
| Tip gate | PASS |
| Bundle API | railway=59 localhost=9 |

## Shipped

- Ate posts pin immediately on My Menuply after publish
- Optional details: restaurant, menu item, homemade, recipe; Skip for now
- Who can find me radio labels readable (dark ink)
- What Diners Are Saying: 280px food media first

## Rollback

```bash
npx vercel alias set menubloc-frontend-n3zkiupxn-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-n3zkiupxn-menuply.vercel.app www.menuply.com
```

Prior bundle: `index-Dnt3vj6-.js` @ `981329a`
