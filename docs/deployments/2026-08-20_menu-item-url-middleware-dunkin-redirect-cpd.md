# CPD — Menu-item URL middleware Dunkin redirect (2026-08-20)

## Summary

SEO Edge middleware mis-parsed `/restaurants/{slug}/menu-items/{id}` as `/:state/:city/:slug`, causing 301 to the wrong restaurant when the item id matched a `restaurants.id` (In-N-Out Double-Double → Dunkin' Knoxville).

## Deploy

| Layer | Path | Branch | Commit |
|-------|------|--------|--------|
| FE | `menubloc-frontend-main` | `main` | (this CPD) |
| BE | unchanged | — | live `d49d3edd` |

## Verify

1. `curl -sI https://menuply.com/restaurants/in-n-out-burger-3/menu-items/24862` → **200**, not 301 to Dunkin
2. Page renders Double-Double detail
3. Tip-gate PASS apex + www

## Rollback

Restore prior tip `hzqhp15u6` / `index-DZq-yI_T.js` (pre–middleware path fix).
