# CPD — Desktop MediaRecorder restore (2026-08-25)

## Summary

Restore Mac/desktop in-sheet webcam Record (MediaRecorder); phones keep OS-native capture.

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `7555de4` | tip-gate PASS |
| BE | unchanged | — | health `8ccf1071` | health |

## Production tip

- Deployment: `menubloc-frontend-5mf3wcui9-menuply.vercel.app`
- Bundle: `index-Cy0j2zg7.js`
- Tip-gate: PASS apex + www

## Verify

1. Mac Chrome My Menuply → Record video → live webcam (not Open file dialog)
2. Phone Record video still opens OS camera
3. tip-gate PASS

## Rollback

Prior tip `l1u8ibp3k` / `index-D3_g8ZsE.js`
