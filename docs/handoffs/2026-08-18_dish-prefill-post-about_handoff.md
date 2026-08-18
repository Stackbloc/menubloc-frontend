# Objective

Prefill I'm Eating At with restaurant **and dish**; Facebook-like post flow; merge plans into What I'm Eating; larger X; sheet title Post about.

# Current Status

**WRAPPED.** Live tip `5vl6kfuh6` / `index-BZBfCuwA.js` (FE `12945f5` includes `8a1a961`). Live BE `942e7c10` includes `4695ba64`. Do not re-alias `psmauf4vh`.

# Files Changed

FE: `foodActivityApi.js`, `ImEatingComposer.jsx`, `ImEatingAtPanel.jsx`, `ImEatingPage.jsx`, `MenuplyActionSheet.jsx`, `BottomNav.jsx`, `MyMenuplyPage.jsx`, `PostAfterActions.jsx`, contract tests.

BE: `updateSessionDetails` + PATCH (already present); `whatWeDoingContract.test.js` assertions.

# Database Changes

None new. Uses `0271` place/joinable columns.

# Decisions Made

- Dish (not “dhis”). Prefill via query params from action sheet, not MenuItemDetailPage edits.
- Restaurant not required to post. Tag after.
- Future date → `what_we_doing`; today/past → `what_i_ate_today`.
- Join Me for “I'm here now” stays on I'm Eating At.

# Remaining Work

None for this feature. Do not re-alias `psmauf4vh`. Site Activity dirt stays uncommitted.

# Risks / Known Issues

Plan dish tags live in `place_label` only.

# Verification Status

Live menuply.com bundle contains `Post about` / `im-eating-selected-dish`. Tip-gate locked to `index-BZBfCuwA.js`.

# Resume Instructions

Done. Next agent: do not restore `psmauf4vh`. Current LKG is `5vl6kfuh6` / `index-BZBfCuwA.js` + BE `942e7c10`.

# Git Status

Uncommitted on authorized paths. Do not deploy from `menubloc-frontend/` or `menubloc-backend/`.
