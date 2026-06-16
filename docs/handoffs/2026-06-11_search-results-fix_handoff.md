# Handoff: Search Results Fix
**Date:** 2026-06-11  
**Status:** INCOMPLETE — search still showing wrong/incomplete results  
**Repo:** `menubloc-frontend-main` (worktree of `menubloc-frontend`)

---

## Objective
Fix search results page so it correctly shows all restaurants (franchise and non-franchise) for food queries like "burger" and "burgers" in both Dothan AL and Los Angeles CA.

---

## Current Status
Search is deployed and no longer crashes, but the user reports results are still wrong:
- Dothan "burger": user says only franchise results show (Wendy's, Five Guys, Burger King) — but the backend returns Toasted Yolk Cafe as row 0, KBC Butcher Block as row 1
- LA "burgers": was showing Applebee's Family Bundle repeated across 11 locations; deduplication was added but user says still wrong

**Root cause of remaining failure is NOT confirmed.** The backend returns correct results. Something in the frontend rendering pipeline is suppressing or reordering them unexpectedly.

---

## Git State

### Branch: `main`
**4 commits ahead of `origin/main`** (not pushed):
```
fc4045b  fix: Waiter nav icon same size as other icons (22px, inline)
b73280e  fix: resolve cardVerdict ReferenceError crashing search results render
2bd79aa  fix: Waiter icon floats above nav bar without pushing other tabs down
0fd8d59  fix: align BottomNav tabs and add search page bottom padding
```

### Uncommitted changes (deployed to Vercel but NOT committed to git):
- `src/components/BottomNav.jsx` — Waiter icon size bumped to 40px
- `src/components/SearchResultCard.jsx` — CardVerdictBox removed
- `src/pages/GrubbidSearchResults.jsx` — `deduplicateFranchiseItems` added

### Last known good commit per CLAUDE.md: `022aed5`

---

## Backend Verified Facts (do not re-derive)

All verified via direct `curl` against `https://menubloc-backend-production.up.railway.app`.

### Dothan burger search
```
GET /search?q=burger&city=Dothan&state=AL&limit=15
```
Returns 11 results. Row order:
1. `item | The Toasted Yolk Cafe | The Yolk Classic Burger` (menu_item_id: 13333)
2. `item | KBC Butcher Block | KID'S BURGER` (menu_item_id: 14849)
3. `item | Wendy's | Jr. Cheeseburger Deluxe`
4. `item | Five Guys | Hamburger Patty`
5. `item | McDonald's | Quarter Pounder with Cheese`
6. `item | Burger King | Bacon King`
7. `item | Wendy's | Jr. Bacon Cheeseburger`
8. `item | Wendy's | Dave's Triple`
9. `restaurant | Burger King #3345`
10. `restaurant | Burger King #3610`
11. `restaurant | Five Guys Burgers And Fries`

`search_meta.suppress_menu_items: false`  
`search_meta.restaurant_oriented: false`  
`search_meta.geo_mode: "market_fallback"`  

### LA burgers search (lat/lng)
```
GET /search?q=burgers&lat=34.02173...&lng=-118.28382...&city=Los+Angeles&state=CA
```
Returns 25 results. Top items: McDonald's, Yard House, Wendy's, Burger King — **no Applebee's at this radius**.

With `radius_miles=50`:
Returns **only** Applebee's "Cheeseburgers, Family Bundle" from 11 LA-area locations (Signal Hill, Norwalk, Montebello, Lakewood, La Habra, Inglewood, City of Industry, Chatsworth, Bell Gardens, Alhambra, Dothan). All score: 0, match_reason: "Fallback text match: burgers". This is a backend ranking/deduplication issue.

### Applebee's data
- Applebee's exists in the backend as `row_type: restaurant` records only (no menu items in CK)
- "Cheeseburgers, Family Bundle" IS a real Applebee's item in `public.menu_items` across franchise locations
- It appears in search only when radius is large enough to include Signal Hill/Norwalk (outside central LA)
- Searching `?q=applebees&city=Los+Angeles&state=CA` → total: 0 (no menu items for LA Applebee's)

---

## Files Changed This Session

### `src/components/SearchResultCard.jsx` (PROTECTED — needs approval doc)

**Problem found:** `cardVerdict` was referenced at line ~1458 (`<CardVerdictBox label={cardVerdict} />`) but never declared. This caused `ReferenceError: cardVerdict is not defined` on every render, crashing the entire search page to a black screen.

**Prior state (commit `db0422d`, June 10 9:57am):** Tried to remove `CardVerdictBox` from search cards entirely. Removed the import and function definition but left the `<CardVerdictBox label={cardVerdict} />` render in place — incomplete removal caused the crash.

**Fix applied (commit `b73280e`):** Added `resolveCardVerdict` back to import + added `const cardVerdict = resolveCardVerdict(row)` declaration. This stopped the crash but left the `CardVerdictBox` rendering on every card with `position: sticky, zIndex: 2`.

**Second fix (UNCOMMITTED):** Properly removed all CardVerdictBox remnants:
- Removed import: `getCardVerdictTone, resolveCardVerdict`
- Removed function: `CardVerdictBox({ label })`
- Removed variable: `const cardVerdict = resolveCardVerdict(row)`
- Removed render: `<CardVerdictBox label={cardVerdict} />`

Approval doc exists: `docs/search-compare-change-approval.md`

### `src/pages/GrubbidSearchResults.jsx`

**Added `deduplicateFranchiseItems(rows)` function (UNCOMMITTED):**
```js
function deduplicateFranchiseItems(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const itemName = String(row?.item_name || row?.menu_item_name || "").trim().toLowerCase();
    const restName = String(row?.restaurant_name || "").trim().toLowerCase();
    if (!itemName || !restName) { out.push(row); continue; }
    const key = `${restName}||${itemName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}
```
Applied at: `const resultRows = deduplicateFranchiseItems(normalizeRows(json));`

This collapses same restaurant + same item name to one occurrence. Verified it reduces 11× Applebee's Family Bundle to 1×.

### `src/components/BottomNav.jsx` (UNCOMMITTED)
- Waiter icon: `iconSize: 40` (up from 22px)
- Nav padding: `"3px 0 env(safe-area-inset-bottom, 4px)"`
- Tab padding: `"1px 8px"`, gap: 1

---

## What Is Still Broken

### 1. Dothan shows only franchise results (UNRESOLVED)
Backend returns Toasted Yolk as row 0, KBC Butcher Block as row 1. Frontend should display them first. They are `isDishRow = true` (have `menu_item_id`). `suppress_menu_items: false`. `useRestaurantGroupedRendering` should be false. Yet user sees only franchise results.

**Unconfirmed suspects:**
- Active `?waiter=` URL param restoring a waiter selection that filters to franchise items only
- Active diet filter (vegan, GF, etc.) that non-franchise items don't pass
- A rendering exception in `SearchResultCard` for specific rows (non-franchise items may have different/missing `chips` data that triggers an error inside a card, silently dropping it)

**How to verify:** Open browser DevTools → Console → search for "burger" in Dothan → look for per-card exceptions (not caught by error boundary). Also check the URL bar for `?waiter=` param.

### 2. Waiter selection state persistence
The waiter selection (`?waiter=X`) persists in the URL and is restored after results load (lines 1427–1438 in `GrubbidSearchResults.jsx`). If the user has a stale `?waiter=` param pointing to a "fast food" or franchise-specific option from a previous search session, it silently filters out all non-franchise results. The reset logic at line 1409 clears waiterSelection when `q/city/state/zip/near` changes, but the `?waiter=` URL param might not be cleared in the browser before the reset fires.

### 3. Backend franchise ranking (backend issue — not fixable from frontend)
Applebee's scores `0` on burger searches and matches only via "Fallback text match". Despite score=0, 11 identical franchise locations flood results when radius > ~25 miles. Backend needs deduplication at the search service level (keep only 1 result per chain per unique item name).

---

## Key Frontend Logic Reference

### Result filtering pipeline (GrubbidSearchResults.jsx)
```
fetch → normalizeRows → deduplicateFranchiseItems → setRows(resultRows)
  ↓
waiterFilteredRows = waiterSelection ? filter(rows, waiterSelection.test) : rows
  ↓
dishRows = waiterFilteredRows.filter(isDishRow)        // items with menu_item_id
restaurantOnlyRows = waiterFilteredRows.filter(!isDishRow)  // no item_name
  ↓
useRestaurantGroupedRendering = suppress_menu_items || (restaurantIntent && dishRows.length === 0)
  ↓
visibleDishRows = useRestaurantGroupedRendering ? [] : dishRows
```

### `isDishRow(x)`
```js
return !!(x?.menu_item_id || x?.menu_item_name || x?.item_name);
```

### `useRestaurantGroupedRendering` (line 1819)
```js
const useRestaurantGroupedRendering = !!(
  searchMeta?.suppress_menu_items ||
  (restaurantIntent && dishRows.length === 0)
);
```
For "burger" query: `suppress_menu_items=false`, `restaurantIntent=false` → should be `false` → dish rows should show.

### Waiter filter restore (lines 1427–1438)
```js
useEffect(() => {
  if (loading || waiterRestoredRef.current) return;
  const targetId = new URL(window.location.href).searchParams.get("waiter");
  if (targetId) {
    const match = waiterState.options.find((o) => o.id === targetId);
    if (match) setWaiterSelection(match);  // only restores if option exists in current results
  }
  waiterRestoredRef.current = true;
}, [loading, waiterState.options]);
```

---

## Remaining Work

1. **Confirm root cause of Dothan-only-franchise display** — open DevTools on live search, check console for per-card render errors, check URL for `?waiter=` param
2. **Commit the uncommitted changes** (BottomNav, SearchResultCard cleanup, deduplication) — note SearchResultCard needs approval doc (already exists at `docs/search-compare-change-approval.md`)
3. **Backend fix** — search service needs to deduplicate same-item same-chain results before returning; score=0 fallback matches should not outrank real scored results from independent restaurants
4. **Apply migration** `20260610_0125_consumer_foods_to_avoid.sql` to production Supabase (Foods I Avoid feature for authenticated users)

---

## Resume Instructions

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
git status   # 3 uncommitted files
git log --oneline -8

# Verify backend still returns Toasted Yolk first for Dothan:
curl "https://menubloc-backend-production.up.railway.app/search?q=burger&city=Dothan&state=AL&limit=5"

# Check what user actually sees in browser — need DevTools console output
# and the exact URL including any ?waiter= param
```

The frontend is already deployed (`npx vercel --prod --yes` was run). Changes are live but uncommitted.

---

## Deployment
- **Frontend:** Vercel — `menuply.com` / `grubbid.com`  
- **Backend:** Railway — `menubloc-backend-production.up.railway.app`  
- **DB:** Supabase PostgreSQL
