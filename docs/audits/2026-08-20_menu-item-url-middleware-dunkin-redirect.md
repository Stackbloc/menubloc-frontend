# Summary

Blank / wrong screens on consumer menu-item URLs like `/restaurants/{slug}/menu-items/{id}` were caused by Vercel SEO `middleware.js` mis-classifying those paths as canonical 3-segment restaurant profiles (`/:state/:city/:slug`). When the numeric item id also exists as a `restaurants.id`, Edge issued a **301 to the wrong restaurant** (e.g. In-N-Out Double-Double → Dunkin' Knoxville).

# Problem Statement

Reported blank/broken screens:

- https://menuply.com/restaurants/fixins-soul-kitchen-los-angeles/menu-items/457052
- https://menuply.com/restaurants/in-n-out-burger-3/menu-items/24862

Backend `GET /menu-items/:id` returns `ok:true` for both. Bare `/menu-items/24862` SEO title is correct (`Double-Double at In-N-Out Burger`).

# Root Cause

`CANONICAL_PROFILE_RE = /^\/restaurants\/([^/]+)\/([^/]+)\/([^/]+)\/?$/` matches:

`/restaurants/in-n-out-burger-3/menu-items/24862`

as:

| capture | value |
|---------|--------|
| state | `in-n-out-burger-3` |
| city | `menu-items` |
| slug | `24862` |

Middleware then calls `/public/meta/restaurants/24862`, which is **Dunkin' Knoxville** (`dunkin-knoxville-tn-36-017-83-827`), and **301 redirects** there.

Fixins (`457052`) does not collide with a restaurant id → meta miss → fallthrough SPA shell (default homepage meta). Client may still look broken for other reasons, but the In-N-Out case is a hard wrong redirect.

Not caused by photo hydration (`72c80f99`) or search place-scope.

# Evidence Collected

```
GET /menu-items/24862 → ok, Double-Double @ In-N-Out
GET /public/meta/restaurants/24862 → Dunkin' Knoxville TN
HEAD /restaurants/in-n-out-burger-3/menu-items/24862 → 301 Location: /restaurants/tennessee/knoxville/dunkin-knoxville-tn-36-017-83-827
HEAD /menu-items/24862 → 200, x-seo-middleware: injected, correct title
```

# Files Examined

- `menubloc-frontend-main/middleware.js`
- `MenuItemDetailPage.jsx` (load path OK)
- Live BE `/menu-items/24862`, `/menu-items/457052`, `/public/meta/restaurants/24862`

# Changes Made

- Match `/restaurants/:slug/menu-items/:id` **before** 3-segment profile handling; inject menu-item SEO (same as `/menu-items/:id`).
- Guard: if profile regex city segment is `menu-items`, pass through.
- Contract test: `test/middlewareRestaurantMenuItemPathContract.test.js`

# Commits

Local only (not committed / not deployed in this turn).

# Deployment Status

**NOT LIVE** until FE CPD from `menubloc-frontend-main` @ clean `main`.

# Verification Results

- Contract test: `node test/middlewareRestaurantMenuItemPathContract.test.js` (run locally after edit)
- Post-deploy: `curl -sI` In-N-Out menu-item URL must be **200** (not 301 to Dunkin); title/meta for Double-Double; page renders

# Remaining Risks

- Fixins blank may still have a separate client render issue after middleware fix — re-check after deploy.
- Any other reserved middle segments (`menu`, etc.) should stay out of false profile matches.

# Follow-Up Work

1. CPD FE middleware fix.
2. Re-probe both reported URLs.
3. Optional: continue photo-hydration latency isolation separately (photos were ~60–80ms; not this blank-screen bug).

# Final Verdict

**Confirmed SEO middleware false match.** In-N-Out menu-item URLs 301 to Dunkin when item id == restaurant id. Fix is path-order + guard in `middleware.js`; requires FE production deploy.
