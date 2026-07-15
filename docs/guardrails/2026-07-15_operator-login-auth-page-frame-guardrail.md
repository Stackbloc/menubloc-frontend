# Operator Login AuthPageFrame Guardrail

**Date:** 2026-07-15  
**Status:** Active — ZERO-TOUCH  
**Incident:** Unauthorized redesign of `/operator/login` to light PageShell + solid blue Sign in (`d333af2` pattern). Restored to prior `AuthPageFrame` + green gradient Sign in.

## Hard rule

**`/operator/login` (`OperatorLogin.jsx`) MUST remain the dark `AuthPageFrame` consumer-auth UI with green gradient `styles.submitButton`.**

Agents may **not** change this page’s layout, shell, form chrome, or Sign in button styling unless the user’s message in the **current turn** explicitly names operator login / restaurant sign-in and describes exactly what to change.

Fixing a bug elsewhere does **not** grant permission to restyle or rewrite this page.

## Required shape (authorized)

- Shell: `AuthPageFrame` from `ConsumerAuthShared.jsx`
- Title key: `auth.operatorSignInTitle` (“Operator sign in”)
- Submit: `styles.submitButton` (green gradient — **not** `#1d4ed8` / solid blue)
- Password: shared `PasswordField` (default dark variant is correct on this page)

## Never implement without explicit user approval

- Replacing `AuthPageFrame` with `PageShell` / `BrandLogo` / light restaurant landing chrome
- Solid blue (`#1d4ed8`) or other non-authorized Sign in button on `/operator/login`
- “Restaurant Sign In” PageHero redesign on this route
- Removing or weakening `test/siteFooterNavigationContract.test.js` AuthPageFrame assertions for this page

## Before editing protected files

Output:

> **Per Operator Login AuthPageFrame guardrail: the proposed change will modify [names] and may alter the authorized `/operator/login` AuthPageFrame UI. Explicit approval required.**

Then **stop** until the user explicitly approves in the current turn.

## Protected files

- `menubloc-frontend/src/pages/operator/OperatorLogin.jsx`
- `menubloc-frontend/test/siteFooterNavigationContract.test.js` (AuthPageFrame / anti-blue assertions)

## Verification

```bash
cd menubloc-frontend && node test/siteFooterNavigationContract.test.js
```

Optional UI probe: Sign in button computed style must include green gradient (`rgb(34, 197, 94)` → `rgb(22, 163, 74)`), not solid blue `#1d4ed8`.

## Deployment note

Restoring code is incomplete until production alias is updated. After `vercel --prod`, run `npx vercel alias set <deployment-url> menuply.com` and confirm `menuply.com/operator/login`.
