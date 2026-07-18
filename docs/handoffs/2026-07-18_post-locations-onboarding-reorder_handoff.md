# Objective

Post-locations onboarding: upload → Menu Worksheet → profile → soft pause; deferred merchant/delivery/design (design last).

# Current Status

Implementation complete locally. Not committed / not deployed.

# Files Changed

## Backend
- `onboardingCheckpointService.js` — core vs deferred stages
- `ownedLocationsService.js` — next = menu_upload / menu-upload-choice
- tests + architecture sync

## Frontend
- `operatorOnboardingCheckpoints.js`, `restaurantInformationSchema.js`
- `PdfUploadPage.jsx`, `OperatorMenuWorksheetPage.jsx`, `OperatorProfileEditor.jsx`
- `RestaurantOnboardingProfileComplete.jsx` (new), `App.jsx`, `OperatorDashboard.jsx`
- `RestaurantSignup.jsx` post_locations_path
- contract tests

# Database Changes

None.

# Decisions Made

- Core complete at profile gate (completed or continue_later)
- Deferred stages never force login away from dashboard
- Design last in Finish setup

# Remaining Work

1. Commit FE + BE when requested
2. Deploy + alias
3. Manual E2E
4. Optionally checkpoint merchant/delivery pages on success

# Risks / Known Issues

- Legacy live restaurants use soft has_published_menu heuristics for core-complete

# Verification Status

- Run FE/BE checkpoint contract tests in session

# Resume Instructions

Verify locations Continue → menu-upload-choice; paid path still org → subscription earlier.

# Git Status

Uncommitted WIP — verify with `git status` before commit.
