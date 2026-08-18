export const CONSUMER_AUTH_ERRORS = Object.freeze({
  invalidCredentials:
    "That email or password doesn't match our records. Try again, or tap Forgot password to reset it.",
  accountInactive:
    "This account is inactive. Email support@menuply.com if you need help.",
  socialOnly:
    "This account uses Google or Apple sign-in, not a password. Use the same button you used when you joined.",
  sessionNotSaved:
    "Your sign-in worked but didn't finish saving on this device. Tap Sign in one more time.",
  authenticationRequired:
    "You're not signed in. Sign in with your email and password to continue.",
  phoneVerificationRequired:
    "Verify your phone with the one-time code we text you to finish signing in.",
  connectSessionLost:
    "Sign-in didn't finish on this page. Sign in again, then tap Link to send the connection request.",
  failedToFetch:
    "We couldn't reach Menuply. Check your connection and try again.",
  genericSignInFailed: "Sign in failed. Please try again.",
  genericSignUpFailed: "Sign up failed. Please try again.",
});

function readAuthCode(error) {
  return String(error?.payload?.code || error?.code || "").trim();
}

function readAuthMessage(error) {
  return String(error?.message || error?.payload?.error || "").trim();
}

export function resolveConsumerLoginErrorMessage(
  error,
  fallback = CONSUMER_AUTH_ERRORS.genericSignInFailed,
) {
  const code = readAuthCode(error);
  const message = readAuthMessage(error);
  const normalized = message.toLowerCase();

  if (code === "phone_verification_required") {
    return CONSUMER_AUTH_ERRORS.phoneVerificationRequired;
  }
  if (code === "session_not_saved") {
    return CONSUMER_AUTH_ERRORS.sessionNotSaved;
  }
  if (error?.status === 401 && /authentication required/i.test(message)) {
    return CONSUMER_AUTH_ERRORS.sessionNotSaved;
  }
  if (/invalid email or password/i.test(message)) {
    return CONSUMER_AUTH_ERRORS.invalidCredentials;
  }
  if (/account is inactive/i.test(message)) {
    return CONSUMER_AUTH_ERRORS.accountInactive;
  }
  if (/google|apple|reset your password/i.test(message)) {
    return CONSUMER_AUTH_ERRORS.socialOnly;
  }
  if (
    normalized === "failed to fetch" ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed")
  ) {
    return CONSUMER_AUTH_ERRORS.failedToFetch;
  }
  if (message && !normalized.includes("request failed")) {
    return message;
  }
  return fallback;
}

export function resolveConsumerConnectErrorMessage(error, inviteName = "this diner") {
  const code = readAuthCode(error);
  const message = readAuthMessage(error);

  if (code === "self_scan") {
    return "You opened your own connect invite. Share the link with someone else.";
  }
  if (code === "already_connected") {
    return `You are already connected with ${inviteName}.`;
  }
  if (code === "already_pending") {
    return `A connection request to ${inviteName} is already pending.`;
  }
  if (
    error?.status === 401 ||
    code === "auth_required" ||
    /authentication required/i.test(message)
  ) {
    return CONSUMER_AUTH_ERRORS.connectSessionLost;
  }
  if (message) return message;
  return `Unable to connect with ${inviteName}. Try signing in again.`;
}
