# Objective

Restore Home / Waiter / Yellow Browser / Basket, keep My Menuply and the bottom X (hover `post.`), and put public Activity on Waiter.

# Current Status

**LOCAL — not CPD.** Code is in `menubloc-frontend-main` working tree.

# Files Changed

- `src/components/BottomNav.jsx` — Home | Waiter | Menu Browser | X (`post.`) | Basket | My Menuply
- `src/components/WaiterPublicActivity.jsx` — new additive Waiter section
- `src/pages/FoodInterestsPage.jsx` — mounts activity panel; hash scroll `#activity`
- `src/pages/ActivityPage.jsx` — redirect to `/waiter#activity`
- `src/pages/consumer/MyMenuplyPage.jsx` — What's happening → `/waiter#activity`
- `src/components/StickyPageHeader.jsx` — basket not in header (from prior restore in this session)
- Tests: `dinerPrimaryNavContract`, `menuBrowserVenueContextContract`, `waiterClusterReportContract`, `myMenuplyFourQuestionsContract`

# Database Changes

None.

# Decisions Made

- Activity is additive on Waiter, not a Waiter redesign.
- `/activity` route kept for footer/drawer; it redirects.
- X stays the Menuply mark + action sheet; hover/title is exactly `post.`
- Search is not a bottom-nav tab.
- Connections eating stays on My Menuply.
- HomeNext and OperatorLogin unchanged.
- Backend waiter routes/services unchanged.

# Remaining Work

- Commit when Andre asks.
- CPD only when Andre says `cpd`.

# Risks / Known Issues

- Six tabs may wrap/crowd on narrow phones.
- Native `title="post."` is desktop hover; mobile has no hover.

# Verification Status

Contract tests run in this session (see workspace audit). Menu-experience contract not required (public menu files untouched). Share contract unchanged.

# Resume Instructions

1. Work only in `menubloc-frontend-main`.
2. Do not edit `HomeNext.jsx`.
3. Do not redesign Waiter cards.
4. Do not deploy unless Andre says `cpd`.

# Git Status

Uncommitted local FE work. Backend-main not part of this change.
