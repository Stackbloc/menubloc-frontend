# CPD — Platform video caption dedupe

**Date:** 2026-09-05  
**Note:** Platform video caption once (no duplicate under poster)

## Commits / tip

| Layer | Value |
|-------|--------|
| FE feature | `8b9f62cf` — fix(feed): stop repeating Platform video under poster caption |
| FE tip-lock docs | `d3a3f6fe` — docs: lock production tip after Platform video caption CPD |
| FE tip | `menubloc-frontend-8jx5o1ja3-menuply.vercel.app` / `index-BoePqGim.js` |
| BE | unchanged (FE-only) |

## Door — `cpd-fe.sh`

```
=== CPD FE COMPLETE ===
RESULT=PASS
deploy=menubloc-frontend-8jx5o1ja3-menuply.vercel.app
bundle=index-BoePqGim.js
fe_commit=8b9f62cf
be_commit=c06f5101
```

Tip-gate apex + www: **RESULT=PASS**.

## Scope shipped

- `resolveFeedPlaceCaption` / `FeedPlaceCaption` skip place line when `food_name` equals poster label (e.g. both `"Platform video"`)
- Contract tests in `liveFeedPlatformCreator.test.js`
- Unrelated diner/discoverability WIP stashed during CPD; not shipped

## Verify

On feed managed clips that previously showed "Platform video" twice: poster line once, no echoed place caption.
