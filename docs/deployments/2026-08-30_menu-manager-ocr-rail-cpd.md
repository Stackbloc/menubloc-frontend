# CPD — Menu Manager OCR source rail restore

**Date:** 2026-08-30  
**Audit:** [../audits/2026-08-30_menu-manager-ocr-rail-regression.md](../audits/2026-08-30_menu-manager-ocr-rail-regression.md)

## Summary

Restore Tom's Watch Bar-style **Source menu** OCR evidence rail on Menu Manager Edit dishes (stop defaulting to Live menu duplicate). Fix owner upload list to resolve public ↔ authoritative restaurant ids.

## Shipped

| Layer | Path | Branch | Commit | Tip / health |
|-------|------|--------|--------|--------------|
| FE | `menubloc-frontend-main` | `main` | `6c1cf88e` | `menubloc-frontend-g3qscbxs2-menuply.vercel.app` / `index-DMYkIASQ.js` |
| FE lock docs | `menubloc-frontend-main` | `main` | (docs commit after CPD) | tip-gate PASS apex + www |
| BE | `menubloc-backend-main` | `main` | `b96bad3a` | Railway `/health` `commit_hash` = `b96bad3a…` |

## Path gates

- BE: `assert-backend-deploy-path.sh` → **PASS** @ `b96bad3a`
- FE: `cpd-fe.sh` → **RESULT=PASS**

## Bundle checks

- `preferOcrRail` present in live bundle
- `No OCR source for this menu yet` empty-state copy present
- Railway count >> localhost in bundle scan (cpd-fe tip-gate)

## Human verify

1. Hard-refresh [Menu Manager — Tom's #3684](https://menuply.com/owner/menu-manager?tab=workspace&restaurant=3684) → right rail **Source menu (N pages)** with OCR text + magnifier.
2. [Menu Manager — El Cholo #811](https://menuply.com/owner/menu-manager?tab=workspace&restaurant=811) → **Source menu** panel (empty state if no capture; not Live menu duplicate).
3. If El Cholo empty: **Update OCR** or upload PDF/photos to attach source pages.

## Prior tip

- `menubloc-frontend-4c4tz8foz-menuply.vercel.app` / `index-DTBAjN-z.js` (My Menuply Home tab)
