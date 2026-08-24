# Home Food Search Parameters — No Changes Without Approval

**Established:** 2026-08-24  
**Status:** REQUIRED contract term  
**Owner:** Andre Barber  
**Cursor rule:** `.cursor/rules/home-food-search-parameters-no-changes-guardrail.mdc` (`alwaysApply`)  
**Related:**  
- [Home Page Protection Protocol (HPP)](../menubloc-frontend/docs/guardrails/2026-06-28_home-page-protection-protocol-guardrail.md) — home layout/UI  
- [Menuply Search Execution Contract](./2026-07-28_menuply-search-execution-contract.md) — backend retrieval order (separate)

---

## Contract term

> **No changes to search** — agents must **not** modify existing **home screen food search parameters** without Andre’s **explicit current-turn** approval.

“Food search parameters” means the query string / API params that HomeNext (and home chips / health goals) use when sending the diner into dish/restaurant search — not a general license to refactor `/search` elsewhere.

---

## What is locked

Without current-turn approval naming home food search, do **not** change:

1. **URL / request params** built for home → `/search` (and the home preflight `GET /search` with `limit=1`)
2. **Location / radius / geo** values home search attaches (`city`, `state`, `lat`, `lng`, `radius`, `location_label`, etc.)
3. **Structured context** home passes (`cuisine`, `category`, `meal_period`, `occasion`, `dining_mode`, dietary `filterKey`s)
4. **Chip / health-goal → search wiring** (queries, `filterKey`, context objects that become search params)
5. **Shared helpers** when the edit would change home’s emitted params (even if the helper is also used elsewhere)

### Primary builders / call sites

| Area | Files |
|------|--------|
| Home search URL builder | `menubloc-frontend-main/src/lib/homeNextNavigation.js` (`buildHomeSearchUrl`, `buildHomeChipUrl`, home `LOCAL_RADIUS_MILES`) |
| Home search box + preflight | `menubloc-frontend-main/src/pages/HomeNext.jsx` (`runSearch`, search form) |
| Food chips → search | `menubloc-frontend-main/src/lib/homeNextEntryPoints.js`, `HomeNextFoodGrid.jsx` |
| Health goals → search | `HomeNextHealthGoals.jsx` |
| Location param shaping used by home search | `locationUtils.js` (`buildSearchLocationParams`) when changing behavior that home relies on |
| Dietary filter → URL | `filterUtils.js` (`filtersToUrlParams` / `EMPTY_FILTERS`) when changing keys home chips set |

HPP still applies to home layout. This contract is the **search-parameter** slice: even a “small” tweak to radius, default market, or chip query strings is forbidden without approval.

---

## Never implement without explicit current-turn approval

- Changing home search `radius`, default city/state, geo vs city mode, or location param names/values
- Rewriting `buildHomeSearchUrl` / `buildHomeChipUrl` param shape
- Changing food-chip or health-goal queries / filterKeys / context that alter `/search?...`
- Adding, removing, or renaming query params home attaches to food search
- “Improving” home search by copying Yellow Browser / Waiter / discovery params onto home
- Incidental param drift from shared Search refactors that touch the home builders above

Silence, HPP layout approval alone, Search Execution approval alone, or “bugfix elsewhere” ≠ permission to change home food search parameters.

---

## Allowed without this contract’s approval

- Unrelated `/search` UI on Search Results / discovery **that does not change home’s emitted params**
- Backend Search Execution Contract work (candidate order) that does **not** change what home sends
- Pure copy/CSS on the home search box that does not change params (still needs **HPP** approval if editing HomeNext)
- Bugfixes Andre’s current turn **explicitly** names as home food search param work

---

## Before editing protected search-param files

Output:

> **Per Home Food Search Parameters contract (“no changes to search”): the proposed change will modify [names] and may alter home screen food search parameters. Explicit Andre approval required.**

Then **stop** until Andre’s current-turn message approves the specific param change.

## Agent stop line

> This change would modify home screen food search parameters. I have not done that. Explicit approval naming home food search is required.

---

## Mandatory on EVERY task completion

End every response with:

> ☐ HOME FOOD SEARCH CERTIFICATION: Home food search parameters [unchanged | Andre-approved change: …].

---

## Relationship to other guardrails

| Guardrail | Scope |
|-----------|--------|
| **This contract** | Home → food search **parameters** (query string / API args) |
| **HPP** | Home page layout, chips UI, styling, routing shell |
| **Search Execution Contract** | Backend geo→restaurant→menu→item retrieval order |
| **Franchise + CK Search** | CK as source of truth for candidates |

Approval for one does **not** imply approval for the others.
