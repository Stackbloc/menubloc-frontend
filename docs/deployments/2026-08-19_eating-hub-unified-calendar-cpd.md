# CPD — Unified Eating hub + Waiter want-list (2026-08-19)

## Summary

Shipped unified **Eating** section on My Menuply (compose, filters, single tap-to-open Apple-style calendar with past/future markers), crew **name + purpose** on hub cards, and Waiter briefing integration for want-to-eat items. Backend adds migration `0277` (eating video + food_activity link) and `waiterWantToEatService`.

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `80b6d41` |
| Deploy | `npx vercel --prod --yes` |
| Deployment | `menubloc-frontend-j027bdhch-menuply.vercel.app` |
| Bundle | `index-CtFIYW11.js` |
| Aliases | `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com` |

### Verification

- Tip gate: `RESULT=PASS` (apex)
- Bundle API: `menubloc-backend-production` ×59, `localhost:3001` ×9
- Bundle strings: `eating-calendar`, `eating-compose`, `crew-purpose` present

## Backend

| Field | Value |
|-------|-------|
| Path | `menubloc-backend-main` @ clean `main` |
| Commit | `57e08927` |
| Push | `git push origin main` → Railway |
| Health | `https://menubloc-backend-production.up.railway.app/health` → `commit_hash` `57e08927` |
| Path gate | `RESULT=PASS` |

## Tests run (pre-commit)

- FE: `eatingHubContract`, `myMenuplyFourQuestionsContract`, `connectionPeerHubContract`, `dinerAboutPhotosContract`, `wantToEatPhotosContract` — 15/15 pass
- BE: `waiterLikesContract`, `waiterWantToEatContract` — pass
- FE: `npm run build` — pass

## Human verify

- [ ] My Menuply → **Eating** section with Ate/Want/Plan compose
- [ ] Tap calendar chip → sheet opens; green/blue day dots
- [ ] My Crews cards show **Purpose** line
- [ ] `/waiter` signed in → **On your want list** category when items exist

## Rollback

```bash
npx vercel alias set menubloc-frontend-i20ol5ufo-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-i20ol5ufo-menuply.vercel.app www.menuply.com
# BE: revert Railway to prior SHA if needed (pre-57e08927)
```
