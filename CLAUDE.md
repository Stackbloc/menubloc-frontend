# Frontend Guardrails — full rules in /Users/andrebarber/Desktop/menubloc/CLAUDE.md

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

## Last known good commit: `62039b5`

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
