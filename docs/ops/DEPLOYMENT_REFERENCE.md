# Deployment Reference

This file is the concise handoff for the deployment-safety work done in this repo.

## What was built

- Guarded frontend deployment commands:
  - `npm run deploy:frontend:preview`
  - `npm run deploy:frontend:production`
- Deployment preflight checks for:
  - repository path
  - git branch and cleanliness
  - expected Vercel project
  - expected production domains
  - required environment variables
  - artifact identity
- Post-deploy smoke tests for:
  - `/`
  - `/search`
  - `/browse`
  - `/owner`
  - `/api/health`
- Incident logging for failed deploys and failed smoke tests.
- Blue/green frontend release flow with rollback preservation of BLUE.
- External-watchdog-aware probe logic.
- Support for Vercel deployment protection bypass via:
  - `VERCEL_PROTECTION_BYPASS_SECRET`
  - `x-vercel-protection-bypass`

## What was deployed

The current frontend deployment-safety changes were committed and pushed to the frontend branch.

Recent commit on `safety/broken-waiter-session-2026-06-16`:

- `8708395` — `Add Vercel protection bypass support`

This commit includes:

- bypass-aware smoke probing
- docs for deployment protection and watchdog behavior
- the latest incident record from the protected-preview failure

## What was verified

- Vercel preview deployment creation works.
- The protected preview deployment remains subject to Vercel SSO/deployment protection.
- A normal client request still receives a Vercel redirect instead of app HTML.
- The bypass secret is valid for the deployment flow, but the protected preview still needs the correct project protection configuration in Vercel to be traversable by automation.

## What is still blocked

- Automated smoke validation against the protected preview path cannot be fully completed from this environment until Vercel project protection is configured consistently for automation.
- `vercel project protection` could not be read directly here because the CLI could not resolve `api.vercel.com` from this shell.

## Operational note

The repository still contains untracked `verification-output/*` files from local validation runs. They are intentionally left out of version control.

