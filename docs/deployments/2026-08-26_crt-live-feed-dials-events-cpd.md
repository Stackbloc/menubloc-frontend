# CPD — CRT Live Feed dials + clickable My Events (2026-08-26)

## Summary

Live Feed CRT channel dials (ALL/EAT/WANT/PLAN/EVENT) with ≥44px finger targets; venue Events feed leg; whole-card crew/event navigation; diner social event detail page; BE kind filter + migration 0290 + GET `/api/consumer/social-events/:id`.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `5e88397` | tip-gate PASS |
| BE | menubloc-backend-main | main | `485532d1` | health `commit_hash` match |

## Production tip

- Deployment: `menubloc-frontend-cn4khcxk3-menuply.vercel.app`
- Bundle: `index-CSVYHrXa.js`
- Tip-gate: PASS apex + www
- Prior tip: `m9mch4bp1` / `index-Ckn_kipT.js`

## Verify

1. Hard-refresh `/my-menuply` — dial strip right of Live Feed CRT; tap ALL/EAT/WANT/PLAN/EVENT
2. Tap a My Events card (e.g. NFL Season Opening Party) → `/account/social-events/:id`
3. Tap a My Crews card → `/account/dining-crews/:id`
4. Bundle: `railway=59` / `localhost≤9`

## Rollback

Prior tip `menubloc-frontend-m9mch4bp1-menuply.vercel.app` / `index-Ckn_kipT.js`
