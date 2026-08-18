# Summary

Restored diner bottom nav to Home, Waiter, Menu Browser, X (`post.`), Basket, and My Menuply. Public Activity is additive on Waiter; `/activity` redirects to `/waiter#activity`. Search is not a bottom-nav tab.

# Problem Statement

After My Menuply IA, bottom nav was Home | Search | X | Activity | My Menuply. Andre asked to restore Home / Waiter / Yellow Browser / Basket, keep My Menuply, keep the X launcher with hover text `post.`, and fold Activity into Waiter.

# Root Cause

My Menuply IA replaced the pre-IA four-tab bar. Activity was a separate tab. Search replaced Waiter and Yellow Browser.

# Evidence Collected

- Pre-IA BottomNav (LKG tag `menuply-last-known-good-2026-08-18`): Home, Waiter (`WaiterFaceIcon`), Menu Browser (`BrowseMenusIcon` + `resolveBrowseMenusHref`), Basket with cart badge.
- Live IA nav until this change: Home, Search, X, Activity, My Menuply; cart in header.
- Activity page was public/nearby happening (clusters, diner status, I'm Eating At, notifications). Connections eating stays on My Menuply.
- Current-turn Waiter authorization: incorporate Activity into Waiter; do not redesign Waiter cards.

# Files Examined

- `src/components/BottomNav.jsx`
- `src/pages/FoodInterestsPage.jsx`
- `src/pages/ActivityPage.jsx`
- `src/components/MenuplyActionSheet.jsx`
- `src/components/StickyPageHeader.jsx`
- `src/pages/consumer/MyMenuplyPage.jsx`
- Waiter contract tests; diner primary nav contract; Yellow Browser venue contract

# Database Queries Executed

None.

# Changes Made

- BottomNav: Home | Waiter | Menu Browser | X (`title`/`aria-label` `post.`) | Basket | My Menuply. X opens existing `MenuplyActionSheet`. No Search tab. No Activity tab.
- Header: person stays on `/my-menuply`; basket stays in BottomNav (not header).
- Waiter: additive `WaiterPublicActivity` after recommendation cards (`id="activity"`). Core Waiter cards, meal chips, `groupByType`, `briefing.recommendations` unchanged. No MarketFallback / CommunityGrowthCard / greetings.
- `/activity` → `<Navigate to="/waiter#activity" replace />`. Footer/drawer `/activity` links still work.
- My Menuply “What's happening” points to `/waiter#activity`.
- Fixed broken `menuBrowserVenueContextContract.test.js` syntax.

# Commits

Feature commit on `menubloc-frontend-main` `main` as part of CPD.

# Deployment Status

CPD in progress.

# Verification Results

- `dinerPrimaryNavContract`, `menuBrowserVenueContextContract`, `waiterClusterReportContract`, `myMenuplyFourQuestionsContract`, `siteFooterNavigationContract` — 16 pass
- `waiterPeopleEatingContract` — 2 pass
- `test:share-contract` — 10 pass
- `npm run build` — pass (local bundle `index-GKmCFj6W.js`)
- Menu-experience contract not run (public menu files untouched)

# Remaining Risks

- Six bottom-nav slots are tight on small phones.
- X remains icon-only; hover/title is `post.` (desktop hover / some long-press).
- `/activity` no longer has its own page chrome; deep links land on Waiter.

# Follow-Up Work

None for this CPD besides tip lock after alias.

# Final Verdict

Ready to ship on authorized `menubloc-frontend-main` @ `main`.
