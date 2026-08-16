# CPD — Dining Crew invite ShareModal (replace prototype)

**Date:** 2026-08-16  
**Scope:** FE (invite share UX). BE unchanged for this feature.

| Field | Value |
|-------|-------|
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| FE commit | `4ec654f` (feature since `bd3a8e5`; tip also includes `42c415b` diner-qr fix) |
| Tip | `menubloc-frontend-nzkm72fy0-menuply.vercel.app` |
| Bundle | `index-DyvhJLLC.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | PASS apex + www |
| BE health | `45123b8c` (unchanged for invite-share; not pushed from dirty BE tree) |
| Path-gate BE | not run for push (FE-only CPD; BE working tree has unrelated untracked files) |
| Exception | none |

## Feature

Prototype Dining Crew invite (raw URL + member id) → ShareModal Share invite. Optional on onboarding.

## Verify

- Live: `Share invite`, `dining-crew-share-invite`, `Join my Dining Crew on Menuply`
- Tip-gate PASS apex + www (reconfirmed after restoring aliases from transient `index-Cx2bTWAc.js` drift)

## Restore

```bash
npx vercel alias set menubloc-frontend-nzkm72fy0-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-nzkm72fy0-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-nzkm72fy0-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-nzkm72fy0-menuply.vercel.app venues.menuply.com
```
