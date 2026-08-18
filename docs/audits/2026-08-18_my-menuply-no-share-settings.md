# Summary

Share My Menuply and Settings chips do not belong on My Menuply. Removed from `DinerIdentityHero`.

# Problem Statement

My Menuply is the diner’s personal page. Share and Settings are Account tools.

# Root Cause

Hero reused Account shortcuts (`/account/diner-qr?share=1`, `/account`) as chips on About Me.

# Evidence Collected

Hero had Share My Menuply + Settings under My Connections. Share remains on `/account` Profile (My Diner QR). Settings remains `/account`. Hamburger still has Settings.

# Files Examined

- `DinerIdentityHero.jsx`
- `test/myMenuplyFourQuestionsContract.test.js`
- `test/dinerAboutPhotosContract.test.js`
- `test/accountDashboardContract.test.js` (Share stays on Profile tab)

# Database Queries Executed

None.

# Changes Made

Removed the two chips. Contract asserts they are absent from the hero.

# Commits

Local until CPD.

# Deployment Status

Not in this change. Prior interrupted CPD still had the chips on tip `3yhm8ox9y` / `index-DakdXf4C.js` if that alias is live.

# Verification Results

`node --test test/myMenuplyFourQuestionsContract.test.js test/dinerAboutPhotosContract.test.js` — 7 pass.

# Remaining Risks

Production may still show the chips until the next `cpd`.

# Follow-Up Work

Say `cpd` to ship this removal.

# Final Verdict

My Menuply is food life. Share and Settings stay on Account.
