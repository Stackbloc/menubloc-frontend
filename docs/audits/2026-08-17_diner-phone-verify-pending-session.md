# Summary

Diner `sethb0…@gmail.com` (consumer id 36) created an account this morning and could not finish sign-in because phone verification never completed. Production has nine `pending_phone_verification` diners and **zero** `sms_verifications` rows since 2026-07-18. SMS send/verify required a cross-site pending session cookie; login also returned HTTP 403. Fix: signed first-party `phone_verification_token` on signup/login 202, accepted by `/sms/send` and `/sms/verify`.

# Problem Statement

A current diner (screen/email prefix `sethb…`) could not sign in because the phone was unverified, and the product would not let him complete phone verification either.

# Root Cause

1. Signup creates `consumer_users.status = pending_phone_verification` with no phone on the row.
2. `POST /api/consumer-auth/sms/send` required `req.session.pendingConsumerId` (cookie on Railway, third-party from menuply.com).
3. Unverified login previously returned **403** `phone_verification_required` after setting that cookie. Missing cookie → `verification_session_required`. Login copy then told the diner to **create an account**, which 409s because the email already exists.
4. Twilio env is present; the diner never got an `sms_verifications` insert, so send never reached a successful Twilio+DB write.

# Evidence Collected

Production query (authoritative pooler `sarfpagchmpychdrfgpj`, 2026-08-17):

- id 36: `pending_phone_verification`, `is_phone_verified=false`, no phone, `last_login_at` null, created `2026-08-17T08:08:43Z`
- 9 pending phone-verification accounts total
- `sms_verifications`: 5 rows ever; last send `2026-07-18` (internal hybrid diner)
- Twilio keys present in Railway production: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`

# Files Examined

- `menubloc-backend-main/src/routes/consumer/auth.js`
- `menubloc-backend-main/src/services/smsAuthService.js`
- `menubloc-frontend-main/src/pages/consumer/ConsumerLogin.jsx`
- `menubloc-frontend-main/src/components/auth/SmsAuthModal.jsx`
- Prior audits: `2026-07-05_twilio-phone-verification.md`, `2026-07-05_diner-signup-server-error.md`

# Database Queries Executed

Read-only on production via `railway run --environment production --service menubloc-backend`. Masked email/phone in agent output. No writes.

# Changes Made

- Backend: HMAC `phone_verification_token` (30 min, `SESSION_SECRET`); signup/login/google/apple return **202** with token; `/sms/send` and `/sms/verify` accept token or pending cookie
- Frontend: login uses `consumerApi` (no localhost fallback); SmsAuthModal sends the token; login-specific session error copy
- Tests: token unit + gate + diner phone flow + sms-auth-flow

# Commits

- BE `4a603a12` — `fix(auth): bind diner phone verification to a signed token.`
- FE `b8404e9` — `fix(auth): send diner phone-verification token with SMS send and verify.`
- FE docs CPD commit after tip-gate PASS

# Deployment Status

**CPD COMPLETE.** FE tip `menubloc-frontend-nax94uq0u-menuply.vercel.app` / `index-DAjZPkYd.js`. BE `4a603a12` via Railway CLI git-archive (`commit_hash` null).

# Verification Results

Contract/unit tests run in this turn (see handoff). Live SMS to the diner’s handset: not run (no number on file; requires deployed code).

# Remaining Risks

- Twilio destination/trial restrictions can still fail after send is authorized
- Phone uniqueness 409 if the number is already on another account
- Token TTL 30 minutes — diner must finish SMS in that window (can sign in again for a new token)

# Follow-Up Work

- Diner **Signs in** and completes SMS (do not manually set `is_phone_verified`)
- Optional: restore GitHub → Railway auto-deploy so `/health` `commit_hash` matches HEAD

# Final Verdict

Defect was a pending-session bind failure, not a missing account. Production now ships the signed token. The diner must still complete SMS on Sign in.
