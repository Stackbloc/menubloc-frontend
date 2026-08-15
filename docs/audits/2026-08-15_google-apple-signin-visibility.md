# Summary

Audited all consumer Google/Apple sign-in UI surfaces. Production cannot run OAuth (BE flags off; no Vercel `VITE_*` client IDs). Shipped hide-until-configured + null-when-unconfigured harden so no dead buttons appear on any page.

# Problem Statement

Google/Apple sign-in controls were visible (or could render disabled placeholders) while providers were not enabled, violating the production working-features contract.

# Root Cause

`SocialAuthSection` / `GoogleSignInButton` previously rendered disabled Google fallbacks when `VITE_GOOGLE_CLIENT_ID` was empty. Production Vercel has no Google/Apple VITE vars; Railway `ENABLE_GOOGLE_AUTH` / `ENABLE_APPLE_AUTH` are false.

# Evidence Collected

- `vercel env ls production`: no `VITE_GOOGLE_CLIENT_ID` / `VITE_APPLE_*`
- `/health` → `optional_auth_providers.google/apple.enabled: false`
- Grep: only `ConsumerLogin` + `ConsumerSignup` mount `SocialAuthSection`; no operator/owner SSO buttons
- Other “Google” hits are Maps / Places filters, not sign-in

# Files Examined

- `ConsumerAuthShared.jsx`, `ConsumerLogin.jsx`, `ConsumerSignup.jsx`, `AppleAuthCallback.jsx`
- Operator/owner login pages (no SocialAuth)
- `consumerAuthService.js`, `db.js` optional auth status

# Database Queries Executed

None.

# Changes Made

- Hide `SocialAuthSection` when unconfigured
- `GoogleSignInButton` / `AppleSignInButton` return `null` when unconfigured
- Apple callback redirects to login when Apple not configured
- Contract tests expanded
- Tip locks + CPD

# Commits

- FE `4ed846f` — initial hide
- FE `fd9c663` — harden null-when-unconfigured

# Deployment Status

- Tip: `menubloc-frontend-8siyrjdn2-menuply.vercel.app` / `index-CTBCiaj0.js`
- Aliased menuply.com + www + crm + venues

# Verification Results

- `node --test test/consumerSocialAuthVisibilityContract.test.js` — pass
- Tip-gate after lock update — PASS expected
- Buttons cannot work end-to-end until OAuth secrets + ENABLE_* are set (documented)

# Remaining Risks

i18n strings still contain “Continue with Google/Apple” in the bundle but are not rendered without SocialAuthSection.

# Follow-Up Work

Enable OAuth with real credentials when Andre is ready; then E2E verify login/signup.

# Final Verdict

All Google/Apple **sign-in** UI references are gated: they do not appear on production pages until configured. They do not “work” yet because providers are disabled — that requires credential enablement, not more UI.
