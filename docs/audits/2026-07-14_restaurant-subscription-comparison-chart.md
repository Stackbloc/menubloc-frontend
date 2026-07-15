# Summary

Updated the restaurant subscription comparison chart to three columns (Published / Starter / Founder's*) with approved feature rows, prices, and Window QR Code footnote. Display-only frontend change in `PlanComparisonTable.jsx`. Not committed, pushed, or deployed.

# Problem Statement

The existing comparison chart still showed a two-column Verified vs Founder's matrix with outdated features and pricing ($299 Founder's annual), which did not match the approved marketing catalog.

# Root Cause

Chart content was hardcoded in a component-local matrix that had not been updated when plan naming (Published/Starter/Founder's) and pricing were revised.

# Evidence Collected

- Vercel-linked frontend: `menubloc-frontend` / project `menubloc-frontend` (`prj_xvvxrY8NnlHMSTrQCMM4I4fNoUxu`)
- Branch: `stabilize/frontend-safe-baseline`
- Chart mounted at `/restaurant/signup` and `/operator/subscription`
- Data source verified as component-local constants (not Stripe, DB, or backend)

# Files Examined

- `menubloc-frontend/src/components/PlanComparisonTable.jsx`
- `menubloc-frontend/src/pages/RestaurantSignupEntry.jsx`
- `menubloc-frontend/src/pages/operator/OperatorSubscription.jsx`
- `menubloc-frontend/src/App.jsx` (routes)
- `menubloc-frontend/src/lib/menuplyCheckoutPlans.js` (price labels cross-check only; not edited)
- `menubloc-frontend/.vercel/project.json`

# Database Queries Executed

None.

# Changes Made

- Replaced 2-column Verified/Founder's matrix with Published / Starter / Founder's*
- Updated all feature rows to the approved comparison set
- Added plan prices under headers
- Added footnote: `* Window QR Code included with Founder's Annual plan.`
- Added minimal `overflow-x: auto` for narrow viewports

# Commits

None (awaiting approval).

# Deployment Status

Not deployed. Local verification only via `vite preview` on port 4177.

# Verification Results

- Content assertions: PASS (columns, prices, footnote, Standard/Lowest, no Food Truck, no exact %)
- `npx eslint src/components/PlanComparisonTable.jsx`: PASS
- `npm run build`: PASS
- Playwright desktop + mobile screenshots: `menubloc-frontend/verification-output/plan-comparison-chart/{desktop,mobile}.png`
- No typecheck script in package.json (JS app); lint + build used

# Remaining Risks

- Plan selection cards above the chart still emphasize Published + Founder's only (Starter is in the comparison matrix but not a signup card CTA). Scoped out per instructions (no signup/checkout changes).
- Surrounding i18n / help-center copy may still mention Verified/Pro historically (not part of this chart file).

# Follow-Up Work

- Commit + deploy after approval
- Optionally align plan cards / checkout CTAs with Starter if product wants selection parity with the chart

# Final Verdict

Chart content update is complete locally and verified. Ready for commit/deploy approval.
