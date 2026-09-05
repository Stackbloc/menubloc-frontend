# CPD — Suppress Add Menu when public menu already has items (Northern Cafe)

**Date:** 2026-09-05

## Shipped

| Layer | Commit / tip | Notes |
|-------|--------------|-------|
| FE | `5d53ab5c` | Count `sections[].items` / live `totalMenuItemCount`; hide header Add Menu when count > 0 |
| FE tip | `menubloc-frontend-49pgkx59n-menuply.vercel.app` / `index-X7QFoP72.js` | tip-gate **PASS** |
| BE | unchanged | tip-lock recorded `17781c04` |

## Root cause

Public menu payload for Northern Cafe (#1024) kept `menus[].item_count = 0` while `sections` held 59 items. PublicMenuPage also forced `menuPreviewItems: []`, so eligibility treated it as a placeholder and showed Add Menu on the live menu page.

## Human smoke

1. https://menuply.com/restaurants/california/los-angeles/northern-cafe/menu — **no** “Add menu — use the camera…” header control
2. Hard-refresh if cached prior tip
