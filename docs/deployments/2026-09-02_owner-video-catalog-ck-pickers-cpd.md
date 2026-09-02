# CPD — Owner Video Catalog CK pickers (2026-09-02)

## Summary

Video Catalog metadata editor now uses CK-backed search-to-select pickers for restaurant and menu item — no manual menu-console free text.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `676a7a84` (feature) | tip-gate PASS |
| FE lock | menubloc-frontend-main | main | pending docs commit | tip-gate PASS |
| BE | menubloc-backend-main | main | `cd7d44a2` | health (unchanged) |

## Production tip

- Deployment: `menubloc-frontend-hhitsstxt-menuply.vercel.app`
- Bundle: `index-QyMsp1rQ.js`
- Tip-gate: PASS apex + www
- CPD: `bash scripts/cpd-fe.sh "owner video catalog CK pickers"`

## Verify

1. Owner login → **Platform → Video Catalog** (`/owner/videos`)
2. Open a video → restaurant field shows search-to-pick (not editable name text when selected)
3. Pick restaurant from CK hits → pick menu item from CK hits at that restaurant
4. Save → list shows linked restaurant/menu names from CK ids

## Rollback

Prior tip: `menubloc-frontend-7z8o3x99g-menuply.vercel.app` / `index-Bno4VH6H.js`
