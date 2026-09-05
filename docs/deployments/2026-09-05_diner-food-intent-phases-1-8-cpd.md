# CPD — Diner Food Intent Phases 1–8 (Meal Intel + Intent-Based Offers)

**Date:** 2026-09-05  
**Scope:** FE + BE  
**Result:** **CPD COMPLETE**

## Doors

| Door | Command / proof | Result |
|------|-----------------|--------|
| FE | `bash scripts/cpd-fe.sh "diner food intent Phases 1-8 Meal Intel Intent-Based Offers"` | `RESULT=PASS` (apex + www tip-gate) |
| BE | `bash scripts/cpd-be.sh --no-push "verify diner food intent BE 40d88b5f migrations 0314-0317"` | `RESULT=PASS` |

## Tip / health

| Field | Value |
|-------|--------|
| FE path | `menubloc-frontend-main` @ `main` |
| FE feature commit | `80e4b0b7` (food intent UI + Waiter Meal Intel + Intent-Based Offers rename) |
| FE tip commit (live) | `34168dcc` (+ tip-lock docs `2f3fa578`) — same tip also includes Menu Manager Photos library multi-select |
| Deploy | `menubloc-frontend-r24tiadfu-menuply.vercel.app` |
| Bundle | `index-1wxm1YfC.js` |
| Tip-gate apex / www | `RESULT=PASS` |
| BE path | `menubloc-backend-main` @ `main` |
| BE commit / health | `40d88b5fcf78c824ba5cfe922c155b7875169a72` (match) |
| BE smoke | `RESULT=PASS passed=10` |

Note: an intermediate deploy `lf8xbmi6j` shared the same Vite content hash; tip was re-locked to `r24tiadfu` with the same bundle during the Photos-library FE CPD.

## Migrations (production)

Applied via `railway run node scripts/applyOneMigration.js … --allow-production`:

- `20260905_0314_diner_profile_identity_favorites.sql`
- `20260905_0315_want_food_interest_key.sql`
- `20260905_0316_ate_food_interest_key.sql`
- `20260905_0317_restaurant_meal_intel.sql`

## What shipped

1. Diner profile identity / favorites / discoverability  
2. What I Wanna Eat + discovery  
3. See What Others Nearby  
4. What I'm Eating + discovery  
5. Social Food Info (connects; not matching)  
6. Deals ≠ Meal Intel framing  
7a. Meal Intel on My Menuply + `GET /api/consumer/meal-intel`  
7b. Waiter additive Meal Intel in `/briefing`  
8. Restaurant Meal Intel create/publish (`restaurant_meal_intel`)  
9. Product rename: Bid-Free → **Intent-Based Offers** (`/operator/intent-based-offers`)

## Live probes (agent)

```
health_commit=40d88b5fcf78c824ba5cfe922c155b7875169a72
RESULT=PASS passed=10   # cpd-be production smoke
GET /api/consumer/meal-intel → 401 not_signed_in (route live; auth gate expected)
tip-gate menuply.com / www → RESULT=PASS (r24tiadfu / index-1wxm1YfC.js)
```

## Hitchhikers excluded

Subscription Designer, SEO video/sitemap, signup/SD, and unrelated Menu Manager WIP were stashed and **not** included in food-intent commits.

## Related docs

- `docs/architecture/2026-09-05_deals-vs-meal-intel-separation.md`
- `docs/architecture/2026-09-05_meal-intel-phase7.md`
- `docs/handoffs/2026-09-05_meal-intel_phase7b8_handoff.md` (if present)
- Photos tip note (same tip): `docs/deployments/2026-09-05_owner-menu-upload-photos-library-cpd.md`

## Human verify

- My Menuply: profile fields, Wanna Eat, Eating, Meal Intel  
- `/waiter`: Meal Intel additive (no Waiter redesign)  
- Operator: Intent-Based Offers route + redirects from bid-free / limited-audience  
- Owner: restaurant Meal Intel create/publish  
