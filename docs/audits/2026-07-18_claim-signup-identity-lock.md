# Summary

Public restaurant claim → `/restaurant/signup/account` now preserves CK identity (name/city/state), locks those fields, and binds signup to the existing `restaurant_id` instead of creating a duplicate listing.

# Problem Statement

Users claiming a public restaurant profile reached `/restaurant/signup/account` with blank editable Restaurant Name / City / State. Submit always called `POST /owner/profile` create/upsert-by-email, which could create a new restaurant row that no longer matched the claimed CK listing.

# Root Cause

1. `RestaurantPublicPage` built full `claimPrefillState` (including `restaurant_id`).
2. `RestaurantPhilosophy` navigated to `/restaurant/signup` **without** forwarding `location.state`.
3. `RestaurantSignupEntry.proceedWithPlanCode` forwarded only `selected_plan`.
4. `RestaurantSignup` never read claim fields; `POST /owner/profile` had no claim-bind path.

# Evidence Collected

- Screenshot: `/restaurant/signup/account` with empty editable restaurant basics after claim intent.
- Code audit: state drop at `RestaurantPhilosophy.jsx` `navigate(PLAN_ROUTE)` with no state.
- Backend: `POST /owner/profile` created/updated by email only; ignored `restaurant_id`.

# Files Examined

- `menubloc-frontend/src/pages/RestaurantPublicPage.jsx` (claimPrefillState)
- `menubloc-frontend/src/pages/RestaurantPhilosophy.jsx`
- `menubloc-frontend/src/pages/RestaurantSignupEntry.jsx`
- `menubloc-frontend/src/pages/RestaurantSignup.jsx`
- `menubloc-backend/src/routes/owner.js`
- `menubloc-backend/src/routes/operator/claim.js` (409 / no identity overwrite pattern)
- `menubloc-frontend/src/pages/operator/OperatorProfileEditor.jsx` (locked identity UX)

# Database Queries Executed

None (code + contract tests only).

# Changes Made

## Frontend

- Forward `location.state` from Philosophy → plan entry.
- Forward claim identity keys through plan → account.
- Prefill + `readOnly` lock name/city/state when `restaurant_id` present; phone remains editable.
- Include `restaurant_id` in `POST /owner/profile` payload in claim mode.

## Backend

- `POST /owner/profile` claim-bind branch when `restaurant_id` > 0:
  - Load existing restaurant (404 if missing)
  - 409 if another operator already manages it
  - Update only `contact_email` / optional `phone` / `claim_status` → `claim_pending` when not claimed/rejected/hidden
  - Do **not** write name/city/state; do **not** create a new restaurant

# Commits

- Frontend: `8db345b` on `feature/mds-homepage-controls`
- Backend: `81a76b8a` on `main`

# Deployment Status

**CPD COMPLETE**

- FE: `npx vercel --prod` → `menubloc-frontend-qc790vjsu-menuply.vercel.app` → aliased `menuply.com`
- Bundle: `index-BXE_RkWv.js` (contains Protected listing identity)
- BE: Railway production online; health `commit_hash=81a76b8a08c3f36d0b67320c6c16f3051349d8f5`

# Verification Results

- FE contract: `claimSignupIdentityLockContract.test.js` — pass
- BE contract: `ownerProfileClaimBindContract.test.js` — pass
- Bundle API scan: Railway 58 / localhost 6
- Manual browser claim path: **awaiting user confirmation**

# Remaining Risks

- Claim state is still router `location.state` only — hard refresh on account page loses prefill/lock (same class of risk as plan selection).
- Authenticated operator `/operator/claim` path already binds via API and does not use this form (unchanged).

# Follow-Up Work

- Optional: persist claim identity in sessionStorage across refresh.
- User confirms claim path on production.

# Final Verdict

**CPD COMPLETE** — FE `8db345b` / `index-BXE_RkWv.js` + BE `81a76b8a` live. Awaiting human claim-path confirmation on `menuply.com`.

