# CPD — Marketplace catalog gap-fill

**Date:** 2026-07-24  
**Authorization:** Explicit user `proceed` (ship) then `cpd` (record)  
**Scope:** Catalog gap-fill only — Door Hangers + Retractable/Vinyl banners Coming Soon; hide legacy Banner; migration `0211`. No VistaPrint API, no Stripe mode change, no new routes/tables.

## Commits

| Repo | Branch | Commit | Notes |
|------|--------|--------|-------|
| menubloc-backend | `main` | `4be8b656` | Catalog + migration `0211` + tests |
| menubloc-backend | `main` | `7430ea47` | Docs handoff deploy status |
| menubloc-frontend | `feature/mds-homepage-controls` (+ `fix/marketplace-catalog-gapfill`) | `a82d1e2` | Placeholder SVGs + contract test |

**Worktrees used (clean):** `menubloc-backend-marketplace-gapfill`, `menubloc-frontend-marketplace-gapfill` — avoided dirty billboard/SD WIP on primary checkouts.

**FE note:** Marketplace UI is not on FE `main` (legacy QR-kit page). Gap-fill shipped on Marketplace feature lineage and Vercel-deployed from that tree.

## Deploy

1. **Backend** — `git push origin main` → Railway auto-deploy  
2. **Migration `0211`** — production preflight OK → `railway run … node scripts/applyOneMigration.js 20260724_0211_marketplace_catalog_gapfill.sql --allow-production`  
3. **Frontend** — `npx vercel --prod --yes` from FE gap-fill worktree → `menubloc-frontend-gltqad07l-menuply.vercel.app`  
4. **Alias** — `npx vercel alias set menubloc-frontend-gltqad07l-menuply.vercel.app menuply.com`  
   (Vercel had only aliased `grubbid.com` by default)

## Verification

| Check | Result |
|-------|--------|
| BE `/health` commit | `7430ea475f2d8ef898074b54751f01406747b143` (includes docs follow-up; feature tip `4be8b656`) |
| Migration `0211` in `schema_migrations` | Applied `2026-07-24T21:17:14.308Z` |
| SKUs present inactive | `MKT-DOOR-HANGERS`, `SIGN-RETRACTABLE-BANNER`, `SIGN-VINYL-BANNER` (`active=false`, `sellable=false`) |
| Legacy `SIGN-BANNER` | Hidden via `hide_from_operator_browse` / superseded metadata |
| menuply.com bundle | `index-shszZZc5.js` |
| Bundle API base | Railway **60** / localhost **6** |
| Placeholder SVGs on menuply.com | HTTP **200** (door hangers, retractable, vinyl) |
| Stripe production live/sandbox | **Unchanged live** |
| Waiter / OperatorLogin / Home | Untouched |

## Human verify

1. Operator → Marketplace (`/operator/qr-kits/order`)  
2. Confirm Coming Soon: Door Hangers, Retractable Banner, Vinyl Banner  
3. Confirm legacy single “Banner” card is gone  
4. Confirm QR Table Tent still purchasable  
5. Confirm no claim of VistaPrint submission after pay  

## Stripe mode statement

Stripe production configuration was **not** modified. Production remains live. No temporary sandbox configuration was activated.
