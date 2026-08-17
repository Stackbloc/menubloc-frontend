# What I Ate Today handoff

## Objective

Optional profile section: what the diner ate today. Manual names always work. Optional CK menu-item link. Direct add from menu-item detail. Connections see it only if the owner opts in.

## Current Status

Implemented locally on `menubloc-frontend-main` and `menubloc-backend-main`. Not committed. Not deployed. Migration `0266` not applied.

## Files Changed

- BE: `sql/migrations/20260817_0266_what_i_ate_today.sql` (+ rollback)
- BE: `src/services/whatIAteToday/whatIAteTodayService.js`
- BE: `src/services/storage/whatIAteTodayPhotoStorage.js`
- BE: `src/routes/consumer/whatIAteToday.js` (mounted in `src/routes/consumer/index.js`)
- BE: `src/routes/consumer/profile.js` (`what_i_ate_today_visible`)
- BE: `test/whatIAteTodayContract.test.js`
- FE: `src/components/consumer/WhatIAteTodaySection.jsx`
- FE: `src/components/consumer/WhatIAteTodayAddButton.jsx`
- FE: `src/lib/consumerApi.js`
- FE: `ProfileTab.jsx`, `SocialCrewTab.jsx`, `ConsumerConnectionPeerPage.jsx`, `MenuItemDetailPage.jsx`
- FE: `test/whatIAteTodayContract.test.js`, `test/accountDashboardContract.test.js`, `tests/menu-item-detail-sticky-verdict.test.js`

## Database Changes

New table `public.what_i_ate_today`. New column `consumer_profiles.what_i_ate_today_visible` default false. **Not applied to production.**

## Decisions Made

- New table — do not reuse `food_activity`.
- Identity social: `requireConsumerAuth`. Do not login-wall I'm Eating At / guest reporting.
- Dining halls excluded from suggestions and CK attach.
- Autocomplete is prefix `ILIKE 'q%'`, LIMIT 8, `SET LOCAL statement_timeout` inside `BEGIN`, empty on timeout. Not `/search`.
- Visibility default hidden. Owner always sees own entries.
- `eaten_on` is client local `YYYY-MM-DD`.
- Never `INSERT` into `commonknowledge.menu_items`.
- Detail-page control is labeled and sits **below** `MenuItemDetailActionRail`. Sticky compact `VerdictBlock` unchanged. No `StickyVerdictRail`. Similar/Compare untouched.

## Remaining Work

1. Andre says commit / `cpd`
2. Apply `0266` from `menubloc-backend-main` @ clean `main`
3. Deploy BE then FE from authorized mains; tip-gate PASS
4. Live signed-in probe: post a manual name, post a linked CK item, toggle visibility, view from a Connection

## Risks / Known Issues

Live production will 404 these routes until BE deploy + migration. FE empty/error states catch that.

## Verification Status

Local contracts (see audit). Production not probed for this feature.

## Resume Instructions

Do not apply `0266` or deploy until Andre says `cpd`. Do not touch Waiter. Do not reuse public search for typeahead. Do not add dining-hall menus. Deploy only from `menubloc-frontend-main` / `menubloc-backend-main`.

## Git Status

Dirty working trees on FE-main and BE-main (this feature plus earlier local Social tab work) until commit/CPD.
