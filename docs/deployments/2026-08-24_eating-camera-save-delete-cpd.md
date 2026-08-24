# CPD — Eating camera flip, durable media, hard-press delete (+ tip-lock contract)

**Date:** 2026-08-24  
**Status:** **COMPLETE**

## Summary

Ship Instagram-style camera flip, durable ate/want media (inline + Supabase), hard-press delete cascade, and the atomic tip-lock contract so agents stop panic-restoring on `bundle != locked tip`.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE feature | `menubloc-frontend-main` | `main` | `9acc99a` | tip `fa0lpz0yi` / `index-BKIe5jXc.js` |
| FE docs/locks | `menubloc-frontend-main` | `main` | `cb2c603` | tip-gate PASS (no redeploy for docs) |
| BE feature | `menubloc-backend-main` | `main` | `9901800b` | Railway |
| BE docs mirror | `menubloc-backend-main` | `main` | `362523aa` | live `/health` |

## Production tip

- Deployment: `menubloc-frontend-fa0lpz0yi-menuply.vercel.app`
- Bundle: `index-BKIe5jXc.js`
- Tip-gate: **PASS** apex + www (2026-08-24 certify)
- Lock check: **PASS**

## Verify

1. Tip-gate PASS menuply.com + www
2. Bundle railway=59 localhost=9
3. BE `/health` `362523aa`
4. Tip-lock contract + `lock-menuply-production-tip.sh` in FE `scripts/`

## Rollback

Prior tip `cey0mwaa7` / `index-BXhQToJa.js` (grouped X / Search profiles / Join Me)

## Tip lock process

`docs/guardrails/2026-08-24_production-tip-lock-atomic-contract.md` — Alias → lock tip-gate → tip-gate PASS → sync LKG. Never panic-restore on `bundle != locked tip` alone.
