/**
 * Frontend feature flags (Vite inlines at build time).
 * Toggle via Vercel env or .env — no code change required to roll back.
 */

function isTruthy(value) {
  return /^(1|true|yes|on)$/i.test(String(value || "").trim());
}

function isExplicitlyFalse(value) {
  return /^(0|false|no|off)$/i.test(String(value || "").trim());
}

/**
 * When true, "/" renders LegacyDiscoveryHome instead of HomeNext (rollback only).
 * HomeNext is the authoritative default. Set VITE_USE_LEGACY_HOME=1 or VITE_ENABLE_NEW_HOMEPAGE=0 to roll back.
 */
export function isLegacyHomepageEnabled() {
  if (isTruthy(import.meta.env.VITE_USE_LEGACY_HOME)) return true;
  if (isExplicitlyFalse(import.meta.env.VITE_ENABLE_NEW_HOMEPAGE)) return true;
  return false;
}

/** Default live home: HomeNext unless legacy flag is on. */
export function isNewHomepageEnabled() {
  return !isLegacyHomepageEnabled();
}
