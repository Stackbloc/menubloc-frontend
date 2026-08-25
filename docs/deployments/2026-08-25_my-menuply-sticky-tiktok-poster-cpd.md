# CPD — Sticky My Menuply + TikTok reel + video poster fallbacks

**Date:** 2026-08-25  
**Trigger:** Andre `cpd` (all outstanding FE work)

## Shipped (FE only)

| Field | Value |
|-------|-------|
| Feature commit | `1502c00` |
| Deploy | `menubloc-frontend-1r469iprr-menuply.vercel.app` |
| Bundle | `index-CaMT7O9s.js` |
| Tip-gate | **PASS** apex + www |
| Smoke | railway=59 · localhost=9 |

### Product

- Remove duplicate white “My Menuply”; green title + live feed sticky together
- TikTok-style fullscreen (portal, cover, swipe-up next, Exit / × / Escape)
- What I’m Eating: logo / billboard / item photo still when video frame won’t decode; tap plays instantly (no download dialog)
- Live feed muted autoplay reinforced

## Backend

| Field | Value |
|-------|-------|
| Deploy | **not attempted** |
| Live health | `bbba2655` |

## Path

FE: `menubloc-frontend-main` @ `main` → `vercel --prod` → alias → tip-lock → tip-gate PASS → LKG sync (docs-only commit)
