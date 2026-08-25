# Summary

FE playback/UI fix for diner meal videos + sticky See Who’s Eating pause rules. Save path already PASS; this addresses black cards / black live feed and product “video takes precedence” (pause live, do not reorder).

# Problem Statement

Recorded clips saved to `diner-media` but appeared black / unplayable. Andre clarified precedence = meal play pauses live feed (sticky top stays). Claude second-opinion + Andre locked edge cases 2026-08-25.

# Root Cause

Two independent bugs:
1. **UI/URL** — `#t=0.001` on play `src`, possible `video_url` as `<img>`, blind `play()`, no still/unsupported UX (explains H.264 Fixins still black).
2. **Codec** — iPhone HEVC (`hvc1`) not decodable in desktop Chrome (Starbucks). Needs async server H.264 later — not this FE ship.

# Evidence Collected

Prior E2E save PASS (`2026-08-25_eating-video-upload-diner-media-e2e.md`). Product decisions: close fullscreen on meal play; pause not mute; resume same `currentTime`; A→B refcount; scroll live while meal plays keeps meal.

# Files Examined

`VideoStillPreview.jsx`, `eatingDishVisual.js`, `WhatIAteMealBoard.jsx`, `SeeWhosEatingSurface.jsx`, `SeeWhosEatingFullscreen.jsx`, `MenuplyMediaPicker.jsx`, `MyMenuplyPresentationRails.jsx`, `buildMonthInFoodModel.js`, `ImEatingAtPanel.jsx`, `menuplyLiveFeedControl.js`.

# Database Queries Executed

None this turn.

# Changes Made

- Clean play URLs (`stripMediaUrlFragment`); `#t=` only for poster extraction.
- `VideoStillPreview`: poster, `canplay`/`loadeddata` before `play()`, “Can’t preview this format” + open/download.
- Live-feed pause/resume + close fullscreen; meal play refcount.
- Sticky live feed remains at top of My Menuply.
- Month in Food / highlights: no `video_url` as `<img>`.

# Commits

Local in `menubloc-frontend-main` — not CPD’d unless Andre says `cpd`.

# Deployment Status

Not deployed.

# Verification Results

Contract tests: `eatingVideoPlaybackContract`, `seeWhosEatingContract`, `menuplySocialUiContract` (run this session).

# Remaining Risks

HEVC clips still need server async H.264 for Chrome desktop. Human device smoke after CPD.

# Follow-Up Work

Async ffmpeg transcode + status field (do not sync-block upload).

# Final Verdict

FE UI + pause contract implemented locally. Not complete for production until CPD + human smoke; HEVC destination fix still pending BE.
