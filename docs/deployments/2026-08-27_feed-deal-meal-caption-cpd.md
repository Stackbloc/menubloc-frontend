# CPD — Feed deal meal-time filters + Lunch Deal caption (2026-08-27)

## Summary

Shipped operator deal video upload, meal-period multi-select, optional meal-time swipe caption (e.g. Lunch Deal), Feed → Deals filters, restaurant/guest feed video creators, and operator feed-video compose.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE feature | menubloc-frontend-main | main | `c712ce3` | — |
| FE tip-lock docs | menubloc-frontend-main | main | `cf36d87` | tip-gate PASS |
| BE feature | menubloc-backend-main | main | `d6c3244a` | health `d6c3244a` |
| BE LKG mirror | menubloc-backend-main | main | `868ae3f5` | — |

## Production tip

- Deployment: `menubloc-frontend-h9500z950-menuply.vercel.app`
- Bundle: `index-BBDgXfrc.js`
- Tip-gate: PASS apex + www
- Prior tip: `menubloc-frontend-6pp1jutcs-menuply.vercel.app` / `index-B4AF_DS5.js`

## Verify

1. https://menuply.com/feed → **Deals** → meal filter chips + swipe reel
2. Operator `/operator/deals` → meal times + “Show meal time caption” + deal video upload
3. `GET /deals?city=Los%20Angeles&state=CA&has_video=1&meal_period=lunch` → `ok: true`
4. Railway `/health` → `commit_hash` starts with `d6c3244a`

## Migrations (BE)

Apply on production if not auto-run: `0294`, `0295`, `0296` (guest/restaurant feed creators, `show_meal_time_caption`).

## Rollback

Prior tip `6pp1jutcs` / `index-B4AF_DS5.js`. BE prior `1aaf4dd4`.
