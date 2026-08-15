# CPD — UCLA Place Westwood courtyard (cluster FE only)

**Date:** 2026-08-15  
**Scope:** Cluster FE only — no BE deploy

| Field | Value |
|-------|-------|
| Path | `/Users/andrebarber/Desktop/menubloc/menubloc-frontend-main` @ clean `main` |
| Commit | `bd2e0a7` |
| Tip | `menubloc-frontend-dkyh8n497-menuply.vercel.app` |
| Bundle | `index-UoLq1e4f.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | PASS apex + www |
| BE | unchanged (`06aa0fc1`) |
| Exception | none |

## Feature

UCLA Place redesign distinct from USC: UCLA-only hero classes, Sora/Figtree, split-panel blue bar, courtyard bands.

## Verify

- Live bundle contains `cluster-ucla-hero`, `Westwood dining`, `cluster-theme-ucla`
- Contract: `node --test test/clusterCampusThemeContract.test.js` — 7/7 pass

## Restore

```bash
npx vercel alias set menubloc-frontend-dkyh8n497-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-dkyh8n497-menuply.vercel.app www.menuply.com
```
