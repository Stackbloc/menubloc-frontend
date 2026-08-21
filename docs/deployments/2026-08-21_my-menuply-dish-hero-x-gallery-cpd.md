# CPD — My Menuply dish heroes + X profile gallery

**Date:** 2026-08-21  
**Ship:** Dish photo heroes / logo fallback; Invite Me under Want; Join Me under Plans; X sheet reorder + profile gallery camera/library; My Account last.

## Deploy path

| Layer | Path | Branch | Commit | Tree at deploy |
|-------|------|--------|--------|----------------|
| FE | `menubloc-frontend-main` | `main` | `c21b76a` | clean |
| BE | `menubloc-backend-main` | `main` | `0d33a21a` | clean (path-gate PASS; honeypot WIP stashed then restored) |

## Production tip

| Field | Value |
|-------|-------|
| Deployment | `menubloc-frontend-7jj41b2cs-menuply.vercel.app` |
| Bundle | `index-Dy18r6lv.js` |
| Aliases | menuply.com, www, crm, venues |
| Tip-gate | PASS apex + www |
| Bundle smoke | railway 59 / localhost 9 |
| BE health | `0d33a21a` |

## Notes

- BE ship is logo fields only (`restaurant_logo_url` on What I Ate / Want to Eat). Unrelated suspicious-signup honeypot WIP left uncommitted on BE tree.
- No new migrations.
- Profile gallery add is via X → Native camera or Upload from library (`ProfileGalleryComposeSheet`).
