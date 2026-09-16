# CPD — Search video Part 2/3 + VM thumbnail + hide empty shell

**Date:** 2026-09-15  
**Status:** **CPD COMPLETE**

## Tip

| Field | Value |
|-------|--------|
| Deploy | `menubloc-frontend-8d1ow719j-menuply.vercel.app` |
| Bundle | `index-Be1VYPLO.js` |
| FE | `5bfda672` (`menubloc-frontend-main` @ `main`) |
| BE | `2827a85a` (health match; smoke 26 PASS) |

Tip-gate apex + www: **RESULT=PASS**

## Scope shipped

- Part 2: `thumbnail_url` + neutral placeholder; BE projection alias
- Part 3→revision: in-card play; empty shell **replaced** while playing; no fullscreen
- Video Manager thumbnail upload/capture/clear → `photo_url` (Andre-approved; Cause 2 PUT unchanged)

## Gates

| Gate | Result |
|------|--------|
| E2E thumbnail | `E2E_OWNER_VIDEO_THUMB_RESULT=PASS` (prior railway-run) |
| BE smoke/health | PASS / `health_commit=2827a85a…` |
| Content probe | live bundle has `search-result-video-inline-expanded`, `search-result-video-collapse`, `owner-video-thumbnail-panel`; no `search-result-video-fullscreen` |
| Tip lock | Locked from GitHub Vercel production deploy URL (agent vercel CLI blocked; Git auto-deploy already on apex) |

## Not in this tip

Part 4 in-player next/prev arrows for 2+ videos — spec reviewed, not implemented yet.

## Notes

- Agent `vercel --prod` blocked (sandbox auth.json). Production tip moved via Vercel Git integration; lock completed with `lock-menuply-production-tip.sh` after resolving deploy host from GitHub deployment statuses.
