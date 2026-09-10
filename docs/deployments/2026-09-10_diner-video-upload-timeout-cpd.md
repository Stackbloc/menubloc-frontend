# CPD — Diner video upload timeout + Connect Join Me (2026-09-10)

## Scope
- **FE:** Diner/guest/owner video upload abort **5 minutes**; drop/timeout copy says stay on tab + **“This is not a length limit”** (no shorter-clip blame); soft-accept browser “too long” duration in `normalizeNativeVideoFile`; Connect-view hides Join Me chrome under followed restaurants / craving box
- **BE:** unchanged this tip (production upload path re-proved)

## Ships
| Layer | Value |
|-------|-------|
| FE path | `menubloc-frontend-main` @ clean `main` |
| FE tip commit | `f0bd699a` |
| FE tip | `menubloc-frontend-bg4jvkv15-menuply.vercel.app` / `index-kMxS0vM5.js` |
| BE health (unchanged) | `208c568d846dede1c9673982e973eef8260e62ba` |

## E2E (production)
`railway run` → `buildPhotoRecordFromUpload` (H.264 2s clip) → `createEntry` → HEAD → `deleteEntry`

```
UPLOAD { kind: 'video', backend: 'supabase', has_video: true }
INSERT { id: 32, saved: true }
HEAD 200 video/mp4
DELETE ok 32
E2E_VIDEO_RESULT=PASS
```

Live tip verify: `not a length limit` present; `shorter clip` count **0**; `profile-connect-preview-actions` **absent**.

## Gates
```
RESULT=PASS
deploy=menubloc-frontend-bg4jvkv15-menuply.vercel.app
bundle=index-kMxS0vM5.js
fe_commit=f0bd699a
tip-gate apex+www RESULT=PASS
```

## Related
- Workspace audit: `docs/audits/2026-09-10_diner-video-upload-errors-defaults-audit.md`
- Prior E2E: `docs/audits/2026-08-25_eating-video-upload-diner-media-e2e.md`
