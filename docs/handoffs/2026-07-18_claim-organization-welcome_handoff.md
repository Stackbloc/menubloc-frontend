# Objective

Acknowledge claimed restaurant identity on `/restaurant/onboarding/organization` and stop the legal-entity form from reading like a re-ask of name/city/state.

# Current Status

**LOCAL COMPLETE** — welcome gate + copy clarification; contract tests pass; not committed/deployed.

# Files Changed

- `menubloc-frontend/src/pages/RestaurantOnboardingOrganization.jsx`
- `menubloc-frontend/src/pages/RestaurantSignup.jsx`
- `menubloc-frontend/src/lib/restaurantOnboardingState.js`
- `menubloc-frontend/test/businessOrganizationOnboardingContract.test.js`
- `docs/audits/2026-07-18_claim-organization-welcome.md`
- `docs/handoffs/2026-07-18_claim-organization-welcome_handoff.md`

# Database Changes

None.

# Decisions Made

- Claimed listing identity remains on onboarding state / operator restaurants; org form stays legal-entity only.
- Welcome gate appears when restaurant display name is available; Continue reveals the form.
- Do not prefill legal entity name from Dunkin / listing name (prior legal-name guardrail preserved).

# Remaining Work

1. Commit + CPD when requested
2. User confirms Dunkin claim → org page shows welcome with name + city/state

# Risks / Known Issues

- If session lacks name/city (rare), welcome falls back to operator restaurant list fields

# Verification Status

- Contract tests: 12/12 pass

# Resume Instructions

1. CPD frontend (no backend required for this UX)
2. Probe claim → verify email → organization welcome

# Git Status

Uncommitted local FE changes.
