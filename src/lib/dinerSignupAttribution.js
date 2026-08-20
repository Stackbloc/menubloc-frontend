/** @returns {string|null} External referrer URL, excluding same-site hops. */
export function captureExternalReferrer() {
  if (typeof document === "undefined") return null;
  const raw = String(document.referrer || "").trim();
  if (!raw) return null;
  try {
    const ref = new URL(raw);
    const host = ref.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".menuply.com") || host === "menuply.com") {
      return null;
    }
    return raw.slice(0, 500);
  } catch {
    return null;
  }
}

/**
 * Payload fields for consumer signup attribution.
 * @param {{ fromQrConnect?: boolean, signupPage?: "diner" | "account" }} options
 */
export function buildDinerSignupAttribution(options = {}) {
  const { fromQrConnect = false, signupPage = "account" } = options;
  let signup_source = "account_signup";
  if (fromQrConnect) signup_source = "diner_qr_connect";
  else if (signupPage === "diner") signup_source = "diner_signup_page";

  const referral_source = captureExternalReferrer();
  return { signup_source, referral_source };
}
