# CPD — View Menu displays menu for guests; upload signed-in only

**Date:** 2026-09-05

## Shipped

| Layer | Commit / tip | Notes |
|-------|--------------|-------|
| FE | `a8d3c2e2` | Contract lock: View Menu is public Link (display menu); Add Menu / menu-capture requires consumer sign-in |
| FE tip | `menubloc-frontend-iiulswptx-menuply.vercel.app` / `index-DSYjmCoE.js` | tip-gate **PASS** apex + www (bundle hash unchanged — comment/tests only) |
| BE | unchanged | tip-lock recorded `7623c631` |

## Product rule

- **View Menu** → opens/displays public menu for everyone (including guests); never upload
- **Upload/Add Menu** → placeholder/empty only; signed-in diners only

## Human smoke

1. Guest on Bacari West Adams → View Menu opens menu (no login)
2. Placeholder empty unclaimed → Add Menu → login required before capture
