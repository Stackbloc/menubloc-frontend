# Summary

Restored **desktop Mac/Chrome in-sheet MediaRecorder** for Record video while keeping **phone OS-native `<input capture>`** (option 1). Phones unchanged.

# Problem Statement

Andre: earlier MacBook Pro Record used the FaceTime/webcam in the Menuply sheet. After Aug 24 native-OS switch, desktop Record opened the macOS file Open dialog instead.

# Root Cause

`ConsumerCameraSheet` Video mode was replaced entirely with OS `capture` input (`ee49c2e` / `598b299`) for phone reliability. Desktop Chrome ignores `capture` → file picker. Pending `controls={false}` was unrelated.

# Evidence Collected

- Live tip still had `capture` + label path only (no MediaRecorder in sheet).
- `createCameraMediaRecorder` remained in `consumerCameraCapture.js` but unused by sheet.
- Contract tests had forbidden MediaRecorder in the sheet.

# Files Examined / Changed

- `ConsumerCameraSheet.jsx` — hybrid: desktop MediaRecorder + phone native
- `consumerCameraCapture.js` — `preferNativeOsVideoCapture`, `preferDesktopInlineVideoRecord`
- `nativeVideoCapture.js` — re-export + comment
- `EatingCompose.jsx` — comment
- `test/nativeVideoCapture.test.js`, `test/menuplySocialUiContract.test.js`

# Database Queries Executed

None.

# Changes Made

Desktop (not phone UA): Video mode opens webcam live preview → Record / Stop → review → Use video.  
Phone/tablet: unchanged label → OS camera capture.

# Commits

Not committed this turn (await Andre).

# Deployment Status

Not deployed. Needs commit + `cpd-fe.sh` for menuply.com.

# Verification Results

`node --test test/nativeVideoCapture.test.js test/menuplySocialUiContract.test.js` — 29 pass.

# Remaining Risks

- Desktop MediaRecorder clips may still be WebM; Chrome playback OK, Safari may need care.
- Save/playback HEVC phone issues unchanged.
- Node has no MediaRecorder — helpers return desktopInline=false in unit env only.

# Follow-Up Work

Commit + CPD when Andre asks. Human verify Mac Record → webcam → Post.

# Final Verdict

Option 1 implemented locally. Phone path preserved. Production still on file-picker until CPD.
