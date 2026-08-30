# Feed shareable videos + profiles; account invite on receive — CPD

**Date:** 2026-08-30  
**FE commit:** `801c1ce` (+ lock `docs` follow-up)  
**BE commit:** `e565a7c8` (unchanged; FE-only ship)  
**FE tip:** `menubloc-frontend-r8cum35v9-menuply.vercel.app` / `index-au42pzZT.js`  
**Tip-gate:** PASS (apex + www)

## Summary

- Feed videos shareable by anyone (`/feed?clip=…` deep links + Share on reel).
- Profile owner **Share My Menuply** opens ShareModal with diner QR connect link.
- Quick invites on Feed X (LDL/LDD/LHC/MMH) for signed-in users; guests RSVP on invite landing.
- Shared content includes **Open a free Menuply account** in share text and guest landing cards.

## Verification

- Contract: `feedShareContract`, `feedShellContract`, `inviteToEatContract`, `dinerQrPhase1Contract` PASS
- Bundle API: `menubloc-backend-production` 59 · `localhost:3001` 9
- Tip-gate PASS on menuply.com + www
