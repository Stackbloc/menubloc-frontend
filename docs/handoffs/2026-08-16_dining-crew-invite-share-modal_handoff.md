# Objective

Replace prototype Dining Crew invite share with ShareModal (menuply.com locked).

# Current Status

**CPD COMPLETE 2026-08-16** — live on CURRENT tip `e2toazdpi` / `index-Cx2bTWAc.js` (includes Share invite; superseded first lock `nzkm72fy0` / `DyvhJLLC`).  
Tip-gate PASS. Live: Share invite / dining-crew-share-invite in production bundle.

# Files Changed

- `menubloc-frontend-main/src/lib/diningCrewInviteShare.js`
- `menubloc-frontend-main/src/pages/consumer/DiningCrewsPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/SocialOnboardingPage.jsx`
- FE contract tests listed in audit

# Database Changes

None.

# Decisions Made

1. Reuse ShareModal; do not edit shareUtils/ShareModal
2. Sharing optional on onboarding; Continue never requires invite
3. Remove member-id field from default consumer invite UI

# Remaining Work

None — CPD complete. Live on CURRENT tip `e2toazdpi` / `Cx2bTWAc` (do not restore superseded `nzkm72fy0` unless Andre names it).

# Risks / Known Issues

None blocking.

# Verification Status

diningCrewInviteShare + social onboarding + diningCrews social entity + share-contract — pass.

# Resume Instructions

1. Smoke Share invite on `/account/dining-crews/:id` and onboarding after Create Dining Crew
2. On `cpd`: FE from `menubloc-frontend-main` (BE unchanged)

# Git Status

Uncommitted local FE changes.
