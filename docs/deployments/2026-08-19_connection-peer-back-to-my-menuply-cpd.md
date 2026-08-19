# CPD — Connection peer back to My Menuply (2026-08-19)

## Summary

Viewing another diner's Connection hub now shows a sticky **← My Menuply** link in the page header so signed-in diners can return to their own profile without scrolling. `StickyPageHeader` gained optional `backTo` / `backLabel` props (also fixes Find Diners' previously ignored `backTo`).

## Frontend

| Field | Value |
|-------|-------|
| Path | `menubloc-frontend-main` @ clean `main` |
| Commit | `98de2ad` |
| Deployment | `menubloc-frontend-i20ol5ufo-menuply.vercel.app` |
| Bundle | `index-BgGXGGfN.js` |
| Tip gate | PASS (apex + www) |
| Change | `StickyPageHeader` back link; `ConsumerConnectionPeerPage` + `ConnectionPeerWhatIAtePage` |

## Backend

Not deployed.

## Tests

- `test/connectionPeerHubContract.test.js` — PASS
- `test/dinerPrimaryNavContract.test.js` — PASS
- `npm run test:food-social-contract` — 31/31 PASS

## Human verify

1. Sign in → open a Connection peer hub (e.g. Joe Johnson)
2. Confirm sticky header shows **← My Menuply** above the peer name
3. Tap it → lands on `/my-menuply`

## Rollback

Prior tip: `o91cxjxfw` / `index-B1Y0hVDJ.js` @ diner hub peer parity
