# Objective

Ship **Add Menu** contribution for unclaimed restaurants without usable menus — icon-only affordance, signed-in capture, pre-filled restaurant context, reuse public OCR pipeline.

# Current Status

**CPD COMPLETE.** Live tip `3vre2srp8` / `index-DQKfgzho.js` (`074a217`). BE health MATCH `7bff0469`. Manual diner E2E upload still recommended.

# Files Changed

## Frontend (`menubloc-frontend-main`)

| File | Notes |
|------|-------|
| `src/lib/addMenuContribution.js` | Eligibility + path builders |
| `src/lib/consumerAuthNext.js` | Safe post-login redirect |
| `src/components/icons/AddMenuIcon.jsx` | Camera+menu SVG |
| `src/components/AddMenuAction.jsx` | Auth-gated icon button |
| `src/components/AddMenuEmptyPlaceholder.jsx` | Empty menu state |
| `src/components/restaurant/publicProfile/ProfileHero.jsx` | Add Menu vs View Menu |
| `src/components/restaurant/publicProfile/PublicProfileShell.jsx` | Context + placeholder |
| `src/components/clusters/ClusterRestaurantDirectoryCard.jsx` | Cluster Add Menu |
| `src/components/clusters/ClusterRestaurantListingCard.jsx` | Listing Add Menu |
| `src/components/DiscoveryCard.jsx` | Card Add Menu |
| `src/components/FeaturedDiscoveryCard.jsx` | Featured card Add Menu |
| `src/components/MenuPreviewCard.jsx` | Preview card Add Menu |
| `src/lib/publicCardCounts.js` | Neutral “Menu not available yet” |
| `src/pages/MenuCapturePage.jsx` | Auth, locked restaurant, api.js |
| `src/pages/ConsumerLogin.jsx` / `ConsumerSignup.jsx` | `?next=` support |
| `src/lib/api.js` | `apiPostForm`, error.status |
| `src/pages/PublicMenuPage.jsx` | Empty placeholder only |
| `test/addMenuContributionContract.test.js` | New contract test |

## Backend (`menubloc-backend-main`)

| File | Notes |
|------|-------|
| `src/routes/menusClaimUploadClean.js` | Consumer auth, public id lock |
| `src/server.js` | Session on capture mount |
| `src/services/ingestion/menuCapturePublicResolve.js` | `lockedPublicRestaurantId` |
| `src/workers/menuCaptureJobWorker.js` | Pass public lock from meta |
| `src/services/clusters/clusterService.js` | `claim_status` on cards |
| `test/singleRestaurantResolutionGuardrail.test.js` | Public lock assertions |

# Database Changes

None.

# Decisions Made

- **Eligibility:** unclaimed + not dining hall + no `menu_ready` / preview / positive item count
- **Auth:** `requireConsumerAccountAuth` (account without phone verify gate) on start/page/finish
- **ID lock:** FE passes `public.restaurants.id`; BE resolves authoritative once at start, stores public id in `session_meta`
- **Resolver:** public lock branch avoids fuzzy match / duplicate public row
- **Owner supersede:** no new logic — existing `promotePublicMenuShell` on owner publish

# Remaining Work

1. Commit + CPD (FE `menubloc-frontend-main`, BE `menubloc-backend-main`) when Andre approves
2. Manual E2E: profile → Add Menu → login → capture → worker → menu visible
3. Fix or skip `menuCapturePublicResolve.test.js` without DATABASE_URL
4. Update profile hero contract tests if CI fails

# Risks / Known Issues

- Cross-origin cookie/session on capture API after deploy
- Cluster Add Menu depends on `claim_status` + `menu_ready` from enrichment — verify on live cluster page

# Verification Status

```bash
cd menubloc-frontend-main
node test/addMenuContributionContract.test.js   # PASS
npm run test:menu-experience-contract           # PASS

cd menubloc-backend-main
node test/singleRestaurantResolutionGuardrail.test.js  # PASS 5/5
```

# Resume Instructions

1. Review diff in both `-main` trees
2. Run `npm run build` in FE before CPD
3. Push BE from clean `menubloc-backend-main` @ `main`; path-gate PASS
4. `vercel --prod` + alias from `menubloc-frontend-main`
5. E2E on unclaimed restaurant without menu

# Git Status

Uncommitted local changes in `menubloc-frontend-main` and `menubloc-backend-main`. No push attempted.
