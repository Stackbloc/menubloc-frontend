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

/** US states + DC for Locations State dropdown (value = 2-letter code). */
export const US_STATE_OPTIONS = Object.freeze([
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
]);

const US_STATE_CODES = new Set(US_STATE_OPTIONS.map((o) => o.value));

/** Country options for Locations — US only for now. */
export const LOCATION_COUNTRY_OPTIONS = Object.freeze([
  { value: "US", label: "United States (US)" },
]);

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
  const state = String(form.state || "")
    .trim()
    .toUpperCase();
  if (!US_STATE_CODES.has(state)) {
    return {
      ok: false,
      missing: ["state"],
      message: "Select a valid US state.",
    };
  }
  return { ok: true, missing: [] };
}
