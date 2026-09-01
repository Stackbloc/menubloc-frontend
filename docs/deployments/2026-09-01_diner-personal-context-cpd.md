# CPD — Diner personal context profile headers (2026-09-01)

## Summary
Ship optional structured personal context (class year, field, occupation, hometown) beneath diner names on My Menuply and connection profiles.

## Deploy path
| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `f8da566e` (feature), `02df64f5` (tip lock docs) | tip-gate PASS |
| BE | menubloc-backend-main | main | `6609edf3` (feature), `3a8358c9` (LKG mirror) | health SHA matched; smoke FAIL (pre-existing owner menu-console 404 probes) |

## Production tip
- Deployment: `menubloc-frontend-8eotkiscc-menuply.vercel.app`
- Bundle: `index-BE_5xCVW.js`
- Tip-gate: PASS apex + www
- Railway health: `6609edf3`

## Migration required
Run on production DB before save/API works end-to-end:

```bash
cd menubloc-backend-main
CONFIRM_PRODUCTION_TARGET=true npm run migrate
```

Migration: `20260901_0306_diner_personal_context.sql`

## Verify
1. **Account → Profile → Personal context** — add occupation or class year + hometown, save.
2. **My Menuply** (`/my-menuply` or `/feed/profile`) — lines appear under name; empty fields show nothing.
3. **Connection peer profile** — peer context visible when set.
4. Bundle check: `curl -s https://menuply.com/assets/index-BE_5xCVW.js | grep -c diner_education_status` → > 0

## Rollback
Prior tip: `menubloc-frontend-lp4iiac2t-menuply.vercel.app` / `index-BYvRnEjI.js`
