# CPD — Restaurant profile Videos redesign

**Date:** 2026-09-19  
**Note:** Tile grid + sheet player; BE `exclude_kinds` + projection fields

## Tip / health

| Layer | Value |
|-------|--------|
| FE tip | `menubloc-frontend-8goocjg7d-menuply.vercel.app` / `index-CntBvLRp.js` |
| FE commit | `604cf921` |
| BE health | `1530cdc470f90e1de5bc0b16896d78902e4ca247` |
| BE commit | `1530cdc4` |

## Gates

```
☐ PRE-CPD GATE (results):
  E2E: PASS — lab Playwright mobile (SusieCakes): exclude_kinds=plan + limit=60, tile→sheet, video playing
  E2E live tip: PASS — same test on https://menuply.com (8.3s)
  Server: PASS — cpd-be.sh RESULT=PASS health_commit=1530cdc4… matches HEAD; live API shape has thumbnail_url/creator_key/section_name/duration_ms; no creator_user_id
```

## Content proof

Live bundle `index-CntBvLRp.js` contains `profile-video-player-sheet` and `exclude_kinds`.

## Tip-gate

apex + www: `RESULT=PASS` (via `cpd-fe.sh`)

## Verify URL

https://menuply.com/restaurants/california/los-angeles/susiecakes
