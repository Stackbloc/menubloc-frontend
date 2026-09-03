# CPD — Franchise profile video fan-out + restaurant removal

**Date:** 2026-09-03  
**Layers:** BE + FE  
**Result:** COMPLETE

## Proof that counts (BE)

```
=== CPD BE COMPLETE ===
RESULT=PASS
be_commit=8f355be2
health_commit=8f355be28f66e7eced7b5d2018b5319337ecd562
```

Feature commit (included in health ancestry): `0e499f44` — feat(videos): franchise profile fan-out + restaurant removal  
Live `/health` `commit_hash` matches `8f355be2` (docs LKG sync on top of feature).

## Migration

```
Applied and tracked: 20260903_0313_restaurant_video_removals.sql
```

## FE tip

| Field | Value |
|-------|-------|
| Feature commit | `0d67a534` — feat(profile): franchise Videos section + operator remove |
| Live tip commit | `ff386540` (includes `0d67a534` as ancestor; later owner Menu Manager phone picker) |
| Deploy | `menubloc-frontend-9gt7vtirp-menuply.vercel.app` |
| Bundle | `index-CxyHUGpx.js` |
| Tip-gate apex | `RESULT=PASS` |
| Tip-gate www | `RESULT=PASS` |

Live bundle markers: `profile-videos-section`, `Videos on your profile`, `/videos`.

## Live probes

| Probe | Result |
|-------|--------|
| `GET /public/restaurants/1130/videos` | `200` `{ ok: true, restaurant_id: 1130, chain_id: 26, videos: [] }` |
| Production smoke (cpd-be) | `RESULT=PASS` passed=10 |

## What shipped

- Chain fan-out: tagged restaurant with `chain_id` → all same-chain location profiles
- Operator Remove → Feed + all profiles (`restaurant_video_removals`; deals/`managed` side effects)
- Public profile **Videos** section; What I Ate video playback
- Operator Feed Video panel: list + Remove

## Human follow-up

- Tag a franchise location video → confirm sister location profile Videos section
- Operator Remove → confirm gone from Feed + profiles
