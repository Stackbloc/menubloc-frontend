# Objective

Make opted-in searchable diners findable by name, phone, and email on Find Diners; keep Connect as the connection request.

# Current Status

**COMPLETE** on authorized `main` (BE `9f997a6a`, FE `9cfd336`). Contracts pass. Connect reused; no new invite product.

# Files Changed

- `menubloc-backend-main/src/services/dinerLocation/dinerSearchService.js`
- `menubloc-backend-main/test/dinerPrimaryLocationContract.test.js`
- `menubloc-frontend-main/src/pages/consumer/FindDinersPage.jsx`
- `menubloc-frontend-main/src/pages/consumer/accountDashboard/ProfileTab.jsx`
- `menubloc-frontend-main/src/pages/consumer/accountDashboard/SocialCrewTab.jsx`
- `menubloc-frontend-main/test/dinerPrimaryLocationContract.test.js`
- `docs/audits/2026-08-20_diner-search-name-phone-email.md`
- `docs/handoffs/2026-08-20_diner-search-name-phone-email_handoff.md`

# Database Changes

None.

# Decisions Made

- Bundled with existing discoverability radios (no per-field toggles)
- Exact email only; phone E.164 / digit equality
- Reuse Find Diners search bar + Connect — no new invite product

# Remaining Work

None for this plan.

# Risks / Known Issues

None open for this scope.

# Verification Status

BE + FE `dinerPrimaryLocationContract` pass; BE on `origin/main` and in production ancestry.

# Resume Instructions

N/A — plan complete.

# Git Status

BE `9f997a6a` / FE `9cfd336` on `origin/main`.
