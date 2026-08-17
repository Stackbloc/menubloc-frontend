# What I Ate Today

**Date:** 2026-08-17  
**Agent/session:** Cursor (What I Ate Today)  
**Branches:** `menubloc-frontend-main` @ `main`, `menubloc-backend-main` @ `main`  
**Status:** LOCAL — not committed, shipped tip lb1gjtgsw / CQT15_ja, migration `0266` not applied

## Summary

Optional diner profile feature answering “What did you eat today?” Manual food names always post. Linking a Common Knowledge menu item is high-value and never required. Connections see the section only when the owner opts in. A labeled **Add to What I Ate Today** control sits below the menu-item detail action rail; sticky compact `VerdictBlock` is unchanged.

## Problem Statement

Diners had no lightweight way to record what they ate today on their profile, including homemade or unnamed food, without inventing a parallel menu-item catalog or blocking on restaurant/menu preload.

## Root Cause

`food_activity` (I'm Eating At) requires `restaurant_id`. Homemade/manual food cannot use that table. Public `/search` is the dish search engine and must not be reused as typeahead.

## Evidence Collected

- I'm Eating At / `food_activity` requires a restaurant — unsuitable for leftover pasta / banana / homemade.
- `commonknowledge.menu_items` is the only menu-item identity source; this feature attaches IDs only.
- Dining halls are status + comments only — suggestions and CK attach exclude `restaurant_type = dining_hall`.
- Guest open reporting stays open; this feature is identity social (`requireConsumerAuth`).
- Andre granted sticky-verdict + PHMS approval to add a labeled control on `MenuItemDetailPage.jsx` below `MenuItemDetailActionRail` only.

## Files Examined

- `foodActivity` routes/service (not reused)
- `canonicalMenuItem` / CK identity (read-only attach)
- `MenuItemDetailPage.jsx`, `MenuItemDetailActionRail.jsx`
- `ProfileTab.jsx`, `SocialCrewTab.jsx`, `ConsumerConnectionPeerPage.jsx`
- `consumerApi.js`, `profile.js`

## Database Queries Executed

None against production. Migration `0266` is written, not applied.

## Changes Made

- BE: `sql/migrations/20260817_0266_what_i_ate_today.sql` (+ rollback)
- BE: `whatIAteTodayService.js`, `whatIAteTodayPhotoStorage.js`, `routes/consumer/whatIAteToday.js`
- BE: `consumer_profiles.what_i_ate_today_visible` on profile GET/PUT
- FE: `WhatIAteTodaySection.jsx`, `WhatIAteTodayAddButton.jsx`, API helpers
- FE mounts: Profile tab, Social tab, Connection peer viewer, menu-item detail (below action rail)

## Commits

Not committed until Andre asks / CPD.

## Deployment Status

Local on authorized `*-main` trees. Railway `/health` unchanged. `0266` not applied.

## Verification Results

- `node test/whatIAteTodayContract.test.js` (BE) — PASS
- `node --test test/accountDashboardContract.test.js test/whatIAteTodayContract.test.js` — PASS (11)
- `node --test tests/menu-item-detail-sticky-verdict.test.js` — PASS (6)
- Waiter files not edited
- Similar/Compare functions not edited
- Sticky compact `VerdictBlock` retained; no `StickyVerdictRail`

## Remaining Risks

- Feature is dark until `0266` is applied and BE+FE are deployed.
- Suggestion prefix `ILIKE 'q%'` can miss mid-name matches — fail-open; diner can still type a name.
- `cmi:` franchise route IDs post `food_name` without a CK attach when the id is not numeric.

## Follow-Up Work

CPD when Andre asks: apply `0266` from `menubloc-backend-main` @ clean `main`, then FE tip-gate. Do not treat guest I'm Eating At as this feature.

## Final Verdict

What I Ate Today is implemented locally as optional identity social. Menu-item attach never blocks posting. Dining-hall menus unused. Sticky hero verdict unchanged.
