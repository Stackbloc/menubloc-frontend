# CPD — View Menu for unclaimed restaurants with published items

**Date:** 2026-09-03

## Shipped

| Layer | Commit / tip | Notes |
|-------|--------------|-------|
| FE | `3bd44a37` | `hasUsableActiveMenu` honors `menu_item_count` / `menus[].item_count`; profile shell passes `menuItemCount` into Add Menu context |
| FE tip | `menubloc-frontend-90sk43a1c-menuply.vercel.app` / `index-DJGcYa2Q.js` | tip-gate **PASS** apex + www |
| BE | unchanged | health `708f4370` recorded by tip-lock |

## Why

Unclaimed profiles with a live menu (Bacari West Adams `#78936`) replaced View Menu with Add Menu camera because eligibility required `has_menu === true` while public profiles only set `menu_item_count`.

## Human smoke

1. https://menuply.com/restaurants/ca/los-angeles/bacari-west-adams — hero menu icon is **View menu**, not camera
2. Tap icon → public menu (not `/menu-capture?...`)
3. Truly empty unclaimed restaurants still show Add Menu camera

## Tip lock

`scripts/lock-menuply-production-tip.sh` + tip-gate PASS. Docs-only LKG commit follows (no second `vercel --prod`).
