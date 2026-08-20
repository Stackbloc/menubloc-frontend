# CPD — Camera meal slots + time-aware What I Ate rows

**Date:** 2026-08-20  
**Command:** `cpd` (after camera-first recommendation + dynamic meal rows)

## Deploy path

| Layer | Path | Branch | Commit |
|-------|------|--------|--------|
| FE | `menubloc-frontend-main` | `main` | `990fc76` |
| BE | _(unchanged)_ | — | live health `ed869d91` |

## Ship summary

- Empty What I Ate meal slots: camera icon → native `capture` → compose with meal + file
- `+ Log` remains text-first compose
- Post about last item: **Upload from library** (`?compose=ate&media=library`)
- Meal rows appear by time of day (hide future empty periods; keep earlier for backfill; past days show full set; filled periods always show)

## Production tip

| Field | Value |
|-------|-------|
| FE tip | `menubloc-frontend-l7pg7dpir-menuply.vercel.app` / `index-C18CZMc2.js` |
| Aliases | `menuply.com`, `www.menuply.com`, `crm.menuply.com`, `venues.menuply.com` |
| Tip-gate | PASS (apex + www) |
| BE health | `ed869d91` (no BE feature deploy) |

## Prior tip (rollback)

`menubloc-frontend-7ljmgxgm2-menuply.vercel.app` / `index-CdB7Wbvg.js` (`ff5f3ea`)
