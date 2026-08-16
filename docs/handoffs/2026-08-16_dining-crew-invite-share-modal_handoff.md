# Objective

Replace prototype Dining Crew invite share with ShareModal (menuply.com locked).

# Current Status

**LOCAL COMPLETE** — contracts pass. Not committed / not CPD’d.

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

CPD when Andre authorizes.

# Risks / Known Issues

None blocking.

# Verification Status

diningCrewInviteShare + social onboarding + diningCrews social entity + share-contract — pass.

# Resume Instructions

1. Smoke Share invite on `/account/dining-crews/:id` and onboarding after Create Dining Crew
2. On `cpd`: FE from `menubloc-frontend-main` (BE unchanged)

# Git Status

Uncommitted local FE changes.
