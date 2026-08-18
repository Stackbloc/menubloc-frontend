# Objective

Redesign diner-facing navigation around My Menuply as a personal food/social home, then make the diner About and profile photo prominent, human, and social.

# Current Status

**CPD COMPLETE.** Live tip `83npukyp6` / `index-KbRqQ3I0.js`. BE `03132162` health MATCH. Migration `0270` applied.

# Files Changed

## Frontend (`menubloc-frontend-main`)

- `src/components/BottomNav.jsx` — Home | Search | X | Activity | My Menuply
- `src/components/MenuplyXMark.jsx`, `MenuplyActionSheet.jsx`
- `src/components/StickyPageHeader.jsx` — person → `/my-menuply`
- `src/components/grubbid/DiscoveryDrawer.jsx`, `SiteFooter.jsx`
- `src/App.jsx` — `/my-menuply`, `/activity`
- `src/pages/consumer/MyMenuplyPage.jsx` + `myMenuply/*`
- `src/pages/consumer/myMenuply/DinerIdentityHero.jsx` — prominent photo + bio
- `src/pages/ActivityPage.jsx`
- `src/lib/consumerApi.js` — connections eating/planning
- Tests: `dinerPrimaryNavContract`, `myMenuplyFourQuestionsContract`, `dinerAboutPhotosContract`

## Backend (`menubloc-backend-main`)

- `src/services/consumerConnections/connectionsFoodLifeService.js`
- `src/routes/consumer/connectionsFoodLife.js` (mounted before `connections.js`)
- `src/routes/consumer/profile.js` — `avatar_url`, `diner_about`
- `sql/migrations/20260818_0270_diner_about_me.sql` (+ rollback)
- Tests: `connectionsFoodLifeContract`, `dinerAboutMeContract`

# Database Changes

- New column: `public.consumer_profiles.diner_about TEXT`
- Not applied to production
- Rollback: `20260818_0270_diner_about_me_rollback.sql`

# Decisions Made

- About + photo live at the **top** of My Menuply (addendum overrides original “About last/compact”).
- Bio is free text, 280 chars, placeholder example only — no questionnaire.
- Profile photo reuses `POST /api/consumer/profile/avatar` (Instagram-like tap-to-change).
- Food photos contributed via existing I'm Eating At / What I Ate Today (working features only; no new album API).
- Dietary/allergens stay in Settings (`/account`).
- HomeNext unchanged. Waiter files untouched.
- Activity is public/nearby happening; connections eating/planning stay on My Menuply.
- X sheet has no diner Create Event (operators create; diners RSVP / Find events).

# Remaining Work

- Commit when Andre asks.
- Apply `0270` on production before or with BE CPD.
- CPD only when Andre says `cpd`.
- Optional later: public diner QR shows About.

# Risks / Known Issues

- Shipping BE without `0270` breaks GET `/api/consumer/profile`.
- Local backend needs `0270` applied before profile GET works.

# Verification Status

- FE: `dinerPrimaryNavContract`, `myMenuplyFourQuestionsContract`, `dinerAboutPhotosContract`, `accountDashboardContract`, `siteFooterNavigationContract` — 24 pass. `test:share-contract` — 10 pass.
- BE: `connectionsFoodLifeContract` PASS (source-scan; no DB require). `dinerAboutMeContract` PASS.
- HomeNext.jsx not edited. Waiter files not edited.
- Menu-experience contract not run (protected menu files untouched).

# Resume Instructions

1. Work only in `menubloc-frontend-main` and `menubloc-backend-main`.
2. Apply `0270` locally before exercising About save.
3. Open `/my-menuply` signed in: large photo, bio textarea, dining photo grid.
4. Do not edit `HomeNext.jsx` or Waiter files.
5. Do not deploy unless Andre says `cpd`.

# Git Status

Uncommitted local work in both authorized trees (as of this handoff).
