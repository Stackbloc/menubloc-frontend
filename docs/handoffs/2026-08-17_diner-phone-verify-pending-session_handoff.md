# Objective

Unstick diners (including sethb…) who can create an email/password account but cannot complete phone verification or sign in.

# Current Status

**LOCAL COMPLETE — not committed, not deployed.**

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

- Commit + CPD when Andre asks
- After deploy: diner signs in with email/password, enters phone, completes SMS

# Risks / Known Issues

Twilio send can still fail for invalid/blocked numbers. Unique phone 409 if number already linked.

# Verification Status

Unit/contract tests in this session. Live SMS after CPD.

# Resume Instructions

1. Run BE: `node --test test/phoneVerificationToken.test.js test/consumerPhoneVerificationGate.test.js test/smsAuthService.test.js`
2. Run FE: `node --test tests/sms-auth-flow.test.js tests/dinerPhoneVerificationFlow.test.js`
3. CPD BE from `menubloc-backend-main` then FE from `menubloc-frontend-main`
4. Ask diner to Sign in (not Create account) and complete the SMS modal

# Git Status

Dirty working trees on both authorized mains until commit.
