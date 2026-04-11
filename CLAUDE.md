# Frontend Guardrails — full rules in /Users/andrebarber/Desktop/menubloc/CLAUDE.md

## Quick reference: protected files

- `src/pages/GrubbidDiscovery.jsx`
- `src/pages/BrowseMenus.jsx`
- `src/pages/GrubbidSearchResults.jsx`
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
