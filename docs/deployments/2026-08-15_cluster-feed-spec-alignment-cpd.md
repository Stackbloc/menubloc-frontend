# CPD — Cluster Feed specification alignment

**Date:** 2026-08-15  
**Feature:** Public Cluster Feed = diner + Menuply food activity stream (freshness, sections, no external events)

| Layer | Value |
|-------|-------|
| FE path | `menubloc-frontend-main` @ `main` |
| FE commit | `504e32e` |
| FE tip | `menubloc-frontend-2zp3dc8qr-menuply.vercel.app` |
| Live bundle | `index-BkaKyAh2.js` |
| Aliases | menuply.com, www, crm, venues |
| BE path | `menubloc-backend-main` @ `main` |
| BE commit / health | `636a5e6e` |
| Tip-gate | PASS apex (+ www follows to apex) |
| Exception | none |

## Shipped

- Spec: `docs/architecture/2026-08-15_cluster-feed-specification.md`
- Shared builder: sections, `reported_ago`, stale dining conditions (3h), safe popularity copy
- Public API: `external_events_required: false`, `crew_deals: false`, question string
- FE: “What's happening with food here?” sectioned board; no venue Links
- Waiter hierarchy: `diner_activity → public_cluster_feed → waiter → subscribers`

## Smoke

- `GET /public/clusters/ucla/feed` → `ok`, `subscription_required:false`, `external_events_required:false`
- Apex bundle contains “What's happening with food here”
- Railway `commit_hash` starts with `636a5e6e`
- Bundle API: railway ≫ localhost

## Restore

```bash
npx vercel alias set menubloc-frontend-2zp3dc8qr-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-2zp3dc8qr-menuply.vercel.app www.menuply.com
```
