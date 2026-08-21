# CPD — My Menuply meal photos + long-press delete (2026-08-21)

## Summary
Ship compact meal-period-ordered diary photos (prefer menu item photos), Want soft-delete, and owner-only long-press Delete across eating / want / profile media.

## Deploy path
| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `b46d3ed` | tip-gate PASS |
| BE | menubloc-backend-main | main | `a24c775c` | health `a24c775c` |

## Production tip
- Deployment: `menubloc-frontend-fli5934kq-menuply.vercel.app`
- Bundle: `index-D_zxLTdZ.js`
- Tip-gate: PASS apex + www
- Aliases: menuply.com, www, crm, venues

## Backend
- Menu item `item_photo_url` attach on What I Ate / Want / Month in Food (`31330801`)
- `DELETE /api/consumer/want-to-eat/:id` soft-delete (`a24c775c`)
- Railway `/health` `commit_hash` `a24c775c…`
- Honeypot signup WIP remains stashed (not shipped)

## Verify
1. My Menuply → What I'm Eating: compact cards, meal badge on photo, no meal-row labels; Klaudette curry uses menu item photo when no diner upload
2. Long-press (or right-click) own photo/video → Delete; hover alone does not show Delete
3. Peer hub: no Delete
4. Want cards + profile gallery: same long-press Delete

## Rollback
Prior locked tip `menubloc-frontend-a304s1jgd-menuply.vercel.app` / `index-CvkADiUB.js` (billboard fallback ship). Earlier dish-hero tip `7jj41b2cs` / `index-Dy18r6lv.js` if rolling back further.
