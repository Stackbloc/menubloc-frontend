/**
 * Location-entry policy — UI helpers for the Locations onboarding stage.
 *
 * AUTHORITY: Backend `MAX_MANUAL_LOCATIONS` in
 * menubloc-backend/src/services/restaurants/locationEntryPolicy.js is authoritative.
 * The Locations workspace API returns `max_manual` + `guided_limit_messages`.
 *
 * EMERGENCY FALLBACK: If the frontend cannot load backend configuration, use
 * EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS for display/controls only.
 * This is NOT a second authoritative constant — backend still enforces the limit
 * and will reject an 11th manual location regardless of the client value.
 */

/** @deprecated Do not treat as authoritative — use workspace.max_manual from API. */
export const EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS = 10;

/**
 * @deprecated Alias of emergency fallback for older imports. Prefer resolveManualLocationLimit().
 */
export const MAX_MANUAL_LOCATIONS = EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS;

export const MANUAL_LOCATION_LIMIT_CODE = "manual_location_limit";

/**
 * Resolve the manual-entry limit for UI.
 * Prefer backend workspace.max_manual; otherwise emergency fallback + warn log.
 */
export function resolveManualLocationLimit(workspaceMaxManual) {
  const n = Number(workspaceMaxManual);
  if (Number.isInteger(n) && n > 0) {
    return { max: n, source: "backend" };
  }
  // Configuration failure — emergency UI fallback only; backend enforcement unchanged.
  console.warn(
    "[locationEntryPolicy] Backend max_manual unavailable; using emergency fallback",
    EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS
  );
  return {
    max: EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS,
    source: "emergency_fallback",
  };
}

export function canAddManualLocation(currentCount, max) {
  const limit = Number(max);
  const effective =
    Number.isInteger(limit) && limit > 0
      ? limit
      : EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS;
  return (Number(currentCount) || 0) < effective;
}

/**
 * User-facing copy derived from the resolved threshold (no hard-coded "10" in strings).
 */
export function buildManualLocationLimitMessages(max) {
  const resolved = resolveManualLocationLimit(max);
  const limit = resolved.max;
  return {
    headline: "You've reached the manual location limit.",
    body:
      `Restaurants with more than ${limit} locations are managed using Bulk Location Import ` +
      "to improve accuracy, preserve restaurant identity, and simplify onboarding.",
    primaryAction: "Import Locations",
    secondaryAction: "Back to Locations",
    short:
      `Restaurants with more than ${limit} locations are managed through Bulk Location Import ` +
      "to improve accuracy and consistency.",
  };
}

/** @deprecated prefer buildManualLocationLimitMessages(workspace.max_manual) */
export const MANUAL_LOCATION_LIMIT_MESSAGE = buildManualLocationLimitMessages(
  EMERGENCY_FALLBACK_MAX_MANUAL_LOCATIONS
).short;

export function emptyLocationForm(defaults = {}) {
  return {
    restaurant_name: defaults.restaurant_name || "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: defaults.country_code || "US",
    phone: "",
  };
}

export function validateLocationForm(form) {
  const missing = ["restaurant_name", "address_line1", "city", "state", "postal_code"].filter(
    (key) => !String(form?.[key] || "").trim()
  );
  if (missing.length) {
    return {
      ok: false,
      missing,
      message: `Please complete: ${missing.join(", ").replace(/_/g, " ")}`,
    };
  }
  return { ok: true, missing: [] };
}
