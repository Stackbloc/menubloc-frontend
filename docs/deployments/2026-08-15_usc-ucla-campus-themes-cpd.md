# CPD — USC / UCLA campus Place themes

**Date:** 2026-08-15  
**Feature:** Slug-gated USC cardinal/gold + UCLA blue/gold atmospheres (Coachella/LA Live pattern)

| Layer | Value |
|-------|-------|
| FE path | `menubloc-frontend-main` @ `main` |
| FE commits | `605adb9` themes + `c0dcfb2` slug fix |
| FE tip | `menubloc-frontend-8u2p5tci4-menuply.vercel.app` |
| Live bundle | `index-b_Ovc7EK.js` |
| Aliases | menuply.com, www, crm, venues |
| BE | unchanged this CPD (`06aa0fc1` / prior feed `636a5e6e`) |
| Tip-gate | PASS apex + www |
| Exception | none |

## Notes

First `vercel --prod` failed (`clusterSlug` redeclared). Fixed and redeployed.

## Restore

```bash
npx vercel alias set menubloc-frontend-8u2p5tci4-menuply.vercel.app menuply.com
npx vercel alias set menubloc-frontend-8u2p5tci4-menuply.vercel.app www.menuply.com
```
