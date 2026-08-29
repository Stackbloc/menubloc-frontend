# CPD — Feed desktop Log in Menuply green

**Date:** 2026-08-29

## Shipped

| Layer | Commit | Notes |
|-------|--------|-------|
| FE | `bba6e4a` | Desktop Feed rail guest **Log in** pill: red → Menuply green gradient (`#22C55E` → `#16A34A`) |
| FE tip | `menubloc-frontend-j3ypy74wl-menuply.vercel.app` / `index-wR6ffjgM.js` | tip-gate PASS apex + www |
| BE | — | FE-only; no Railway deploy |

## Human smoke

1. Desktop `/feed` (signed out): left rail **Log in** button is green, not red
2. Mobile header login chip unchanged
