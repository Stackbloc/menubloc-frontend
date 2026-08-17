# CPD — Dining-hall status + comments lock (2026-08-17)

## Summary

Locked the product rule: **dining-hall menus are irrelevant**. Menuply does not analyze dining-hall menus or menu items. Users report **what is going on** (status) and **comment**. Menu data is not required.

No consumer UI/runtime change. Same JS bundle as guest open reporting (`index-HPBXNwnC.js`). New Vercel tip from the docs deploy.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `a1ccafe` | clean after lock commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `1e546d61` | clean; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-9ijik4t7p-menuply.vercel.app`
- Bundle: `index-HPBXNwnC.js` (unchanged from `37tsmprgc`)
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: Railway `60` vs `localhost:3001` `9`

## BE health

- Shipped SHA: `1e546d6171b8400bd8a4a05657c9b51ffa6ea6a0`
- Railway `/health` `commit_hash`: **MATCH**
- GitHub auto-deploy SUCCESS (`e95a34a0-6bd6-4d1b-b8c8-f8768a01b642`)

## Database

None. No migrations.

## Prior tip (restore if needed)

`menubloc-frontend-37tsmprgc-menuply.vercel.app` / `index-HPBXNwnC.js` (same JS; guest open reporting)
