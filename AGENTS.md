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
- `src/pages/MenuItemInfoPage.jsx`
- `src/lib/locationUtils.js`

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

## Required route verifier
For any frontend change touching discovery, browse, search, routing, or shared location helpers, run:

```bash
npm run verify:geo-routes
```

This is the canonical route-level verification workflow for:
- discovery auto-location
- browse URL persistence
- LA vs Dothan separation
- LA search rendering
- backend baseline endpoint health

If it fails, the change is not done.

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
