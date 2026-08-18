# Objective

Remove public "What's happening" from My Menuply. Keep public Activity on Waiter.

# Current Status

LOCAL on `menubloc-frontend-main`. Not committed. Not deployed.

# Files Changed

- `menubloc-frontend-main/src/pages/consumer/MyMenuplyPage.jsx` — deleted `public-activity` section
- `menubloc-frontend-main/test/myMenuplyFourQuestionsContract.test.js` — assert the section is gone

# Database Changes

None.

# Decisions Made

My Menuply is the diner's personal page. Public/nearby happening does not belong there. Waiter Activity is unchanged (zero-touch this turn).

# Remaining Work

CPD when Andre asks. Do not touch Waiter unless the current turn names Waiter.

# Risks / Known Issues

None beyond losing the My Menuply shortcut to `/waiter#activity`.

# Verification Status

`node --test test/myMenuplyFourQuestionsContract.test.js` — 5 pass.

# Resume Instructions

Do not put "What's happening" back on My Menuply. Public Activity stays on Waiter. No CPD unless Andre says `cpd`.

# Git Status

Dirty `menubloc-frontend-main` (this plus any prior local My Menuply / What I Ate work).
