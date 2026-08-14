# Summary

Public profile Windows is temporary In-N-Out-only; compact photo; no under-photo caption.

# Problem Statement

Brand/hero billboard selection was filling Windows for all restaurants. Product intent: only In-N-Out should show Windows for now; section must not force scroll to notice.

# Root Cause

Windows reused the same splash-eligible billboard pool as entrance creatives.

# Evidence Collected

Contract tests: non–In-N-Out with general/deal/window posts → `[]`; In-N-Out chain_id 59 / name/slug → legacy active posts.

# Files Examined

`ProfileBillboardBlock.jsx`, `PublicProfileShell.jsx`, `claimedRestaurantBillboardSplash.js`, operator billboards/profile editor copy.

# Database Queries Executed

None.

# Changes Made

- `pickWindowsPosts` returns `[]` unless In-N-Out exception.
- Frame 88/104px; captions removed; section omitted when empty.
- Splash picker skips `content_type=window`.

# Commits

_(filled in CPD)_

# Deployment Status

See `docs/deployments/2026-08-14_windows-in-n-out-only-compact-cpd.md`.

# Verification Results

`node --test test/profileWindowsContract.test.js test/windowsPhotoOrientationContract.test.js test/operatorPublicProfileContract.test.js` → pass.

# Remaining Risks

In-N-Out detection relies on `chain_id === 59` or name/slug containing `in-n-out`; if public API omits `chain_id`, name/slug must match.

# Follow-Up Work

Owner/operator dedicated Windows create path (`content_type=window`) when product opens beyond In-N-Out.

# Final Verdict

Local complete; production pending CPD.
