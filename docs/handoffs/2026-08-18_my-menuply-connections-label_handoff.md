# Objective

Label the connections block **My Connections**, put it above What I'm Eating, and open what they are eating on click.

# Current Status

LOCAL on `menubloc-frontend-main`. Not committed. Not deployed.

# Files Changed

- `src/pages/consumer/MyMenuplyPage.jsx`
- `src/pages/consumer/myMenuply/myMenuplyBits.jsx`
- `src/pages/consumer/myMenuply/myMenuplyStyles.js`
- `src/pages/consumer/ConnectionsEatingPage.jsx`
- `test/myMenuplyFourQuestionsContract.test.js`

# Database Changes

None.

# Decisions Made

Clicking **My Connections** goes to `/my-menuply/connections-eating` (existing eating list). Header on that page is **My Connections**. Public What's happening stays off this page. Waiter untouched.

# Remaining Work

CPD when Andre asks.

# Risks / Known Issues

Other section titles with a `to` are now clickable too.

# Verification Status

`node --test test/myMenuplyFourQuestionsContract.test.js` — 5 pass.

# Resume Instructions

Do not restore "What My Connections Are Eating" on the hub. Do not put What's happening back on My Menuply. No CPD unless Andre says `cpd`.

# Git Status

Dirty `menubloc-frontend-main`.
