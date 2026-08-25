# Summary

Production eating **video upload → DB `video_url` → durable HEAD** now **PASS**.

Root cause of prior “wired but nothing saves”: diner media fell back to Supabase bucket `menu-item-photos`, which rejected `video/mp4`. Fixed by creating `diner-media` (video MIME allowed) and routing diner uploads there (`d3449e93`).

# Problem Statement

Videos could not be posted/saved despite FE Post + BE insert code looking complete.

# Root Cause

`whatIAteTodayPhotoStorage` (and siblings) used `MENU_ITEM_PHOTO_STORAGE_BUCKET` (`menu-item-photos`) when `DINER_MEDIA_STORAGE_BUCKET` was unset. That bucket’s allowed MIME list was images only → `mime type video/mp4 is not supported` → 503 fail-closed.

# Evidence Collected

```
UPLOAD { kind: 'video', backend: 'supabase', path: '/storage/v1/object/public/diner-media/…' }
INSERT { id: 14, saved: true }
HEAD 200 video/mp4
DB { status: 'active', has_video: true, photo_url: null }
E2E_VIDEO_RESULT=PASS
```
(Probe row soft-deleted after verify.)

# Files Examined / Changed

- `whatIAteTodayPhotoStorage.js`, `wantToEatPhotoStorage.js`, `dinerAvatarStorage.js` — drop photo-bucket fallback  
- FE camera: Video-first + label capture (`a53280c`)  
- Supabase: created `diner-media` bucket  

# Changes Made

See CPD `docs/deployments/2026-08-25_video-first-camera-diner-media-cpd.md`.

# Commits

- FE `a53280c`  
- BE `d3449e93`  

# Deployment Status

Live tip `p15q2zbam` / `index-BvGoNScn.js`; BE health `d3449e93`.

# Verification Results

| Hop | Status |
|-----|--------|
| Classify video/mp4 + .mov | PASS |
| Durable upload diner-media | PASS |
| Insert `what_i_ate_today.video_url` | PASS |
| HEAD media URL | PASS 200 |
| Soft-delete | PASS |

# Remaining Risks

Phone OS camera UX still needs human smoke on device after Video-first + label change. Upload timeout 90s for very large clips.

# Follow-Up Work

Human: Record video on phone → Post → confirm meal board plays clip.

# Final Verdict

**Agent-runnable E2E for save path: PASS.** Prior code-only certification was invalid under the E2E completion contract.
