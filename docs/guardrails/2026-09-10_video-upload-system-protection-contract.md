# Video Upload System Protection Contract

**Established:** 2026-09-10  
**Type:** Hard product-safety guardrail — video upload / Cause 2 / CSP / normalize  
**Priority:** Overrides “small CSP tweak,” hitchhiking video changes onto unrelated work, and agent judgment that upload is unaffected  
**Incident audit:** [../audits/2026-09-10_csp-missing-supabase-connect-src.md](../audits/2026-09-10_csp-missing-supabase-connect-src.md)  
**CPD:** [../deployments/2026-09-10_csp-supabase-connect-src-cpd.md](../deployments/2026-09-10_csp-supabase-connect-src-cpd.md)  
**Related:** End-to-end verification · Pre-CPD gate · Frontend API base URL · CPD playbook

---

## Incident (locked reference)

**Symptom (2026-09-10):** Every Cause-2 browser video upload failed in ~1 second with:

> Connection interrupted during upload (common on weak cellular)…

**False leads:** InShot effects, 6 MB file size, weak cellular, CORS origin gaps (Node OPTIONS/PUT to signed Supabase URLs succeeded).

**Root cause:** After Cause 2 (browser `PUT` to signed `*.supabase.co` URLs), production FE `Content-Security-Policy` `connect-src` allowed Railway but **not** `https://*.supabase.co`. The browser blocked the XHR → opaque `xhr.onerror` → misleading cellular copy. Node/Railway E2E remained CSP-blind and still PASSed.

**Fix shipped:** FE `a88f2f76` — add `https://*.supabase.co` to `vercel.json` `connect-src`; contract test in `test/cspMediaSrcContract.test.js`; tip `menubloc-frontend-f6afbgfcx-menuply.vercel.app` / `index-DJM3h8AZ.js` (same JS bundle hash is expected — CSP is a Vercel header).

**Invariant that must not regress:** Live menuply.com CSP `connect-src` **must** include `https://*.supabase.co` while any video path uses browser signed PUT to Supabase.

---

## Hard rule

**No agent may modify the Menuply video upload system (paths, storage, CSP/connect-src for uploads, sign/complete, normalize, Multiplier/Feed/Video Manager upload wiring) without Andre Barber’s explicit current-turn consent.**

Before any such edit, the agent **must** warn Andre with language that includes exactly:

> **this may affect video upload**

Silence, implied approval, prior-turn approval, “tiny header change,” hitchhiking onto unrelated FE/BE work, or agent judgment ≠ consent.

---

## Authorized architecture (do not invert without approval)

| Hop | Role |
|-----|------|
| 1 | Browser/app obtains a **signed upload URL** from Menuply API (`…/upload/sign` or diner sign routes) |
| 2 | Browser **PUT**s bytes **directly to Supabase** (`putBlobWithProgress` / Cause 2) |
| 3 | Browser calls **complete**; BE creates DB row / enqueue normalize |
| 4 | Optional async H.264 normalize (Cause 1) — **off** the upload HTTP request when async is ON |

Railway must **not** become the default byte relay for large diner/owner managed videos again without Andre naming that rollback.

Photos may still use Railway multipart — that is a different path. Do not “unify” photo and video upload without approval.

---

## Never without explicit current-turn Andre consent

- Remove or weaken `https://*.supabase.co` (or the project Supabase host) from CSP `connect-src`
- Change `putBlobWithProgress`, diner/owner sign→PUT→complete wiring, or revert Video Manager / diner video to BE-relay multipart as the default
- Change diner video normalize sync/async flags, job workers, or migrations that gate upload success
- Change Supabase bucket policies, MIME allowlists, or signed-URL TTL in ways that affect upload
- Rewrite Multiplier / Feed video compose upload, `OwnerVideoCuration` upload, or shared consumer upload helpers for video
- Hitchhike video-upload or CSP connect-src changes onto unrelated CPD

---

## Before editing protected files

Output **exactly** this warning pattern (fill in names), then **stop** until Andre approves in the **current** turn:

> **Per Video Upload System Protection Contract: the proposed change will modify [names] and this may affect video upload. Explicit Andre approval required.**

Do not start the edit until that approval is present in the current user message.

---

## Agent stop line

> This change would modify the video upload system. I have not done that. Explicit Andre consent is required, and any proposal must warn that this may affect video upload.

---

## Protected surfaces (non-exhaustive — intent matters)

### Frontend (`menubloc-frontend-main`)

- `vercel.json` — Content-Security-Policy / `connect-src` (especially Supabase)
- `SECURITY_HEADERS.md` (when documenting CSP connect-src)
- `test/cspMediaSrcContract.test.js`
- `src/lib/multipartUpload.js` (`putBlobWithProgress` and video network error mapping)
- `src/lib/consumerApi.js` (video sign→PUT→complete)
- `src/lib/ownerApi.js` (`uploadOwnerVideo`)
- `src/pages/owner/OwnerVideoCuration.jsx`
- `src/lib/feedVideoCompose.js`
- `src/components/consumer/feed/FeedVideoCreateSheet.jsx`
- `src/components/consumer/feed/FeedVideoComposeOverlay.jsx`
- `src/components/consumer/NativeVideoCapture.jsx`
- `src/lib/nativeVideoCapture.js`
- `src/lib/eatingMediaUtils.js` (when changing video upload/duration/MIME behavior)

### Backend (`menubloc-backend-main`)

- `src/services/storage/dinerMediaDirectUpload.js`
- `src/routes/consumer/mountDinerVideoDirectUpload.js`
- `src/routes/ownerVideoCuration.js` (sign / complete / upload)
- `src/services/platformVideo/**`
- `src/services/storage/dinerVideoNormalize.js`
- `src/services/storage/dinerVideoNormalizeJobs.js`
- `src/workers/dinerVideoNormalizeJobWorker.js`
- Diner video normalize migrations / `DINER_VIDEO_NORMALIZE*` env
- Related contract tests: `test/dinerMediaDirectUploadContract.test.js`, `test/dinerVideoNormalizeContract.test.js`, owner video direct-upload E2E scripts

### Also in scope by intent

Any change that alters how video bytes leave the browser, reach storage, or become playable — even if the file is not listed above.

---

## Required verification when Andre approves a change

1. Confirm live CSP `connect-src` still includes `https://*.supabase.co` (curl apex headers) if CSP or tip moved
2. Browser or authenticated E2E: sign → PUT → complete → durable URL / row (Node-only E2E is **not** enough for CSP/CORS)
3. Do not claim Complete with tip-gate PASS alone
4. Update this contract’s incident/CPD links if architecture changes

---

## Mandatory on EVERY task completion

End every response with:

> ☐ VIDEO UPLOAD CERTIFICATION: Video upload system [unchanged | Andre-approved change: …]; CSP `*.supabase.co` connect-src [unchanged present | verified live | n/a]; warning issued this turn [n/a | yes].

---

## Cross-links

- Audit: `docs/audits/2026-09-10_csp-missing-supabase-connect-src.md`
- CPD: `docs/deployments/2026-09-10_csp-supabase-connect-src-cpd.md`
- Cursor rule: `.cursor/rules/video-upload-system-protection-guardrail.mdc`
