# Objective

Rename Eating Plans to My Eating Plans. Make section labels clickable. Remove click-coaching copy.

# Current Status

LOCAL on `menubloc-frontend-main`. Not committed. Not deployed.

# Files Changed

- `src/pages/consumer/MyMenuplyPage.jsx`
- `src/pages/consumer/myMenuply/myMenuplyBits.jsx`
- `test/myMenuplyFourQuestionsContract.test.js`

# Database Changes

None.

# Decisions Made

Titles are the only section CTAs. No See all / Add photo / Create / Find side links. Empty states state emptiness only. Footer Eating Plans left unchanged. Waiter / HomeNext / OperatorLogin untouched.

# Remaining Work

CPD when Andre asks.

# Risks / Known Issues

Where I Eat title goes to `/account/following` (saved places), not a separate history page.

# Verification Status

`node --test test/myMenuplyFourQuestionsContract.test.js` — 5 pass.

# Resume Instructions

Do not restore section action labels or tap-to copy on My Menuply. No CPD unless Andre says `cpd`.

# Git Status

Dirty `menubloc-frontend-main`.
