# Consumer Share Menuply URL Contract

**Established:** 2026-08-14  
**Incidents:** Recurring `share.google` / non-Menuply links when sharing menus (OS native share wrap; `window.location.origin` as share origin). Prior restores: 2026-08-03 Copy Link modal (`f2a6884`); 2026-08-12 invite ShareModal (`6c6b5b8`).

## Hard rule

**Every consumer share payload URL must be an absolute `https://menuply.com/...` canonical path.**

- Copy Link is the primary share action (in-app ShareModal).
- Never auto-call `navigator.share` from ShareButton click.
- Never use `window.location.href` or `window.location.origin` as the consumer share URL (except localhost-only local smoke inside `getPublicOrigin`).
- Reject / normalize away `share.google` and other non-Menuply hosts before clipboard or device share.

## Never implement without explicit current-turn approval

- Reintroduce ShareButton click → `navigator.share` / OS sheet first
- Resolve share origin from `window.location.origin` or arbitrary `VITE_PUBLIC_APP_URL` for production share payloads
- Remove or weaken `npm run test:share-contract` assertions
- Share food-truck profile via `window.location.href`

## Required patterns

- Builders in `shareUtils.js`: `absoluteCanonicalUrl` / `CANONICAL_ORIGIN` + `normalizeConsumerShareUrl`
- ShareModal Copy Link + preview use normalized menuply URL
- Gate: `npm run test:share-contract` in `menubloc-frontend`

## Before editing protected files

Output:

> **Per Consumer Share Menuply URL Contract: the proposed change will modify [names] and may emit non-menuply.com or share.google share links. Explicit approval required.**

Then stop until approved.

## Mandatory on task completion (when protected files change)

> ☐ SHARE URL CERTIFICATION: Consumer share URLs [menuply.com locked | not touched]; `test:share-contract` [pass | not run — reason].

Protected: `shareUtils.js`, `ShareButton.jsx`, `ShareModal.jsx`, `FoodTruckPage.jsx` (share path), `test/shareCopyLinkModalContract.test.js`, `test/shareCanonicalUrlContract.test.js`.
