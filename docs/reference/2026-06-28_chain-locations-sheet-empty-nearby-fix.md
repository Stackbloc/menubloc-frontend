# Chain Locations Sheet — Empty “Other nearby locations” Fix

**Date:** 2026-06-28  
**Branch:** `stabilize/frontend-safe-baseline` (menubloc-frontend)  
**Symptom:** Tapping “X locations nearby” on a franchise discovery card (e.g. McDonald’s in Dothan, AL) opened the bottom sheet with **“No other locations found nearby.”** despite `location_count` showing 5–16 on the card.

---

## Root cause

`ChainLocationsSheet.jsx` built the `/chains/:id/locations` query from **both**:

1. **Card market** — `marketCity` / `marketState` from the browse card (correct, e.g. `Dothan, AL`)
2. **Session geo** — `sessionStorage` key `grubbid.discovery.geo` (often **stale**, e.g. Los Angeles coords from a prior visit)

Backend (`GET /chains/:chainId/locations` in `menubloc-backend/src/routes/publicChains.js`):

- With explicit `city` + `lat`/`lng`, SQL scopes to the city **and** applies a geo radius on rows that have coordinates.
- Dothan restaurants with lat/lng are **not** within 25 mi of LA → **0 rows**.

### Production API proof (McDonald’s chain_id=1)

| Query | Result |
|-------|--------|
| `city=Dothan&state=AL` | 13 locations |
| `city=Dothan&state=AL&lat=31.22&lng=-85.39&radius_miles=25` | 13 locations |
| `city=Los Angeles&state=CA&lat=31.22&lng=-85.39&radius_miles=25` | **0** locations |
| `city=Dothan&state=AL&lat=34.05&lng=-118.24&radius_miles=25` | **0** locations |

Prior partial fix (`c6cd2b7`): pass `marketCity`/`marketState` from `DiscoveryCard` / `FeaturedDiscoveryCard`. **Insufficient alone** — sheet still appended stale session geo.

---

## Fix (2026-06-28)

**File:** `menubloc-frontend/src/components/discovery/ChainLocationsSheet.jsx`

**Rule:**

1. If card provides `marketCity` → use **city/state only**; **do not** send session geo.
2. Else if session geo exists → **geo-only** (omit stale session city label).
3. Else → session city/state label.

**Do not** combine card city with unrelated session geo.

---

## Related files

| File | Role |
|------|------|
| `menubloc-frontend/src/components/discovery/ChainLocationsSheet.jsx` | Sheet + fetch params |
| `menubloc-frontend/src/components/discovery/DiscoveryCard.jsx` | Passes `marketCity={menu?.city}` |
| `menubloc-frontend/src/components/discovery/FeaturedDiscoveryCard.jsx` | Same |
| `menubloc-backend/src/routes/publicChains.js` | `GET /chains/:chainId/locations` |
| `menubloc-backend/src/services/search/franchiseMarketScope.js` | Franchise-aware city clause |

**Separate path:** `PublicMenuPage.jsx` `FranchiseLocationSheet` uses `franchise_group.locations` from the menu API — not this chains endpoint.

---

## Verification

1. Set browse to **Dothan, AL** (or geo near Dothan with stale LA in sessionStorage).
2. Open home/discovery feed; tap **“N locations nearby”** on McDonald’s or Chick-fil-A.
3. Sheet should list other stores with addresses (not empty state).

**API probe:**

```bash
curl "https://menubloc-backend-production.up.railway.app/chains/1/locations?city=Dothan&state=AL&exclude_restaurant_id=71379"
# expect 10+ locations
```

**Regression:** LA metro with card `city=Los Angeles` and no geo param should still return LA-area stores.

---

## Session storage keys (frontend)

- `grubbid.discovery.geo` — `{ lat, lng }` from browser geolocation
- `grubbid.discovery.location` — human label, e.g. `"Los Angeles, CA"` (can be stale)

Browse feed may use geo-only params while session label remains from a prior market — always prefer **card city/state** for franchise location sheets.

---

## Deployment

Frontend-only fix. Deploy menubloc-frontend via Vercel `--prod` + `vercel alias set <deployment-url> menuply.com`.

| Field | Value |
|-------|-------|
| Commit | `a3b588b` on `stabilize/frontend-safe-baseline` |
| Deployed | 2026-06-28 |
| Vercel URL | `https://menubloc-a9471l17v-menuply.vercel.app` |
| Production alias | `https://menuply.com` |
| Bundle hash | `index-CsEg9BJ4.js` |

---

## Final verdict

**Fixed** when card market is sent without conflicting session geo. Empty sheet was a **client param bug**, not missing DB locations.
