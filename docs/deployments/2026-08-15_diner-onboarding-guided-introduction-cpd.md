# CPD — Diner onboarding guided introduction

**Date:** 2026-08-15  
**Scope:** FE + BE

| Field | Value |
|-------|-------|
| FE path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| FE commit | `2eb3c23` |
| Tip | `menubloc-frontend-p1q70m1e8-menuply.vercel.app` |
| Bundle | `index-xVp-udQI.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | PASS apex + www (after lock update) |
| BE path | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` @ clean `main` |
| BE commit / health | `25e8b850` (`commit_hash` starts with `25e8b850`) |
| Path-gate | PASS before push |
| Exception | none |

## Feature

Educate-first diner social onboarding: Welcome + optional Dining Crew create (no invite), Find People, Share Food, student .edu, people eating / cluster→subscribe→Waiter, I'm Eating, Ask Waiter. Skip introduction supported. Soft-migrate `welcome` for legacy completed progress.

## Verify

- Live bundle contains `guided introduction to Menuply`, `Welcome to Menuply`, `Create Dining Crew`
- FE `node --test test/socialOnboardingContract.test.js` — 10 pass
- BE `node --test test/socialOnboardingContract.test.js` — 1 pass
- Railway `/health` `commit_hash` starts with `25e8b850`
- API base: railway ≫ localhost in production bundle

## Restore

```bash
cd /Users/andrebarber/Desktop/menubloc/menubloc-frontend-main
npx vercel alias set menubloc-frontend-p1q70m1e8-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-p1q70m1e8-menuply.vercel.app www.menuply.com
npx vercel alias set menubloc-frontend-p1q70m1e8-menuply.vercel.app crm.menuply.com
npx vercel alias set menubloc-frontend-p1q70m1e8-menuply.vercel.app venues.menuply.com
```
