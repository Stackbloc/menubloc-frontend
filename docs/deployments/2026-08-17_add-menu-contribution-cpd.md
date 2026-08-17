# CPD — Add Menu contribution (2026-08-17)

## Summary

Shipped Add Menu for unclaimed restaurants without a usable menu. Signed-in diners see a camera-menu icon (tooltip “Add Menu”) on profiles, discovery/cluster cards, and empty menu placeholders. Capture uses the existing public OCR pipeline with the restaurant pre-locked. Dining halls are excluded. Social / What I Ate Today WIP was stashed and not shipped.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `074a217` (feature `3cc314e` + JSX fix) | clean after feature commits |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `7bff0469` | clean; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-3vre2srp8-menuply.vercel.app`
- Bundle: `index-DQKfgzho.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: `Add Menu` ×4, `menu-capture` ×4; Railway `59` vs `localhost:3001` `9`

## BE health

- Feature SHA: `7bff0469675834428a46c474666c074c065b9cbc`
- Live `/health`: **MATCH** `7bff0469675834428a46c474666c074c065b9cbc`
- GitHub auto-deploy SUCCESS after `git push origin main`

## Database

None.

## Prior tip (restore if needed)

`menubloc-frontend-30qbi67vq-menuply.vercel.app` / `index-CMXfgjwr.js`
