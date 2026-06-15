# GUARDRAIL: LOW-COST AUDIT-FIRST WORKFLOW

Objective:
Prevent speculative rewrites, unnecessary token/credit usage, production regressions, and architecture drift caused by agents implementing changes before understanding the existing system.

Mandatory workflow guardrail:
Agents MUST begin in the lowest-cost planning/audit mode available before making edits or implementations.

Examples:
- Claude → Plan Mode / audit-first mode
- Cursor → analysis/audit before edit mode
- Codex/agents → inspect/report before modifying files

Hard requirements:

1. Audit Before Edit
No implementation changes may begin until the agent:
- audits current architecture
- identifies affected routes/files/services
- identifies schema assumptions
- identifies environment variable dependencies
- identifies migrations required
- identifies frontend/backend contract dependencies
- identifies rollback risk
- identifies production risk

2. Report Before Implementation
Agent must produce a concise implementation report BEFORE editing files:
- current behavior
- root cause
- smallest safe fix
- exact files/routes affected
- whether deployment/migration required
- whether production env vars required

3. Smallest Safe Fix Guardrail
Agents must prefer:
- smallest safe fix
over:
- broad rewrites
- speculative refactors
- architecture replacement

No unnecessary rewrites of working systems.

4. No Production Push Without Verification
Before push/deploy:
- npm run build
- npm run test:routes
- npm run test:e2e (if applicable)
- route probe verification
- affected UI verification

Required route probes for backend changes:
- /api/orders/preview
- /api/orders/create-payment-intent
- /operator/auth/login
- /api/checkout/session
- affected feature routes

5. Route Contract Guardrail
Frontend may not reference routes/endpoints that do not exist in the backend route manifest.

Backend route contract tests are mandatory for:
- auth
- orders
- checkout
- menu editor
- food trucks
- similar/compare/search
- operator APIs

6. Shared Logic Guardrail
Agents may not create duplicate business logic systems for:
- food classification
- nutrition identity
- similar/compare identity
- menu item lineage
- auth/session resolution

Shared resolvers/services must be reused.

7. Feature Flag Guardrail
Optional systems must not affect unrelated runtime paths.

Examples:
- Apple auth
- Google auth
- experimental AI systems
- future delivery providers

Must be gated behind explicit ENABLE_* flags.

8. No Silent Startup Degradation
Production startup may:
- fail loudly for core required infrastructure
OR
- continue with explicit optional-feature warnings

Never:
"validation failed — continuing startup"
for core systems.

9. Branch Protection Guardrail
Agents must not push directly to production main branches for large or risky changes.

Use:
- feature/*
- fix/*
- staging

then merge after verification.

10. Concurrent Agent Guardrail
Before editing:
- inspect git status
- inspect uncommitted changes
- identify overlapping work

Agents must not overwrite or refactor active unrelated workstreams.

11. End-to-End Verification Guardrail
No feature may be marked fixed unless:
- frontend action works
- backend route exists
- backend logic succeeds
- database writes succeed
- production-like runtime verified

Local-only proof is insufficient.

12. Logging Guardrail
Critical systems must emit explicit logs for:
- route mounting
- rejected Similar/Compare candidates
- missing env vars
- startup validation
- route registration failures

Goal:
Reduce token waste, reduce regression frequency, prevent route drift, prevent architecture fragmentation, and stop agents from implementing speculative fixes without understanding the live Menuply architecture.

---

# Frontend Guardrails

---

## 🚀 DEPLOYMENT — VERCEL

**Platform:** Vercel (project: `andre-barber-s-projects/menubloc-frontend`, alias: `menuply.com`)

**Git push alone does NOT deploy to production.** Always run:
```bash
npx vercel --prod
```
from the `menubloc-frontend/` directory after pushing changes.

---

## ⛔ EXECUTION GATE — MANDATORY BEFORE ANY ACTION

AI may NOT write code, modify files, or run git commands UNTIL it outputs ALL of the following.
Missing section → STOP. Any baseline FAIL → STOP. No user approval on diff → STOP.

```
1. PRE-CHANGE STATE
   Frontend commit: [git log --oneline -1]

2. BASELINE RESULTS (all must be PASS)
   [ ] /                                           → loads, auto-detects location, plain text input only
   [ ] /browse-menus?city=Los+Angeles&state=CA     → LA restaurants only
   [ ] /browse-menus?city=Dothan&state=AL          → Dothan restaurants only
   [ ] /search?q=chicken&city=Los+Angeles&state=CA → returns results

3. CHANGE PLAN
   Category:       [ONE category]
   Files modified: [explicit list]
   What changes:   [one sentence]
   What stays same:[explicit list]

4. FULL DIFF shown → user approves → THEN apply
```

---

## Quick reference: protected files

- `src/pages/GrubbidDiscovery.jsx`
- `src/pages/BrowseMenus.jsx`
- `src/pages/GrubbidSearchResults.jsx`
- `src/lib/locationUtils.js`
- `src/hooks/useDietPreferences.js`

## Last known good commit: `022aed5`

## PRE-EXECUTION LOCK (enforced here)

Before touching any protected file, state all of the following or STOP:
1. Current commit hash: `git log --oneline -1`
2. Baseline page behavior confirmed (all 4 must pass)
3. Which ONE change category this is
4. Full diff shown and approved by user

## 🔒 DISCOVERY CHIP SCROLL GUARDRAIL

**Applies to:** Any change touching `GrubbidDiscovery.jsx` — including layout, sticky header, or feed structure changes.

The two `DiscoveryChipRow` chip rows (food categories + intelligence filters) MUST remain horizontally scrollable on BOTH mobile AND desktop. This is enforced by `.gb-discovery-chip-scroller` in `index.css`.

**Required after every GrubbidDiscovery.jsx change (before declaring done):**
```bash
npm run verify:discovery-chips
```
Must print: `verify:discovery-chips — chip row desktop scroll guard passed.`

If it exits 1 → STOP. Do not push. Fix the chip scroll regression first.

**What the guard checks:**
- `DiscoveryChipRow` uses `className="gb-discovery-chip-scroller"` — no inline `overflowX: auto`
- `index.css` defines `.gb-discovery-chip-scroller` with `flex-wrap: nowrap` and `overflow-x: auto`
- Mobile (`max-width: 768px`) block has `touch-action: pan-x`

**What the guard does NOT check (AI must verify manually):**
- Parent container structural changes (e.g. sticky header reorganization) that could clip or constrain the chip scroller
- Desktop scrollbar visibility — on desktop the native scrollbar is intentionally visible; do not suppress it outside the `max-width: 768px` block
- Any new wrapper divs inserted between the sticky header and `DiscoveryChipRow` that add `overflow: hidden`

**Hard rule:** Do NOT add `overflow: hidden` to any ancestor of `DiscoveryChipRow` without explicit user approval.

## Baseline pages (run before AND after every change)
```
/                                         → auto-detects location, plain text input only
/browse-menus?city=Los+Angeles&state=CA   → LA restaurants only, no Dothan
/browse-menus?city=Dothan&state=AL        → Dothan restaurants only, no LA
/search?q=chicken&city=Los+Angeles&state=CA → returns results
```

## 🔒 SESSION LOCATION PERSISTENCE — DO NOT CHANGE WITHOUT APPROVAL

In `GrubbidDiscovery.jsx`, `locationManuallySet` MUST be initialized from sessionStorage:

```js
const locationManuallySet = useRef(
  typeof window !== "undefined" && !!window.sessionStorage.getItem(SESSION_LOCATION_KEY)
);
```

**Never initialize it to `useRef(false)`.** That causes geo to overwrite the user's saved session location on every navigation. Any change to this ref's initialization or to the geo-overwrite `useEffect` requires explicit user approval.

---

## Discovery page location — ABSOLUTE RULES

The location input is a PLAIN TEXT FIELD. Never add:
- Autocomplete
- Dropdown
- API-backed city lookup
- Canonical location picker

`autoLocation.city` and `autoLocation.state` MUST flow to:
1. `buildSearchParams` (alongside lat/lng when no manual location is set)
2. Browse Menus button click (`?city=&state=` in the URL)

## URL contract — params that must never be silently removed
`city`, `state`, `lat`, `lng`, `radius_miles`

Any removal must be explicitly declared, explained, and approved.

## Rollback command
```bash
git revert HEAD && npm run dev
```

---

## CORE RULE — BEHAVIORAL CONTINUITY

No change is complete unless ALL previously working behavior continues to work.
This includes: search results, filters (ALL filters), location handling, browse behavior, UI outputs.
If any prior behavior breaks → the change is INVALID.

---

## 🚫 ARCHITECTURAL NON-INVENTION RULE (CRITICAL)

Do NOT:
- change filter logic structure
- bypass filter pipelines
- move filter evaluation order
- merge item-level and menu-level filters incorrectly
- remove or weaken filtering conditions

If unsure → STOP and ask.

---

## 🔒 FILTER PROTECTION RULE (CRITICAL)

Filters are **protected system behavior**: diabetic-friendly, vegan, vegetarian, gluten-free, low-carb, low-sodium, allergen filters.

Requirements:
1. Filters must work at BOTH item level AND menu/restaurant level
2. Menus with ZERO qualifying items MUST be removed
3. Item-level truth MUST NOT be overridden by keyword/template/weak inference fallback
4. No filter may be silently degraded

---

## 🧪 MANDATORY FILTER VERIFICATION (before declaring any change complete)

For ANY change touching search, discovery, filters, location, or ranking:

- Diabetic ON → only qualifying items/menus appear; menus with no qualifying items excluded
- Vegan ON → no non-vegan items appear
- Gluten-Free ON → no gluten items appear
- Filters ON vs OFF → DIFFERENT result sets (filters are not ignored)
- "chicken + diabetic near Los Angeles" → returns filtered results, not empty
- Known populated areas (LA, Dothan) → return data after any change

---

## 🧪 REQUIRED AI OUTPUT BEFORE APPLYING CHANGES

Must provide: exact files changed, what behavior is modified, why safe, filter integrity confirmed, test results summary.
If missing → DO NOT APPLY.

---

## FILTER vs RELEVANCE PRINCIPLE

Filters ALWAYS override relevance. A "better search result" that breaks filters is a regression, not an improvement.

---

## 🚨 SEARCH INTEGRITY GUARDRAIL

Any proposed change to the files or functions listed below **MUST** output this exact line before proceeding:

> **WARNING: THIS PROPOSED CHANGE VIOLATES THE SEARCH GUARDRAIL!**

Then state which invariant is at risk and get explicit user approval. If the invariant cannot be preserved → STOP.

---

### INVARIANT 3 — Browse feed must be hidden when `inlineError` is truthy

**File:** `src/pages/GrubbidDiscovery.jsx`

Both the feed count block and the feed cards MUST be suppressed when `inlineError` is non-empty:

```jsx
// Feed count — MUST include !inlineError guard
{!feedLoading && !inlineError && ( ... )}

// Feed cards — MUST include inlineError ? null branch
{feedLoading ? <skeleton /> : inlineError ? null : ...cards... }
```

Without this guard, stale or cross-market browse cards show beneath a "No results found" error, creating false cross-market leakage in the UI.
Trigger: any edit to the feed count block or feed ternary.

---

### INVARIANT 4 — Geo fallback must NOT fire when city/state is explicit

**File:** `src/pages/GrubbidSearchResults.jsx`
**Function:** `fetchSearch()` caller / `hasExplicitLocation` / geo-fallback block

`hasGeoFilter` MUST be `false` whenever `requestCity` or `requestZip` is set. The fallback re-fetch MUST NOT execute for city/state searches:

```js
const hasExplicitLocation = Boolean(requestZip || requestNear || (requestCity && !hasRouteCoords));
// hasGeoFilter is only true when !hasExplicitLocation
if (hasGeoFilter && fallbackUrl !== primaryUrl && ...) { /* must not fire for city queries */ }
```

Firing the fallback on an explicit city query silently returns results from a different market.
Trigger: any edit to `hasExplicitLocation`, `hasGeoFilter`, or the geo-fallback `if` block.

---

### INVARIANT 5 — `fetchSearch` must retain the `!json?.ok` check

**File:** `src/pages/GrubbidSearchResults.jsx`
**Function:** `fetchSearch()`

The check MUST remain intact:
```js
if (!res.ok || !json?.ok || hasDegradedEmptyResponse(json)) {
  throw new Error(json?.error || `HTTP ${res.status}`);
}
```

This is the enforcement contract for backend Invariant 1. Removing it would allow a backend response missing `ok: true` to silently render empty results with no error signal.
Trigger: any edit to the `fetchSearch` function.

---

## 🚨 PUBLIC MENU PAGE GUARDRAIL (CRITICAL — REVENUE PATH)

**File:** `src/pages/PublicMenuPage.jsx` + `src/components/menu-templates/`

The public menu page (`/public/restaurants/:id/menu`, `/restaurants/:slugOrId/menu`) is the primary revenue path. A broken menu page = zero orders. Any change touching these files requires the full verification sequence below before being declared done.

### MANDATORY verification before declaring menu page change complete

1. **Build passes:** `npx vite build` exits with 0 errors and all imports resolve
2. **Git completeness check:** every file imported by `PublicMenuPage.jsx` and every file in `src/components/menu-templates/` MUST be tracked in git (`git status` shows no untracked files in those paths). Committed code that imports untracked files breaks the Vercel production build.
3. **Live test from discovery:** navigate from the home/discovery page → click a restaurant menu card → confirm the menu page loads with items visible
4. **Live test via direct URL:** navigate directly to `/public/restaurants/{id}/menu` → confirm the same page loads
5. **Error states verified:** confirm the error message shown to users contains no developer text (no file paths, no endpoint URLs, no schema names)
6. **Deploy and confirm:** run `npx vercel --prod` → confirm the production URL returns a working menu (not a blank screen, not a build error)

### What a "blank screen" means on the menu page

A blank/dark screen on the menu page almost always means one of:
- A JS import that resolves locally but is absent from git (→ Vercel build fails or imports undefined)
- A React render crash with no error boundary (→ component unmounts silently)
- A fetch that returns `{ ok: false }` or no `ok: true` field (→ error state shown)

Check browser DevTools console first. If the error is an import failure, run `git status` to confirm all template files are tracked.

### Protected template files (must stay committed together)

All files below MUST be committed as a unit. Committing `PublicMenuPage.jsx` changes without committing changes to these files (or vice versa) creates a broken production state:
- `src/components/menu-templates/PublicMenuMainContent.jsx`
- `src/components/menu-templates/ClassicMenuTemplate.jsx`
- `src/components/menu-templates/CinematicMenuTemplate.jsx`
- `src/components/menu-templates/TakeoutMenuTemplate.jsx`
- `src/components/menu-templates/BoldCasualMenuTemplate.jsx`
- `src/components/menu-templates/RefinedEditorialMenuTemplate.jsx`
- `src/components/menu-templates/PublicMenuItemCard.jsx`
- `src/components/menu-templates/menuPresentationUtils.js`
- `src/components/menu-templates/restaurantMenuBrand.js`
- `src/data/menuTemplatePreviewSample.js`

### API contract (do not change without explicit approval)

- Backend returns `{ ok: true, ... }` — frontend checks `json.ok !== true` and shows an error if missing
- Route params: `/public/restaurants/:id/menu` uses `id`; `/restaurants/:slugOrId/menu` uses `slugOrId`
- Optional query params forwarded to backend: `lat`, `lng`, `city`, `state` — do NOT remove these

---

## 🚨 LIVE-USER TEXT GUARDRAIL

**Full rules in:** `/Users/andrebarber/Desktop/menubloc/CLAUDE.md` — section "LIVE-USER TEXT GUARDRAIL"

Any proposed addition or retention of developer-facing text in a user-visible code path **MUST** output this exact line before proceeding:

> **WARNING: THIS PROPOSED CHANGE VIOLATES EXPRESS TERMS OF GUARDRAIL AS STATED IN menubloc-frontend/CLAUDE.md**

Then identify the string, the file/line, and the user-facing condition that would surface it. Get explicit user approval before continuing. If the violation cannot be justified → STOP.

### Patterns that trigger this warning (frontend)

| Pattern | Example | Verdict |
|---------|---------|---------|
| Endpoint instruction in thrown Error | `throw new Error("Create GET /foo/:id to power this page")` | FORBIDDEN |
| Schema / architecture note in thrown Error | `throw new Error("Item is in commonknowledge schema")` | FORBIDDEN |
| File path or line number in any user-visible string | any | FORBIDDEN |
| `"TODO"` / `"Coming soon"` / `"Not yet implemented"` rendered to UI | any | FORBIDDEN |
| Empty throw that lets i18n fallback apply | `throw new Error("")` | ALLOWED |
| i18n key fallback message | `t("menuItemDetail.itemCouldNotLoad", "Item could not load")` | ALLOWED |
| Generic neutral message | `"Something went wrong. Please try again."` | ALLOWED |

### Scope

Applies to all strings that may reach the user's screen: `throw new Error("...")` inside fetch functions whose catch block sets an error state, JSX text literals in error/empty-state branches, any prop assigned to an error or message label.

---

## 🔒 SIMILAR ITEMS — STRICT TRUST MODE

**Established:** 2026-05-22
**File:** `src/pages/MenuItemDetailPage.jsx` — `ExploreSimilarDishes` component

### Core Rule

If `similar.length === 0` the section must be invisible — no container, no banner, no placeholder.

### What was removed (2026-05-22) — do NOT re-introduce

- `buildSimilarItemsLabel` function — generated the "Showing broader matches because nearby similar dishes were limited" text
- `helperLabel` variable and its conditional render block
- The banner div that displayed `helperLabel` above result rows

### Hard Restrictions

- **Never** render any text explaining why Similar Items is empty or limited
- **Never** render an empty Similar Items container (`SectionCard` with zero children)
- **Never** add explanatory fallback text, placeholder rows, or "no results" messaging to this section
- **Never** re-introduce `buildSimilarItemsLabel` or any function that generates "broader matches" language
- The `similar === null || similar.length === 0` early return (line 1056) is the correct gate — do not weaken it

### Permitted UI states

| State | Behavior |
|-------|----------|
| `similar.length >= 1` | Render `SectionCard` with result rows and Compare buttons |
| `similar.length === 0` | Return `null` — section entirely invisible |
| `failed === true` | Return `null` — section entirely invisible |

### Banner text that must never appear

- `"Showing broader matches because nearby similar dishes were limited"`
- Any equivalent text referencing result scarcity, expanded search, or limited local availability

---

## 🔒 INTELLIGENCE CHIP / BUTTON GUARDRAILS

**Established:** 2026-06-01
**Files:** `src/components/menu-templates/PublicMenuItemCard.jsx`, `src/components/SearchResultCard.jsx`, `src/lib/searchResultEnrichment.js`

---

## 🚫 NO UNSOLICITED UI / DESIGN CHANGES (ABSOLUTE RULE)

Agents MUST NOT make any UI, layout, visual, or design changes that were not explicitly requested by the user.

This includes but is not limited to:
- Color changes, font changes, spacing changes
- Adding, removing, or restyling badges, banners, pills, icons
- Reordering or restructuring layout elements
- Adding new UI states, modals, overlays, or animations

If a code task touches a file that contains unrelated UI — leave the UI untouched. The task is the task. Nothing more.

**Violation examples from this project:**
- Adding a red full-width absolute banner (`position: absolute`, `background: #b91c1c`) to a plan card when asked only to "add a Limited Availability label" — wrong. Match existing page style exactly.
- Changing padding, negative marginTop, or any spacing as a "while I'm in here" improvement — wrong. Only change what was asked.

---

## 🔒 PUBLIC MENU ITEM NAVIGATION — DO NOT REPLACE (CRITICAL)

**Files:** `src/pages/PublicMenuPage.jsx`, `src/components/menu-templates/PublicMenuItemCard.jsx`

### The navigation contract

1. Tapping a menu item card on the public menu opens `ItemDetailSheet` (the bottom ordering sheet).
2. Inside `ItemDetailSheet`, a **"View full item details →"** link navigates to `/menu-items/${item.id}` — the full `MenuItemDetailPage` with Nutrition, Insights, and Similar tabs.

**This two-level navigation MUST be preserved.** Do NOT:
- Remove the "View full item details →" link from `ItemDetailSheet`
- Replace `ItemDetailSheet` with inline detail rendering
- Navigate directly to `/menu-items/:id` on card tap (that bypasses the order flow)
- Remove the `navigate` prop threading from the parent to `ItemDetailSheet`

The `navigate` prop flows: `PublicMenuPage (useNavigate)` → `ItemDetailSheet` prop → `onClick` handler.

### What broke it before

A previous agent replaced the full-page navigation with a bottom sheet and removed the link to `MenuItemDetailPage`, making the full Nutrition/Insights/Similar detail page completely inaccessible from the public menu.

---

### Nutrition button on public menu (PublicMenuItemCard)

The "Nutrition" button MUST be a `<button>` element with `e.stopPropagation()` calling `openSheet()`.

**Never** render it as a `<span>` or `<Badge>` — a non-interactive element lets clicks bubble to the card's `commitMenuItemToBasket()` handler, adding the item to the basket instead of showing nutrition.

```jsx
// CORRECT — stops propagation before card's onClick fires
<button type="button" onClick={(e) => { e.stopPropagation(); openSheet(); }}>
  Nutrition
</button>

// WRONG — click bubbles to card and adds item to basket
<Badge label="Nutrition" ... />
```

### Protected menu item card elements

Menu item card elements are protected across restaurant menu pages, search results, and shared card components.

The following elements may not be removed, hidden, renamed, or made click-only without explicit approval:
- Item name
- Item price
- Item description when available
- Verdict box: `Suitable for Frequent Consumption`, `Suitable for Occasional Consumption`, or `Indulgent`
- Nutrition action
- Insights action
- Share action

Any change touching menu item cards, restaurant menu pages, search results, Nutrition, Insights, or verdict rendering MUST verify these protected elements still render on:
- Mobile restaurant menu page
- Desktop restaurant menu page
- Mobile search results
- Desktop search results

The Verdict box is a protected primary intelligence element. It is not redundant with Insights. Insights explains why; Verdict tells the user the consumption-suitability conclusion.

### Compare button scope (SearchResultCard / DetailPanel)

`handleCompare` is defined inside `ItemRow`. `DetailPanel` is a separate component — it MUST receive it as the `onCompare` prop.

**Never** call `handleCompare(si)` directly inside `DetailPanel` — it is out of scope and throws `ReferenceError` at runtime, silently breaking Compare for every user.

```jsx
// CORRECT
<DetailPanel onCompare={handleCompare} ... />
// inside DetailPanel: onClick={() => onCompare(si)}

// WRONG — ReferenceError, Compare never works
// inside DetailPanel: onClick={() => handleCompare(si)}
```

### Nutrition preview chips — intent-first ordering (searchResultEnrichment)

`buildNutritionPreviewChips` MUST return `[{ label: string, primary: boolean }]` objects, NOT plain strings.

When the user's search has a detected intent (low fat, low sodium, high protein, low carb), the matching chip MUST be `primary: true` and pushed FIRST, before calories and protein fill the remaining slots.

`NutritionPreviewStrip` MUST render `primary: true` chips in green (`#22C55E`) with a green border — visually distinguishing the query-matched attribute.

**Never** push intent chips after calories/protein — that buries or drops the matched attribute when the 3-chip limit is hit.

```js
// CORRECT — intent first, then fill with cal/protein
if (wantsFat) push(fat != null ? `${fat}g fat` : "Low fat ✓", true);  // primary
push(`${cal} cal`);
push(`${pro}g protein`);

// WRONG — intent chip arrives 3rd and gets cut off
push(`${cal} cal`);
push(`${pro}g protein`);
if (wantsFat) push(`${fat}g fat`);  // often never shown
```

---

## 🚨 SHOW SIMILAR & COMPARE GUARDRAIL (CRITICAL)

**Established:** 2026-06-05  
**Reference doc:** `docs/SEARCH_SIMILAR_COMPARE_REFERENCE.md` (at repo root)

Any proposed change to the files, functions, components, or UI layout listed below **MUST** output this exact warning before proceeding:

> **warning the proposed changes with modify the layout because [description of the specific modification].**

Then state:
- Which function(s), component(s), or layout element(s) are affected
- Which file(s) will be modified
- Why the change is safe (does not violate the invariants listed below)
- Get explicit user approval before writing any code

### Protected files — frontend

| File | Protected scope |
|---|---|
| `src/components/SearchResultCard.jsx` | `getItemId`, `handleCompare`, `loadSimilarForRow`, `DetailPanel`, similar panel item rendering, `onSwap`/`onViewBase` wiring to `CompareItemsModal`, `showSimilarChip` logic, `similarCacheKey` construction |
| `src/components/menu/CompareItemsModal.jsx` | Modal layout, `onViewBase` button, `onSwap` button, `comparison.baseItem`/`comparison.candidateItem` rendering, footer navigation buttons |
| `src/pages/MenuItemDetailPage.jsx` | `CompareItemsModal` mount, `onViewBase`/`onSwap` handlers, Similar chip |
| `src/pages/MenuItemInfoPage.jsx` | Similar-items section, compare actions, verdict block wiring, show similar behavior |
| `src/pages/GrubbidSearchResults.jsx` | `useRestaurantGroupedRendering` logic, `dishRows` derivation, waiter refinement rendering |
| `src/lib/api.js` | `fetchSimilarItems`, `fetchCompareItems`, `fetchCompareEligibility` |
| `src/lib/comparePolicy.js` | `isSimilarRowCompareEligible` |
| `src/components/share/shareUtils.js` | `getCanonicalMenuItemPath` |

### Hard invariants — any change that violates these is FORBIDDEN without explicit approval

1. **`mid` is always a CK ID**: `getItemId(row)` reads `row.menu_item_id || row.menuItemId || row.id`. The result is always a `commonknowledge.menu_items` ID. Never pass a `public.menu_items` ID to `fetchSimilarItems` or `fetchCompareItems`.

2. **Similar item navigation uses CK IDs**: `siHref = "/menu-items/" + siId` where `siId = getItemId(si) = si.id` (the CK ID from the backend similar result). Do not change this to a public ID or restaurant-scoped path without verifying the backend detail route handles it.

3. **Compare "View" buttons navigate to correct schemas**: `onSwap` navigates to `/menu-items/${candidateItem.id}` (CK ID from `comparison.candidateItem.id`). `onViewBase` navigates to `href` (the base item's full URL). Do not break this navigation or substitute `currentCompareCandidate` where `candidateItem` is the correct source.

4. **`skipEligibilityCheck: true` is correct when coming from Similar**: Similar rows with `compare_eligible === true` have already been vetted by the backend. Removing `skipEligibilityCheck: true` in `handleCompare` adds an unnecessary round-trip that can cause false rejections.

5. **`isSimilarRowCompareEligible(si)` gates the Compare button**: The Compare CTA must only appear when `si.compare_eligible === true`. Never show Compare for all similar rows regardless of eligibility.

6. **`useRestaurantGroupedRendering` must not depend on `restaurantIntent` alone**: The condition is `suppress_menu_items || (restaurantIntent && dishRows.length === 0)`. Setting it to `restaurantIntent` alone causes cuisine-word searches (pizza, BBQ, Italian) to suppress food results and show restaurant cards instead.

7. **`CompareItemsModal` layout structure**: The two-column grid (base item left, candidate right) and the footer button order (View base left, View candidate right) must be preserved. Swapping them breaks user expectation after "Compare" is clicked from a similar item.

### What triggers this guardrail

Any edit to:
- The `getItemId` function or how `mid` is derived
- The `handleCompare` function or its arguments to `fetchCompareItems`
- The `onSwap` or `onViewBase` handlers in `SearchResultCard` or `MenuItemDetailPage`
- The footer buttons in `CompareItemsModal` (order, onClick, disabled logic)
- The `siHref` construction in `DetailPanel`
- The `isSimilarRowCompareEligible` check gating the Compare button
- The `useRestaurantGroupedRendering` boolean expression
- The `fetchSimilarItems` or `fetchCompareItems` function signatures in `api.js`

---

## 🔒 REVIEW QUEUE GUARDRAIL (CRITICAL)

**Established:** 2026-06-15
**File:** `src/pages/owner/OwnerMenuUploadReviewItems.jsx`

The OCR review queue is **item-centric**, not OCR-centric.

### Core rule

The primary object under review is the **extracted menu item**. Source photos and OCR text are supporting evidence — they inform the reviewer's decision but must never dominate the layout.

### Required layout priority (top to bottom, left to right)

| Priority | Element | Notes |
|---|---|---|
| 1 | Item name | Editable input when open; bold static text when done |
| 2 | Price | Editable input when open |
| 3 | Description | Editable input when open |
| 4 | Section | Editable input when open |
| 5 | Hold reasons | Context chips — why the item was held |
| 6 | Approve / Reject | Primary actions, always visible for open items |
| Evidence | OCR text | Collapsible per-item toggle — never a standalone column |
| Evidence | Source photos | Panel above the table — supports decisions, not the focus |

### Hard rules

1. **OCR text must NOT be a table column.** It is shown as a per-item expandable toggle ("Source text") beneath the name field. A reviewer should not see raw OCR before they see the item name.

2. **Source photos appear above the item table** in a collapsible page panel. They are reference material, not the primary UI.

3. **Item name is always the first editable field.** It must appear as the leftmost non-checkbox column in the table.

4. **Approve and Reject actions must be visible without scrolling horizontally** for every open item row.

5. **Page quality must be displayed as three separate metrics. Never display "N% OCR" as a single quality indicator.**

   OCR percentage measures text recognition confidence only — it says nothing about whether structured menu items were successfully extracted. A page with corrupted characters or a foreign script may OCR at 100% while producing zero usable items.

   Required separate metrics:

   | Metric | Label | Source |
   |---|---|---|
   | Text recognition confidence | **OCR Confidence** | `page_meta.preview.ocr_quality_score` — show `⚠` when `ocr_quality_flags` present |
   | Number of structured items parsed | **Items Extracted** | `page_meta.preview.item_count` |
   | Whether extraction succeeded | **Extraction Status** | Derived from `parse_failure`, `accepted`, `readable` — values: items extracted / no items / parse failed / unreadable |

   These three metrics must be shown independently. Merging them back into a single "N% OCR" badge is a regression.

### What triggers this guardrail

Any edit to `OwnerMenuUploadReviewItems.jsx` that:
- Adds OCR text as a top-level table column
- Moves item name away from the first column position
- Hides or removes Approve/Reject buttons from the item row
- Merges OCR quality and extraction quality into a single badge
- Makes source photos the dominant visual element above or replacing the item table

### Why this exists

Prior to 2026-06-15, the review queue displayed a wide "OCR Text" column as the first content column in the table, making raw OCR the primary signal. This required reviewers to mentally parse unstructured text before reaching the extracted item data. The refactor placed item name first with OCR text behind a collapsible toggle.

---

## 🗂️ MANDATORY HANDOFF PRESERVATION GUARDRAIL

**Full rules in:** `/Users/andrebarber/Desktop/menubloc/CLAUDE.md` — section "MANDATORY HANDOFF PRESERVATION GUARDRAIL"

For any non-trivial frontend task, maintain a handoff file at `docs/handoffs/YYYY-MM-DD_<topic>_handoff.md`.
Index every handoff file in `docs/handoffs/README.md`.
Update the handoff before ending any session with work in progress.
