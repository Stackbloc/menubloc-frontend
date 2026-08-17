# Summary

Added **My Diner QR** and **Share My Menuply** to the diner `/account` Profile tab as the second and third items after Profile information. Links reuse existing `/account/diner-qr` and `/account/diner-qr?share=1` (ShareModal Copy Link). Social & Crew entries were left in place. No share-payload or HomeNext changes.

# Problem Statement

Andre asked for diner account Profile to show My Diner QR and Share my Menuply immediately after Profile Information.

# Root Cause

The four-tab dashboard placed those two actions only under Social & Crew → Meet up around food.

# Evidence Collected

- `ProfileTab.jsx` previously went Profile information → Dining preferences.
- Live working routes: `DinerQrPage`, `?share=1` opens ShareModal (no `navigator.share`).

# Files Examined

- `menubloc-frontend-main/src/pages/consumer/accountDashboard/ProfileTab.jsx`
- `SocialCrewTab.jsx`, `AccountActionLink.jsx`
- `test/accountDashboardContract.test.js`, `test/dinerQrPhase1Contract.test.js`
- Share contract tests

# Database Queries Executed

None.

# Changes Made

- `ProfileTab.jsx`: two `AccountActionLink` sections after Profile information
- Contract tests for order and Profile-tab QR/share links

# Commits

FE `da0bb15` — `feat(account): show Diner QR and Share My Menuply on Profile.`

# Deployment Status

**CPD COMPLETE.** FE tip `menubloc-frontend-1urgwayz1-menuply.vercel.app` / `index-FsvPkVHt.js`. BE unchanged (`4a603a12`).

# Verification Results

- `node --test test/accountDashboardContract.test.js test/dinerQrPhase1Contract.test.js` — 13 pass
- `npm run test:share-contract` — 10 pass

# Remaining Risks

- Duplicate QR/share entries remain on Social & Crew until Andre asks to remove them

# Follow-Up Work

- Optional: drop Social & Crew duplicates if Profile is the only desired home

# Final Verdict

**CPD COMPLETE.** Profile tab order is live: Profile information → My Diner QR → Share My Menuply → Dining preferences.
