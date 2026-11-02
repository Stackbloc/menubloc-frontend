/** True when an auth response (or an error's payload) asks for email verification (2026-10-24). */
export function needsEmailVerification(payload) {
  return payload?.code === "email_verification_required" || payload?.requires_email_verification === true;
}
