# Objective

Unstick diners (including sethb…) who can create an email/password account but cannot complete phone verification or sign in.

# Current Status

**CPD COMPLETE — live.** FE tip `nax94uq0u` / `index-DAjZPkYd.js` (`b8404e9`). BE shipped `4a603a12` (Railway health `commit_hash` null — CLI archive).

Authorized checkouts: `menubloc-backend-main` and `menubloc-frontend-main` on `main`.

# Files Changed

Backend:

- `src/lib/phoneVerificationToken.js` (new)
- `src/routes/consumer/auth.js`
- `test/phoneVerificationToken.test.js` (new)
- `test/consumerPhoneVerificationGate.test.js`
- `docs/twilio-phone-verification.md`

Frontend:

- `src/lib/consumerApi.js`, `src/context/ConsumerContext.jsx`
- `src/components/auth/SmsAuthModal.jsx`, `src/lib/smsAuthMessages.js`
- `src/pages/consumer/ConsumerLogin.jsx`, `ConsumerSignup.jsx`, `DinerSignup.jsx`
- `tests/sms-auth-flow.test.js`, `tests/dinerPhoneVerificationFlow.test.js`

# Database Changes

None. No manual verify of id 36.

# Decisions Made

- Keep SMS as one-time phone proof; do not add passwordless SMS login
- Signed token is source of truth; pending cookie is best-effort
- Login pending response is 202 (same as signup), not 403
- Do not exempt the diner or flip `is_phone_verified` in SQL

# Remaining Work

- Human: diner **Signs in** (not Create account) and completes the SMS modal
- Optional: GitHub → Railway auto-deploy still did not stamp `/health` `commit_hash` (live code is CLI archive of `4a603a12`)

# Risks / Known Issues

Twilio send can still fail for invalid/blocked numbers. Unique phone 409 if number already linked.

# Verification Status

Unit/contract tests in the implementation turn. Tip-gate **PASS** apex + www (`index-DAjZPkYd.js`). Railway health `ok` with `commit_hash` null. Live SMS to the diner’s handset: human step remaining.

# Resume Instructions

1. Ask diner to **Sign in** (not Create account) and complete the SMS modal
2. Do not restore `kgtgek3l4` / `index-Br9O-thi.js` unless rolling back this CPD
3. Do not `railway up` from dirty `menubloc-backend/`

# Git Status

FE `b8404e9` + docs CPD commit; BE `4a603a12` shipped. Working trees expected clean after docs commits.
