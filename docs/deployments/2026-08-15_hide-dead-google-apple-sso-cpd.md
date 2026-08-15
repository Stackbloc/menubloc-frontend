# CPD — Hide dead Google/Apple SSO (2026-08-15)

## Summary

Production consumer login/signup no longer show Google or Apple sign-in controls while OAuth is unconfigured. Buttons return null when FE env is missing; Apple callback redirects to login.

## Deploy path

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` |
| Branch | `main` |
| Commit | `fd9c663` (harden; prior `4ed846f` SocialAuthSection gate) |
| Tree | clean at deploy |
| Vercel | `menubloc-frontend-8siyrjdn2-menuply.vercel.app` |
| Bundle | `index-CTBCiaj0.js` |
| Aliases | menuply.com, www, crm, venues |

## Verified

- Tip-gate apex + www → PASS (after LKG lock update)
- Railway `/health`: `optional_auth_providers.google/apple.enabled: false`
- Vercel production env: no `VITE_GOOGLE_CLIENT_ID` / `VITE_APPLE_*`
- Only UI mounts: `ConsumerLogin` + `ConsumerSignup` via `SocialAuthSection`

## To make Google/Apple *work* (not just hidden)

Requires Andre-supplied credentials + flags:

1. **Vercel production:** `VITE_GOOGLE_CLIENT_ID`, and for Apple `VITE_APPLE_CLIENT_ID` + `VITE_APPLE_REDIRECT_URI`
2. **Railway:** `ENABLE_GOOGLE_AUTH=true` + `GOOGLE_CLIENT_ID(S)`; Apple: `ENABLE_APPLE_AUTH=true` + `APPLE_CLIENT_ID` / `TEAM_ID` / `KEY_ID` / `PRIVATE_KEY` / `REDIRECT_URI`
3. Rebuild FE (`vercel --prod`) after VITE_* set
4. E2E login on `/account/login` and signup

Until then, hide-until-configured is the correct production behavior under the working-features contract.
