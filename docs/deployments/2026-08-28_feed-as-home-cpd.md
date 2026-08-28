# CPD — Feed default home at `/` (2026-08-28)

## Summary

Made the existing Feed shell the default Menuply home at `/` using **unchanged** `FeedPrimaryNav` targets (`/feed`, `/feed/search`, etc.). HomeNext preserved at `/home-next`. Roll back with `VITE_FEED_AS_HOME=0`.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `273a4bc` | tip-gate PASS |
| BE | — | — | unchanged `d6fbe236` | n/a (FE-only) |

## Production tip

- Deployment: `menubloc-frontend-ejhmbjzgh-menuply.vercel.app`
- Bundle: `index-F4Sczbnh.js`
- Tip-gate: **PASS** apex + www
- Prior tip (rollback): `menubloc-frontend-ap4k566u0-menuply.vercel.app` / `index-Byyw8VK4.js`

## Code changes (FE `273a4bc`)

- `featureFlags.js` — `isFeedAsHomeEnabled()` defaults true; opt-out `VITE_FEED_AS_HOME=0`
- `HomeRoot.jsx` — `/` → `FeedShellPage` + `FeedHomePage`
- `FeedPrimaryNav.jsx` — nav paths unchanged; Home tab also active on `/`
- `feedShellContract.test.js` — feed-as-home contract assertions

## Verify

1. https://menuply.com/ — Feed shell + `feed-primary-nav`
2. Feed nav Search → `/feed/search`
3. https://menuply.com/home-next — HomeNext preserved
4. https://menuply.com/feed — parallel route unchanged

## Rollback

Alias prior tip `ap4k566u0` / `index-Byyw8VK4.js` or rebuild with `VITE_FEED_AS_HOME=0`.
