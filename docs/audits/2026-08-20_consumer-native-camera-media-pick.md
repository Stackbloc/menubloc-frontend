# Summary

Consumer media attach uses a **two-path source sheet** only: **Camera** or **Upload from library**. No Menuply Photo vs Video choice — the OS (or the file) decides photo vs video. Menu/OCR upload flows are unchanged.

# Problem Statement

1. Users were forced to pick photo vs video in a custom sheet before the OS opened.
2. Media-savvy users also need a library/upload path for edited videos (not live camera only).

# Root Cause

Earlier `MenuplyMediaPicker` used four options (camera/library × photo/video). Camera-only with `capture` blocked easy library picks for pre-edited files.

# Evidence Collected

- Menu upload path uses `OperatorMenuCameraUpload.jsx`, not `MenuplyMediaPicker`
- Library path = same `accept` as camera, **without** `capture`

# Files Examined / Changed

- `menubloc-frontend-main/src/components/social/MenuplyMediaPicker.jsx`
- `menubloc-frontend-main/test/menuplySocialUiContract.test.js`

# Database Queries Executed

None.

# Changes Made

- Source sheet: **Camera** | **Upload from library** | Cancel
- Camera input: `accept` + `capture` (facingMode)
- Library input: `accept` only (photo library / files — edited video included)
- Still no Take Photo / Record Video / Choose Photo / Choose Video labels
- Photo vs video inferred via `isVideoFile` after pick

# Commits

None yet (local until requested).

# Deployment Status

Not deployed.

# Verification Results

```
node --test test/menuplySocialUiContract.test.js
→ 6 pass
```

# Remaining Risks

OS camera chrome still varies by device. Library path is the reliable way to attach CapCut/edited exports.

# Follow-Up Work

- Phone smoke: Camera + Upload from library on iOS/Android
- Separate product track: Post about as sole create layer vs My Menuply presentation
- CPD when Andre requests

# Final Verdict

**IMPLEMENTED locally** — Camera + library upload; no photo/video sheet; menu uploads exempt.
