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

/**
 * Video-first Feed as `/` (default live home).
 * HomeRoot mounts Feed shell + FeedPrimaryNav; nav targets stay `/feed/*`.
 * Roll back with VITE_FEED_AS_HOME=0 (HomeNext at `/`) or VITE_USE_LEGACY_HOME=1.
 * HomeNext preserved at `/home-next`. Parallel `/feed` routes always available.
 */
export function isFeedAsHomeEnabled() {
  if (isExplicitlyFalse(import.meta.env.VITE_FEED_AS_HOME)) return false;
  if (isLegacyHomepageEnabled()) return false;
  return true;
}
