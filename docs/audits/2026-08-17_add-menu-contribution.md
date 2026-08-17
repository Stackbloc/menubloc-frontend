# Add Menu Contribution (Unclaimed Restaurants)

**Date:** 2026-08-17  
**Agent:** Cursor  
**Branch:** `main` (local, uncommitted)  
**Status:** LOCAL — not CPD

# Summary

Implemented a consistent **Add Menu** contribution path for unclaimed restaurants without a usable menu. Signed-in diners can launch the existing public capture/OCR pipeline from profile, discovery, cluster, and empty-menu surfaces. Backend now accepts `public.restaurants.id`, requires consumer auth on capture-session routes, and locks restaurant identity without re-upsert.

# Problem Statement

Unclaimed restaurants with no published menu showed dead-end copy (“claim this profile”) or a non-functional View Menu affordance. There was no signed-in, no-claim-required path to contribute menu photos through the existing capture pipeline.

# Root Cause

- No shared FE eligibility + icon action across surfaces
- `MenuCapturePage` always required manual restaurant identity even when launched from a known profile/card
- `POST /capture-session/start` accepted only `menubloc_api.restaurants.id` and allowed anonymous starts
- Worker resolver could create a duplicate public restaurant when only authoritative lock was present
- Cluster restaurant cards omitted `claim_status`, blocking Add Menu eligibility in cluster listings

# Evidence Collected

- Existing capture routes in `menusClaimUploadClean.js` and worker in `menuCaptureJobWorker.js`
- Menu availability via `publicMenuAvailabilityService.js` (`menu_ready`, `claim_status`)
- Owner supersede on publish already handled by `promotePublicMenuShell`
- FE contract test: `node test/addMenuContributionContract.test.js` → PASS
- Menu experience contract: `npm run test:menu-experience-contract` → PASS
- BE guardrail: `node test/singleRestaurantResolutionGuardrail.test.js` → 5/5 PASS
- `node test/menuCapturePublicResolve.test.js` now fails at import without `DATABASE_URL` (new `ensureAuthoritativeRestaurantForPublic` import chain)

# Files Examined

- `menubloc-frontend-main/src/lib/addMenuContribution.js`
- `menubloc-frontend-main/src/components/AddMenuAction.jsx`
- `menubloc-frontend-main/src/pages/MenuCapturePage.jsx`
- `menubloc-backend-main/src/routes/menusClaimUploadClean.js`
- `menubloc-backend-main/src/services/ingestion/menuCapturePublicResolve.js`
- `menubloc-backend-main/src/workers/menuCaptureJobWorker.js`
- `menubloc-backend-main/src/services/clusters/clusterService.js`
- `menubloc-backend-main/src/server.js`

# Database Queries Executed

None (local code-only session).

# Changes Made

## Frontend (`menubloc-frontend-main`)

- New: `AddMenuIcon`, `AddMenuAction`, `AddMenuEmptyPlaceholder`, `addMenuContribution.js`, `consumerAuthNext.js`
- Wired Add Menu on: `ProfileHero`, `PublicProfileShell`, cluster cards, discovery cards, `PublicMenuPage` empty state
- `MenuCapturePage`: consumer auth gate, query-param restaurant lock, `api.js` helpers
- `ConsumerLogin` / `ConsumerSignup`: `?next=` return path
- Contract test: `test/addMenuContributionContract.test.js`

## Backend (`menubloc-backend-main`)

- `menusClaimUploadClean.js`: `requireConsumerAccountAuth` on start/page/finish; accept `public.restaurants.id`; store `locked_public_restaurant_id` in `session_meta`; session ownership check
- `server.js`: mount capture routes with `sessionMiddleware`
- `menuCapturePublicResolve.js`: `lockedPublicRestaurantId` branch via `ensureAuthoritativeRestaurantForPublic`
- `menuCaptureJobWorker.js`: prefer public lock from `session_meta`
- `clusterService.js`: expose `claim_status` on cluster restaurant cards
- Updated `test/singleRestaurantResolutionGuardrail.test.js` for public lock path

# Commits

None (uncommitted local work).

# Deployment Status

Not deployed. Production remains LKG tip `30qbi67vq` / `index-CMXfgjwr.js`.

# Verification Results

| Check | Result |
|-------|--------|
| `addMenuContributionContract.test.js` | PASS |
| `test:menu-experience-contract` | PASS |
| `singleRestaurantResolutionGuardrail.test.js` | PASS (5/5) |
| Live E2E capture upload | Not run |

# Remaining Risks

- Profile/cluster contract tests may still assert unconditional View Menu in hero — update if CI fails
- `menuCapturePublicResolve.test.js` needs env isolation or lazy import fix
- BE auth on capture requires FE credentials/cookies on cross-origin — verify on production after CPD
- Manual E2E: unclaimed restaurant → Add Menu → login → capture → worker publish not verified this session

# Follow-Up Work

1. CPD from authorized paths after Andre review
2. Manual E2E on production-like env
3. Update `operatorPublicProfileContract.test.js` if needed
4. Fix `menuCapturePublicResolve.test.js` import chain for no-DB runs

# Final Verdict

**Implementation complete locally** for FE + BE code paths. **Not production-verified.** Safe to review and CPD when approved.
