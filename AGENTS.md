# Frontend Guardrails — see /Users/andrebarber/Desktop/menubloc/AGENTS.md for full rules

## Quick reference: protected files

- `src/pages/GrubbidDiscovery.jsx`
- `src/pages/BrowseMenus.jsx`
- `src/pages/GrubbidSearchResults.jsx`
- `src/lib/locationUtils.js`

## Last known good commit: `62039b5`

## Discovery page location — HARD RULES

The discovery page location input is a PLAIN TEXT FIELD.
- No autocomplete
- No dropdown
- No API-backed city lookup
- No canonical location picker
- Users type manually (e.g. "Los Angeles, CA") OR use browser auto-detect

## autoLocation flow — do not break

`autoLocation.city` and `autoLocation.state` MUST flow to:
1. `buildSearchParams` — included alongside lat/lng when no manual location set
2. Browse Menus button click — passed as `?city=&state=` in the browse URL

Removing either of these causes cross-city leakage and broken browse.

## Before touching any protected file

1. Note current commit: `git log --oneline -1`
2. Confirm discovery page detects location automatically
3. Confirm browse URL includes city/state
4. Make ONE change only
5. Re-verify all three above
6. Only then commit

## Revert command if something breaks
```bash
git revert HEAD
npm run dev
```
