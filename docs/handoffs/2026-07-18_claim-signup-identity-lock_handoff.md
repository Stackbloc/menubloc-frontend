# Objective

Lock restaurant name/city/state on `/restaurant/signup/account` when claiming an existing public listing, and bind signup to that `restaurant_id` without creating a duplicate or overwriting CK identity.

# Current Status

**CPD COMPLETE** — FE `8db345b` / `index-BXE_RkWv.js` on `menuply.com`; BE `81a76b8a` on Railway. Awaiting human claim-path confirmation.

# Files Changed

## Frontend

- `menubloc-frontend/src/pages/RestaurantPhilosophy.jsx` — forward `location.state`
- `menubloc-frontend/src/pages/RestaurantSignupEntry.jsx` — forward claim identity keys
- `menubloc-frontend/src/pages/RestaurantSignup.jsx` — prefill, lock, post `restaurant_id`
- `menubloc-frontend/test/claimSignupIdentityLockContract.test.js` — new

## Backend

- `menubloc-backend/src/routes/owner.js` — `POST /owner/profile` claim-bind branch
- `menubloc-backend/test/ownerProfileClaimBindContract.test.js` — new

## Docs

- `docs/audits/2026-07-18_claim-signup-identity-lock.md`
- `docs/handoffs/2026-07-18_claim-signup-identity-lock_handoff.md`

# Database Changes

None.

# Decisions Made

- Claim mode is gated by `restaurant_id` in router state (not merely `claim_source`).
- Phone remains editable; name/city/state are read-only in claim mode.
- Server ignores identity fields on claim-bind; only contact email + optional phone + claim_status (when allowed).
- New listing / no `restaurant_id` keeps prior create/upsert-by-email behavior.

# Remaining Work

1. Commit when requested.
2. Deploy backend (Railway) then frontend (Vercel + `menuply.com` alias).
3. Manual prod probe: unclaimed public profile → Claim → Continue → plan → account shows locked CK name/city/state; submit attaches same `restaurant_id`.

# Risks / Known Issues

- Router state lost on hard refresh of account page.
- Must ship FE + BE together; FE-only would lock fields but still risk create until BE is live.

# Verification Status

- FE contract: `claimSignupIdentityLockContract.test.js`
- BE contract: `ownerProfileClaimBindContract.test.js`
- Manual browser probe on production: not yet

# Resume Instructions

1. Confirm tests still pass.
2. Commit FE + BE + docs together.
3. Deploy BE first, then FE + alias.
4. Probe claim path on an unclaimed restaurant.

# Git Status

- FE committed + pushed: `8db345b` on `feature/mds-homepage-controls`
- BE committed + pushed: `81a76b8a` on `main`
- Deployed: Vercel + `menuply.com` alias; Railway production health reports `81a76b8a`
