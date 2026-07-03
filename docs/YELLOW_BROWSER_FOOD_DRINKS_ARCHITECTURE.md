# Yellow Browser — Food / Drinks Architecture

**Date:** 2026-07-03  
**Scope:** Yellow Browser (`/browse-menus`) only — no search, home, routing, or Waiter changes.

---

## Food browser lock (critical)

Food mode is **locked**. The following are unchanged from the pre-Drinks Yellow Browser:

| Surface | Food behavior |
|---------|----------------|
| URL | No `mode` query param (absent = Food) |
| API | No `browse_mode` param on `/menus/browse` |
| Categories | `MENU_CATALOG_TABS` — same 7 tabs, same IDs, same order |
| `MenuCatalogCategoryTabs.jsx` | Restored to original implementation |
| `menuBrowserService.js` | Restored — no mode branching |
| `runBrowsePipeline` | Restored — identical food pipeline |
| Page-turning / renderer / pagination | Unchanged |

### Before / after (Food)

| Check | Before | After (Food selected) |
|-------|--------|------------------------|
| Default URL | `?section=nearby&i=0` | Same (no `mode` param) |
| API params | `browse_section`, location, limit, offset | Identical — no `browse_mode` |
| Category tabs | Nearby, American, Asian, Italian, Mexican, Dine In, QSR | Same |
| Category component | `MenuCatalogCategoryTabs` | Same component, same props |
| Menu renderer key | `{section}-{restaurant_id}-{index}` | Same |
| Backend filter | `filterAndRankForBrowseSection` (restaurant-level) | Same function, same signature |

**Only additive UI for Food:** `MenuCatalogModeTabs` appears above the existing category tabs. FOOD is selected by default. Everything below the mode tabs in Food mode uses the original code paths.

Drinks mode is isolated:
- URL: `?mode=drinks&section=cocktails&i=0`
- API: adds `browse_mode=drinks`
- Pipeline: `runDrinksBrowsePipeline` + `menuBrowserDrinksService.js`
- Tabs: `MenuCatalogDrinkCategoryTabs` (separate component)

---

The Yellow Browser now supports two primary browsing modes — **Food** and **Drinks** — using one shared catalog reader. Mode selection sits above category tabs. Food mode preserves the existing page-turning experience and food category tabs. Drinks mode swaps in beverage category tabs and uses lightweight item-level classification to decide which restaurants appear in each section.

---

## UI Flow

```
┌─────────────────────────────────────┐
│ StickyPageHeader (unchanged)        │
├─────────────────────────────────────┤
│         Yellow Browser              │
│         FOOD  |  DRINKS             │  ← MenuCatalogModeTabs (new)
├─────────────────────────────────────┤
│ [Nearby][American][Asian]…          │  ← MenuCatalogCategoryTabs (mode-aware)
├─────────────────────────────────────┤
│                                     │
│   Page-turning menu viewer          │  ← CatalogMenuRenderer (unchanged UX)
│   (swipe / arrows / Menu N of M)    │
│                                     │
├─────────────────────────────────────┤
│ BottomNav (unchanged)               │
└─────────────────────────────────────┘
```

### URL state (query params only — no route change)

| Param | Values | Purpose |
|-------|--------|---------|
| `mode` | `food` (default), `drinks` | Active browser mode |
| `section` | mode-specific category id | Active category tab |
| `i` | integer | Menu index in sequence |
| `city`, `state` | strings | Location scope (unchanged) |

Switching mode resets `section` to the mode default (`nearby` for food, `cocktails` for drinks) and `i` to `0`.

### Food mode categories (preserved)

`nearby`, `american`, `asian`, `italian`, `mexican`, `dine_in`, `qsr`

### Drinks mode categories (new)

`cocktails`, `beer`, `wine`, `spirits`, `coffee`, `tea`, `smoothies`, `juice`, `soft_drinks`, `mocktails`

---

## Browser Architecture

Food and Drinks are **two browser engines** sharing one rendering system.

| Shared | Mode-specific |
|--------|----------------|
| `BrowseMenus.jsx` page shell | Category tab definitions |
| `useMenuCatalogSequence` pagination | `browse_mode` API param |
| `CatalogMenuRenderer` menu display | Classification / retrieval rules |
| Swipe, arrow keys, intro splash | Default section per mode |
| Location resolution | Category registry lookup |
| Restaurant cards | Item pre-filter (drinks only) |

### Frontend modules

| File | Role |
|------|------|
| `lib/menuBrowserModes.js` | Mode constants + normalization |
| `lib/menuCatalogCategories.js` | Food + drink tab registries |
| `components/menuCatalog/MenuCatalogModeTabs.jsx` | FOOD \| DRINKS header control |
| `components/menuCatalog/MenuCatalogCategoryTabs.jsx` | Mode-aware category chips |
| `lib/menuCatalogBrowseLocation.js` | Passes `browse_mode` to API |

### Backend modules

| File | Role |
|------|------|
| `lib/menuBrowserModes.js` | Mode normalization + defaults |
| `lib/menuBrowserCategories.js` | Food section registry (unchanged data) |
| `lib/menuBrowserDrinkCategories.js` | Drinks section registry + `mks_slot` metadata |
| `lib/menuBrowserDrinkClassifier.js` | MVP item-level drink classification |
| `services/discovery/menuBrowserService.js` | Mode-aware category resolve + filter orchestration |
| `services/discovery/discoveryService.js` | Drinks item pre-filter in `runBrowsePipeline` |

### API contract

`GET /menus/browse` accepts:

- `browse_section` / `section` — category id
- `browse_mode` / `mode` — `food` | `drinks`

`GET /api/meta/menu-browser/categories?mode=drinks` returns drink categories.  
`GET /api/meta/menu-browser/modes` returns available modes.

---

## Classification Strategy (MVP)

Drinks mode does **not** require a complete beverage database. Classification uses existing menu fields:

- `section_name` / `section`
- `item_name` / `name`
- `description`
- `restaurant_name`, `cuisine` (venue context)

### Pipeline (drinks mode)

1. Fetch menu items for location (same as food).
2. Apply dietary / allergen evaluation (unchanged).
3. **Pre-filter items** to those matching the active drink section (`filterMenuItemsForBrowserSection`).
4. Group surviving items into restaurant cards (`groupByRestaurant`).
5. Rank cards using the section's configured ranking (`popular`, `nearby`, etc.).

A restaurant with food and cocktails appears in **both** modes because each mode applies its own filter to the same underlying item pool.

Food mode continues to use **restaurant-level** matching (`cuisine`, `category`, `name_hints`) via `rowMatchesCategory` — unchanged behavior.

### Classifier interface

```js
itemMatchesDrinkCategory(item, categoryDef) → boolean
classifyItemDrinkCategories(item) → string[]   // all matching drink section ids
filterItemsForDrinkSection(items, sectionId) → items[]
```

Keyword rules live in `menuBrowserDrinkCategories.js` per section (`sections`, `name_hints`, `restaurant_name_hints`, `cuisines`). No LLM inference. No search-service coupling.

---

## Future MKS Beverage Architecture Integration

Each drink category entry includes an `mks_slot` object:

```js
{ beverage_category: "cocktails" }  // maps to future canonical MKS beverage identity
```

**Migration path (not implemented in this task):**

1. MKS beverage identities populate `commonknowledge` (or dedicated beverage tables) with canonical fields: `beverage_category`, `cocktail_family`, `beer_style`, `wine_type`, etc.
2. `classifyItemDrinkCategories` gains a primary path: read canonical beverage identity from enriched menu item row.
3. Keyword rules in `menuBrowserDrinkCategories.js` become fallback for unclassified items.
4. Browser section IDs remain stable — only the classifier source of truth changes.

The MVP deliberately avoids:

- Duplicating search beverage intelligence (`searchService.js` / `computeBeverageIntelligence`)
- Building a parallel one-off drink ontology
- Mutating `CanonicalMenuItemRow`

---

## Restaurant Support Matrix

| Venue type | Food mode | Drinks mode |
|------------|-----------|-------------|
| Full-service (food + bar) | ✓ (cuisine/section) | ✓ (cocktail/beer items) |
| Coffee shop | ✓ (coffee cuisine tab in food registry) | ✓ (coffee items) |
| Bar / brewery | partial (cuisine hints) | ✓ (beer/spirits/cocktails) |
| Bakery | ✓ (food categories) | ✓ if coffee/smoothie items exist |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Weak drink keyword coverage → sparse drink tabs | Expand `name_hints` per section; future MKS identity |
| `coffee` id exists in both food and drink registries | Mode-aware `resolveBrowserCategory` disambiguates |
| Item names lack beverage signal (e.g. "House Special") | Section title + restaurant context hints; MKS later |
| Sponsored placements use food restaurant matching | Drinks mode skips restaurant-level sponsored filter (deals are food-oriented today) |
| Food tab set is catalog subset of full backend registry | Frontend tabs are curated; backend supports more sections via API |

---

## Deferred Capabilities

- Full MKS Beverage canonical identity on menu items
- Beverage nutrition, pairings, recommendations
- Drink-specific sponsored inventory
- Additional drink categories (seasonal drinks, cider, kombucha, etc.)
- Food category expansion to full spec list (Breakfast, Appetizers, Chicken, Salads, etc.) — can be added to `MENU_CATALOG_FOOD_TABS` without architectural change

---

## Verification

```bash
# Backend unit tests
cd menubloc-backend && node --test test/menuBrowserService.test.js test/menuBrowserDrinkClassifier.test.js

# Frontend build
cd menubloc-frontend && npm run build
```

Manual: open `/browse-menus`, switch FOOD ↔ DRINKS, confirm category tabs swap and page-turning behavior is unchanged.

---

## Files Changed

**Frontend:** `BrowseMenus.jsx`, `MenuCatalogModeTabs.jsx`, `MenuCatalogCategoryTabs.jsx`, `menuCatalogCategories.js`, `menuBrowserModes.js`, `menuCatalogBrowseLocation.js`, `useMenuCatalogSequence.js`, `labels.js`

**Backend:** `menuBrowserModes.js`, `menuBrowserDrinkCategories.js`, `menuBrowserDrinkClassifier.js`, `menuBrowserService.js`, `discoveryService.js`, `menuBrowserSponsoredService.js`, `menus.js`, `meta.js`, `menuBrowserDrinkClassifier.test.js`
