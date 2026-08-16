# Objective

Reframe `/account/social-onboarding` as a guided introduction to Menuply (educate first, optional participation second).

# Current Status

**CPD COMPLETE 2026-08-15** — `docs/deployments/2026-08-15_diner-onboarding-guided-introduction-cpd.md`  
Live tip: `p1q70m1e8` / `index-xVp-udQI.js` @ `2eb3c23`; BE `25e8b850`; tip-gate PASS.

# Files Changed

## Frontend (`menubloc-frontend-main`)

- `src/lib/socialOnboardingState.js` — `welcome` step; soft-migrate; `defaultDiningCrewNameFromProfile`
- `src/pages/consumer/SocialOnboardingPage.jsx` — full educational rewrite
- `test/socialOnboardingContract.test.js` — updated assertions

## Backend (`menubloc-backend-main`)

- `src/routes/consumer/socialOnboarding.js` — `welcome` in `STEP_IDS` + soft-migrate

# Database Changes

None (JSONB shape still flexible; new step id only).

# Decisions Made

1. Progress dots + “guided introduction” kicker — no `Step N of 7`
2. Create Dining Crew does not invite; name editable after create
3. Invites stay on Dining Crews product surface
4. No push/notification permission screen
5. Location education omitted — AccountWelcome / market already handle location (§12)
6. Soft-migrate: legacy completed progress auto-marks `welcome` done

# Remaining Work

1. Commit when authorized
2. CPD FE (+ BE if shipping welcome step normalize) from authorized main paths
3. Human E2E

# Risks / Known Issues

- Users mid-progress on old checklist keep pending steps; only fully completed legacy users soft-migrate welcome.

# Verification Status

- FE social onboarding contract — 10 pass
- BE social onboarding contract — 1 pass

# Resume Instructions

1. Review UX on `/account/social-onboarding` locally
2. On authorize: commit → deploy tip-gate + health
3. Smoke Continue-only and Create Dining Crew (no invite)

# Git Status

Uncommitted local changes in `menubloc-frontend-main` and `menubloc-backend-main`.
