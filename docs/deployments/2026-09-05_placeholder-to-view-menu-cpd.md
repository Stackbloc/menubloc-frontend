# CPD — Placeholder menus flip to View Menu when items are added

**Date:** 2026-09-05

## Shipped

| Layer | Commit / tip | Notes |
|-------|--------------|-------|
| FE | `1d614de0` | Product rule: upload icon only for empty/placeholder shells; item data → View Menu; item counts win over stale `menu_ready=false` |
| FE tip | `menubloc-frontend-dqiq78g85-menuply.vercel.app` / `index-DSYjmCoE.js` | tip-gate **PASS** apex + www |
| BE | unchanged | tip-lock recorded `bf0d6754` |

## Product rule

1. Placeholder menu (0 items) → Upload/Add Menu camera  
2. After items are added → View Menu (no upload ask)

## Human smoke

1. Unclaimed restaurant with empty shell → camera upload icon  
2. Same restaurant after items exist (e.g. Bacari West Adams) → View Menu opens public menu
