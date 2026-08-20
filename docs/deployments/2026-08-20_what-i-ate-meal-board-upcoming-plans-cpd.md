# CPD — What I Ate meal board + bold Upcoming Plans (2026-08-20)

## Summary

My Menuply **What I Ate** presents a meal-period media board for the selected journal day. **Upcoming Plans** is bold: empty “None scheduled, Invite Me”; clickable plans open the month calendar; calendar icon on the section. Media picker is Camera or Upload from library (no Photo/Video sheet). **Post about** and restaurant/menu picker unchanged. No BE code deploy this CPD (migration `0277` already applied earlier for Month in Food).

## Deploy path

| Layer | Path | Branch | Commit |
|-------|------|--------|--------|
| FE | `menubloc-frontend-main` | `main` | `ff5f3ea` |
| BE | `menubloc-backend-main` | `main` | unchanged this CPD (live health `00fe4885`) |

- FE: `vercel --prod` → alias menuply.com + www + crm + venues
- Tip locks + LKG CURRENT updated to `7ljmgxgm2` / `index-CdB7Wbvg.js`

## Production verification

| Check | Result |
|-------|--------|
| FE tip | `menubloc-frontend-7ljmgxgm2-menuply.vercel.app` / `index-CdB7Wbvg.js` |
| Tip-gate apex + www | update locks then **PASS** |
| Railway `/health` `commit_hash` | `00fe4885` (no BE ship this CPD) |
| Bundle API probe | railway=61, localhost=9 |

## Human verify

1. https://menuply.com/my-menuply — What I Ate meal rows (Breakfast…Late Night) for today / prior day.
2. Upcoming Plans empty → “None scheduled, Invite Me”; with plans → bold cards open month calendar.
3. Camera icon → Camera or Upload from library (not Photo vs Video).

## Rollback

```bash
npx vercel alias set menubloc-frontend-ip7mqupae-menuply.vercel.app menuply.com
# (+ www, crm, venues)
```

Prior tip: `ip7mqupae` / `index-rdsNgKEW.js` (Want video + Month in Food; BE `f729764d` / `00fe4885`).
