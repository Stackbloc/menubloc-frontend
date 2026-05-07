# Frontend Guardrails — full rules in /Users/andrebarber/Desktop/menubloc/CLAUDE.md

---

## 🚀 DEPLOYMENT — VERCEL

**Platform:** Vercel (project: `andre-barber-s-projects/menubloc-frontend`, alias: `grubbid.com`)

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
