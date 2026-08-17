export const SMS_AUTH_MESSAGES = Object.freeze({
  invalidCode: "Invalid code.",
  codeExpired: "Code expired. Request a new code.",
  tooManyAttempts: "Too many attempts, wait before retrying.",
  tooManySends: "Too many codes sent. Please wait a few minutes and try again.",
  sendFailed: "Unable to send code.",
  verifyFailed: "Unable to verify code.",
  verificationSessionRequired:
    "Create your account with email and password first, then enter your phone for a one-time code.",
  verificationSessionRequiredLogin:
    "Sign in with your email and password again, then enter your phone for a one-time code.",
  verificationSessionExpired:
    "Your verification session expired. Close this window, click Create account again, and we'll text you a new code.",
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

export function resolveSmsAuthErrorMessage(error, fallback = SMS_AUTH_MESSAGES.verifyFailed, purpose = "signup") {
  const code = String(error?.payload?.code || "").trim();
  if (code === "verification_session_required") {
    return purpose === "login"
      ? SMS_AUTH_MESSAGES.verificationSessionRequiredLogin
      : SMS_AUTH_MESSAGES.verificationSessionRequired;
  }

  const message = String(error?.message || error?.payload?.error || "").trim();
  if (message) {
    if (/start signup or sign in/i.test(message)) {
      return purpose === "login"
        ? SMS_AUTH_MESSAGES.verificationSessionRequiredLogin
        : SMS_AUTH_MESSAGES.verificationSessionRequired;
    }
    return message;
  }

  if (error?.status === 404) return SMS_AUTH_MESSAGES.codeExpired;
  if (error?.status === 429) return SMS_AUTH_MESSAGES.tooManyAttempts;
  if (error?.status === 400) return SMS_AUTH_MESSAGES.invalidCode;
  return fallback;
}

export const SMS_AUTH_MODAL_COPY = Object.freeze({
  signup: {
    title: "Verify your phone",
    body: "Last step: enter your mobile number and we'll text a one-time code. Use 10 digits — no leading 1 needed.",
  },
  login: {
    title: "Verify your phone to sign in",
    body: "Enter your mobile number and we'll text a one-time code to finish signing in.",
  },
  checkout: {
    title: "Verify your phone",
    body: "Enter your mobile number and we'll text a one-time code to continue.",
  },
  changePhone: {
    title: "Change your phone",
    body: "Enter your new mobile number. We'll text a one-time code to verify it before updating your account.",
  },
});
