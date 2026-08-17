# CPD — Diner phone-verification token (2026-08-17)

## Summary

Shipped signed `phone_verification_token` on diner signup/login so SMS send/verify works without a cross-site pending session cookie. Unblocks pending diners (including sethb…). No account deletion or passwordless SMS login. No Stripe/env changes.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `b8404e9` | clean after commit |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `4a603a12` | clean after commit; path-gate PASS |

## FE tip

- Deployment: `menubloc-frontend-nax94uq0u-menuply.vercel.app`
- Bundle: `index-DAjZPkYd.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: PASS (apex + www) after lock update
- Bundle probe: `phone_verification_token`; Railway `60` vs `localhost:3001` `9`

## BE health

- Shipped SHA: `4a603a12`
- Railway `/health` `commit_hash`: `null` (CLI git-archive of HEAD after GitHub auto-deploy did not start; worktree `railway up` 413)
- Login empty-body smoke: HTTP 400 email/password required

## Prior tip (restore if needed)

`menubloc-frontend-kgtgek3l4-menuply.vercel.app` / `index-Br9O-thi.js`
