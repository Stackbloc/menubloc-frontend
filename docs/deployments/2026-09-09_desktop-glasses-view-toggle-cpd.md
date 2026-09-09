# CPD — Desktop glasses view toggle next to settings (2026-09-09)

## Summary

Desktop `/feed/profile` shows the same glasses/eyes Connect↔Your view toggle as mobile, placed next to the settings gear (hover title + `?view=connect`). Mobile keeps the header control next to More.

## Commits / tips

| Layer | Value |
|-------|-------|
| FE feature | `ebac6e61` |
| FE tip | `menubloc-frontend-l9x8ftxfi-menuply.vercel.app` |
| FE bundle | `index-D0Fg9_xK.js` |
| BE (unchanged this ship) | tip-lock records `86bd9fb9` |

## Verification

- Contracts connect/eating/scan: PASS (13)
- Local build + live apex markers: `profile-view-mode-toggle`, Join Me / Take Me Out, Connect view hover title
- `cpd-fe.sh` tip-gate apex + www **RESULT=PASS**
