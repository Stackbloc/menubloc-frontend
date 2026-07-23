# CPD — Owner Growth Metrics Panel

**Date:** 2026-07-23  
**Feature:** Platform Overview Growth & conversion (abandoned Stripe plan checkouts, subscriptions by plan, diner/restaurant logins, new diner accounts; today/yesterday/7d/30d)

## Commits

| Repo | Branch | Commit |
|------|--------|--------|
| menubloc-backend | `main` | `0d183fbb` |
| menubloc-frontend | `main` (via `fix/owner-growth-metrics`) | `c063546` |

## Migration

- File: `sql/migrations/20260723_0203_owner_growth_metrics_events.sql`
- Applied to production Supabase `sarfpagchmpychdrfgpj` as part of CPD (tables `subscription_checkout_attempts`, `auth_login_events`)
- Earlier unauthorized apply was rolled back (DROP), then re-applied during CPD

## Deploy steps

1. **Backend** — `git push origin main` → Railway SUCCESS @ `0d183fbb`  
   Health: `commit_hash=0d183fbb785329144aaf1ddbd8ee958dc3146e90`
2. **Frontend** — `npx vercel --prod --yes` from clean worktree `/tmp/menubloc-fe-owner-growth-cpd` linked to `menubloc-frontend`  
   Deployment: `https://menubloc-frontend-q0f2pw0g8-menuply.vercel.app` (`dpl_9vt2q6eeGbT3BsNN5qYuEgyao8gT`)
3. **Alias** — `npx vercel alias set menubloc-frontend-q0f2pw0g8-menuply.vercel.app menuply.com`  
   (auto-aliased `grubbid.com` as well)

## Verification

| Check | Result |
|-------|--------|
| menuply.com bundle | `index-ChFW6lQ3.js` |
| Bundle contains `Growth & conversion` | yes |
| Bundle `menubloc-backend-production` / `localhost:3001` | 59 / 6 |
| Railway health commit | `0d183fbb…` |
| `GET /api/owner/dashboard/summary` without auth | 401 (expected) |

## Human verify (required)

- Open https://menuply.com/owner — confirm **Growth & conversion** section renders
- Confirm Stripe webhook includes `checkout.session.expired` (recommended for abandon labeling)

## Notes

- Login / abandoned-checkout history starts at instrumentation deploy; older windows may read zero
- Accidental first Vercel deploy hit wrong project `menubloc-fe-owner-growth-cpd` — ignored; production uses `menubloc-frontend`
