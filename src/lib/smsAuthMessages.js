export const SMS_AUTH_MESSAGES = Object.freeze({
  invalidCode: "Invalid code.",
  codeExpired: "Code expired. Request a new code.",
  tooManyAttempts: "Too many attempts, wait before retrying.",
  tooManySends: "Too many codes sent. Please wait a few minutes and try again.",
  sendFailed: "Unable to send code.",
  verifyFailed: "Unable to verify code.",
});

export function formatCodeSentNotice({ verificationTtlMinutes = null, expiresInSeconds = null } = {}) {
  const minutes = Number.isFinite(verificationTtlMinutes)
    ? verificationTtlMinutes
    : Number.isFinite(expiresInSeconds)
      ? Math.max(1, Math.round(expiresInSeconds / 60))
      : null;

  if (minutes != null) {
    const unit = minutes === 1 ? "minute" : "minutes";
    return `Code sent. It expires in ${minutes} ${unit}.`;
  }

  return "Code sent.";
}

export function resolveSmsAuthErrorMessage(error, fallback = SMS_AUTH_MESSAGES.verifyFailed) {
  const message = String(error?.message || "").trim();
  if (message) return message;

  if (error?.status === 404) return SMS_AUTH_MESSAGES.codeExpired;
  if (error?.status === 429) return SMS_AUTH_MESSAGES.tooManyAttempts;
  if (error?.status === 400) return SMS_AUTH_MESSAGES.invalidCode;
  return fallback;
}
