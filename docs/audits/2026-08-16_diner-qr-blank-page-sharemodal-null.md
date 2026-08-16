# Summary

`/account/diner-qr` rendered a full blank white page because `ShareModal` always mounts and calls `buildShareLinks(null)` while closed. Destructuring `null` threw before paint; no ErrorBoundary wrapped the route.

# Problem Statement

Human report (2026-08-16): `menuply.com/account/diner-qr` is entirely white. Account page works; My Diner QR / Share My Menuply links navigate to the blank route. Separate prior CORP hotfix addressed blank QR *image*, not blank *page*.

# Root Cause

1. `DinerQrPage` sets `shareData = null` until `payload.qr` exists.
2. It always rendered `<ShareModal shareData={shareData} />` (including while loading / missing QR).
3. `ShareModal` runs hooks before `if (!open) return null`, including `buildShareLinks(shareData)`.
4. `buildShareLinks({ title, text, url })` throws on `null`: `Cannot destructure property 'title' of 'object null'`.
5. Uncaught render error → blank document (StickyPageHeader / BottomNav never appear).

# Evidence Collected

- Reproduced throw in Node: `buildShareLinks(null)` → destructure error.
- Dining Crews / Social Onboarding already gate ShareModal behind truthy `shareData`.
- Prod QR image path `/d/:token/image` returns 200 PNG with CORP `cross-origin` (prior CORP fix intact).

# Files Examined

- `menubloc-frontend-main/src/pages/consumer/DinerQrPage.jsx`
- `menubloc-frontend-main/src/components/share/ShareModal.jsx`
- `menubloc-frontend-main/src/components/share/shareUtils.js`
- `menubloc-frontend-main/src/components/InviteToEatModal.jsx`
- Prior audit `docs/audits/2026-08-16_diner-qr-blank-card-corp-hotfix.md`

# Database Queries Executed

None for this FE crash. (Earlier probe created a personal QR for consumer user id 29 when zero rows existed.)

# Changes Made

1. `buildShareLinks` null/undefined-safe.
2. `ShareModal` calls `buildShareLinks(shareData || {})`.
3. `DinerQrPage` mounts ShareModal only when `shareData` is truthy.
4. Invite radio rows: `16px` column, `alignItems: center`, `margin: 0` on control (crooked selection polish).
5. Share contract tests for null-safe `buildShareLinks` + ShareModal guard.

# Commits

Pending (local fix; not yet committed unless Andre requests).

# Deployment Status

Not deployed. Fix is local on `menubloc-frontend-main` (also contains unpushed Phase 5 FE). Do not CPD Phase 5 until this blank-page fix ships.

# Verification Results

- `npm run test:share-contract` — run after edit.
- Manual: open `/account/diner-qr` logged in → page chrome + card (or phone-verify message), not white blank.

# Remaining Risks

- Other callers that mount ShareModal with `null` shareData while closed are now safe via `buildShareLinks` + ShareModal guard.
- Users without a QR still need phone verify / ensure path; that is a content state, not a blank crash.

# Follow-Up Work

- CPD this FE fix (and optionally Phase 5 after Andre confirms).
- Human smoke Invite selection alignment on Dining Crews Invite to Eat.

# Final Verdict

Blank `/account/diner-qr` was a ShareModal null-shareData render crash, not CORP image failure. Fix is FE-only and covered by share contract tests.
