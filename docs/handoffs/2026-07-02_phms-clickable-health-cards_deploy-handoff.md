# Objective
Deploy the owner PHMS improvement that makes critical health status blocks clickable so operators can jump directly to the screen or section needed for triage.

# Current Status
- Deployed to Vercel production and aliased to `menuply.com`.
- Change is live in the production bundle.
- Manual owner-authenticated UI verification is still required by product owner.

# Files Changed
- `src/pages/owner/OwnerPhms.jsx`
  - Added click routing map for PHMS health checks.
  - Made critical-health cards clickable with action hints.
  - Added clickable recent-incidents rows with same routing behavior.
  - Added in-page section anchors and smooth scroll for PHMS internal destinations.

# Database Changes
- None.

# Decisions Made
- Used explicit route/section mappings per health check ID to avoid ambiguous navigation.
- Kept behavior read-only and navigational only (no API contract changes).
- Deployed directly from current working tree to satisfy immediate deploy request.

# Remaining Work
- Owner should verify on `https://menuply.com/owner/phms` while authenticated:
  - Clicking `browse_working` opens market/search diagnosis destination.
  - Clicking `home_feed_cache` scrolls to Home Feed Cache section.
  - Clicking `home_display` scrolls to Display Audit section.
  - Recent Incidents cards route consistently with critical health cards.

# Risks / Known Issues
- Frontend repository had pre-existing unrelated uncommitted changes at deploy time.
- Vite emitted a pre-existing duplicate key warning in `MenuItemDetailPage.jsx` during build.

# Verification Status
- `npx vercel --prod --yes` succeeded.
- Deployment URL: `https://menubloc-frontend-3kyjt16lb-menuply.vercel.app`
- Alias updated: `https://menuply.com` now points to that deployment.
- Bundle hash check:
  - `src="/assets/index-CJAHhUok.js"` on `menuply.com`.
- API base URL signature check in production bundle:
  - `localhost:3001`: 6
  - `menubloc-backend-production`: 62
  - Result: passes guardrail threshold (`localhost:3001` <= 6).

# Resume Instructions
- If further routing tweaks are requested, edit `HEALTH_CHECK_NAV` in `src/pages/owner/OwnerPhms.jsx`.
- Re-deploy with:
  - `npx vercel --prod --yes`
  - `npx vercel alias set <deployment-url> menuply.com`
- Re-run post-deploy checks:
  - `curl -s "https://menuply.com/" | rg -o 'src="/assets/index-[^"]*"'`
  - Bundle API URL count probe from deployment guardrail.

# Git Status
- Branch: `stabilize/frontend-safe-baseline`
- HEAD before deploy: `23cbf0a fix(observability): allow Sentry ingestion in CSP`
- Working tree was dirty at deploy time with multiple unrelated modified/untracked files.
