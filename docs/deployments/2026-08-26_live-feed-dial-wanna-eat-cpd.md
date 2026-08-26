# CPD — Live Feed dial Wanna Eat label (2026-08-26)

## Summary

FE-only: dial channel label shortened to **Wanna Eat** (drop “What I”).

## Deploy path

| Layer | Path | Branch | Commit | Gate |
|-------|------|--------|--------|------|
| FE | menubloc-frontend-main | main | `99da88f` | tip-gate PASS |
| BE | unchanged | main | `39c9b145` | health |

## Production tip

- Deployment: `menubloc-frontend-j4woy9ljw-menuply.vercel.app`
- Bundle: `index-DUgAbVce.js`
- Tip-gate: PASS apex + www
- Prior tip: `3oyy9f75b` / `index-BZDxB_ML.js`

## Verify

1. Hard-refresh `/my-menuply` — want dial reads **Wanna Eat**

## Rollback

Prior tip `menubloc-frontend-3oyy9f75b-menuply.vercel.app` / `index-BZDxB_ML.js`
