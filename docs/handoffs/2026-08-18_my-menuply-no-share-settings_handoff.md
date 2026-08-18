# Objective

Keep Share My Menuply and Settings off the diner personal page.

# Current Status

Removed from `DinerIdentityHero`. Share stays on `/account` Profile. Settings stays `/account`. Local until `cpd`.

# Files Changed

- `src/pages/consumer/myMenuply/DinerIdentityHero.jsx`
- `src/pages/consumer/myMenuply/myMenuplyStyles.js`
- `test/myMenuplyFourQuestionsContract.test.js`
- `test/dinerAboutPhotosContract.test.js`

# Database Changes

None.

# Decisions Made

My Menuply is personal food life. Account chrome does not live on that page.

# Remaining Work

CPD to ship. Do not put the chips back.

# Risks / Known Issues

Live tip from the interrupted diner-compose CPD may still show the chips.

# Verification Status

7 contract tests pass.

# Resume Instructions

Say `cpd` to commit, deploy, and lock tip.

# Git Status

Uncommitted on `menubloc-frontend-main` @ `main` after `6a97d1e`.
