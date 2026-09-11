# Summary
Cause-2 signed browser→Supabase PUTs were blocked by FE CSP `connect-src` missing `https://*.supabase.co`. Instant “weak cellular” toast on every video path that uses `putBlobWithProgress` to Supabase.

**Guardrail (locked):** [../guardrails/2026-09-10_video-upload-system-protection-contract.md](../guardrails/2026-09-10_video-upload-system-protection-contract.md) — agents must not modify the video upload system without Andre consent and must warn **this may affect video upload**.

# Problem Statement
Andre: all media/video upload paths fail instantly with the same connection-interrupted copy; larger files worked earlier the same day (pre–Cause-2 tip still relayed via Railway). InShot / file size ruled out for ~1s failures. Multiplier record path not yet separately confirmed.

# Root Cause
`menubloc-frontend-main/vercel.json` Content-Security-Policy `connect-src` listed Railway + analytics but not Supabase. After FE Cause 2 (`94fbfc21` diner; `8eb29b6d` Video Manager), browsers PUT to `*.supabase.co`. CSP blocks → `xhr.onerror` → `mapOwnerUploadNetworkError` / multipart mapper cellular copy (no HTTP status).

Node/Railway E2E PASS is CSP-blind.

# Evidence Collected
- Live apex CSP before fix: no `supabase.co` in `connect-src`
- Live apex CSP after CPD `f6afbgfcx`: `https://*.supabase.co` present
- Call sites: `consumerApi.js` video sign→PUT→complete; `ownerApi.js` `uploadOwnerVideo`
- Photos: still multipart to Railway (not this bug class)

# Files Examined
- `vercel.json`, `SECURITY_HEADERS.md`, `test/cspMediaSrcContract.test.js`
- `src/lib/consumerApi.js`, `ownerApi.js`, `multipartUpload.js`

# Database Queries Executed
None

# Changes Made
- Allowlist `https://*.supabase.co` in CSP `connect-src`
- Contract test asserting connect-src contains that host pattern
- FE CPD tip `f6afbgfcx` / commit `a88f2f76`

# Commits
- FE `a88f2f76` — fix(csp): allow Supabase signed PUTs in connect-src

# Deployment Status
FE CPD `RESULT=PASS` — see `docs/deployments/2026-09-10_csp-supabase-connect-src-cpd.md`

# Verification Results
- Tip-gate apex/www PASS
- Live CSP header includes `https://*.supabase.co`
- Browser upload retry: pending Andre (Multiplier + Video Manager)

# Remaining Risks
- Misleading cellular copy still maps opaque XHR errors (Cause 3)
- If Multiplier somehow bypasses Cause 2, different failure mode possible — confirm after hard refresh

# Follow-Up Work
- Andre: hard refresh → upload video (Multiplier + Video Manager)
- Optional Cause 3: distinguish CSP/CORS from true network drop in error copy

# Final Verdict
**Systemic CSP gap after Cause 2** — not InShot, not 6 MB size, not weak cellular. Fix shipped; human upload confirmation still required for E2E Complete on the upload hop.
