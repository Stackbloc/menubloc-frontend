# CPD — Site Activity unique visitors (2026-08-17)

## Summary

Site Activity and owner dashboard count **unique people**, not how many times the same person opened a page on the same day. Backend visitor key is `user_id` else durable `metadata.visitor_id` else `session_id`. The client stores `visitor_id` in localStorage and does not POST the same path for the same visitor on the same local calendar day.

## Deploy path

| Layer | Path | Branch | Commit | Tree |
|-------|------|--------|--------|------|
| FE | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` | `main` | `196dc29` | clean at `vercel --prod` (unrelated dining-hall/guest WIP stashed) |
| BE | `/Users/andrebarber/Desktop/menubloc/menubloc-backend-main` | `main` | `479ef798` | clean at push; path-gate **PASS** |

## FE tip

- Deployment: `menubloc-frontend-74hi7bc73-menuply.vercel.app`
- Bundle: `index-B7aS-oSM.js`
- Aliases: `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com`
- Tip-gate: **PASS** (apex + www)

## BE health

- Shipped SHA: `479ef798`
- Railway `/health` `commit_hash`: `479ef798afb10e7bcc52276347b5d570f6c6abc2` **MATCH**
- No migrations

## Verification

```bash
curl -s "https://menuply.com/" | grep -oE 'index-[A-Za-z0-9_-]+\.js' | head -1
# index-B7aS-oSM.js

curl -s "https://menubloc-backend-production.up.railway.app/health"
# commit_hash 479ef798afb10e7bcc52276347b5d570f6c6abc2

bash scripts/assert-menuply-production-tip.sh https://menuply.com
bash scripts/assert-menuply-production-tip.sh https://www.menuply.com
# RESULT=PASS
```

Bundle API check: `menubloc-backend-production` 59 vs `localhost:3001` 9 (PASS — railway ≫ localhost).

Tests: BE `consumerAnalyticsScope` + `siteActivityUniqueVisitorContract` 7 pass; FE `pageVisitDedupe` 1 pass. `platformIntelligence` / `ownerDashboardService` tests not run (no `DATABASE_URL` in this environment).

## User-visible surfaces

- `/owner/intelligence/site-activity` — Visitors columns; no Page views frequency
- Owner dashboard + Intelligence overview — unique visitors
- Consumer analytics POST — once per visitor + path + local day

## Not in this CPD

Dining-hall founded/copy, guest-reporting, and diner-status WIP remained stashed and was **not** shipped.

## Rollback

- FE prior tip: `menubloc-frontend-ohxjeg0sj-menuply.vercel.app` / `index-DFFHQ6JS.js` (`fc7e0f1`)
- BE prior: `b99aaad5`

## Prior tip superseded

- `menubloc-frontend-ohxjeg0sj-menuply.vercel.app` / `index-DFFHQ6JS.js` — diner sign-in invariant
