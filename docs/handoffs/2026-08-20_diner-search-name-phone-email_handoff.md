# Objective

Make opted-in searchable diners findable by name, phone, and email on Find Diners; keep Connect as the connection request.

# Current Status

Implemented in `menubloc-backend-main` + `menubloc-frontend-main`. Contracts pass. CPD in progress.

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

CPD: commit → BE push/Railway → FE vercel --prod + alias → tip-gate + health → update LKG locks.

# Risks / Known Issues

Unrelated dirty trees existed (drinks lexicon / middleware Dunkin redirect) — stashed or left out of this commit.

# Verification Status

BE + FE `dinerPrimaryLocationContract` pass.

# Resume Instructions

If CPD interrupted: verify authorized paths clean `main`, push only this feature commits, tip-gate, update LKG.

# Git Status

(Filled at CPD.)
