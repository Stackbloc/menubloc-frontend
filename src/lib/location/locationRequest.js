/**
 * ============================================================
 * File: src/lib/location/locationRequest.js
 * Purpose:
 *   Build API-ready location params from parsed location model.
 *   Enforces strict validity:
 *     - city/state must BOTH exist
 *     - lat/lng must BOTH be valid numbers
 *     - otherwise returns null
 * ============================================================
 */

/**
 * Safely parse a number and ensure it is finite
 */
function toValidNumber(value) {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Normalize string (trim + basic guard)
 */
function toValidString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Build API location params
 *
 * @param {Object} locationModel
 * @returns {Object|null}
 */
export function buildApiLocationParams(locationModel) {
  if (!locationModel || typeof locationModel !== "object") {
    return null;
  }

  // Extract fields safely
  const city = toValidString(locationModel.city);
  const state = toValidString(locationModel.state);
  const lat = toValidNumber(locationModel.lat);
  const lng = toValidNumber(locationModel.lng);
  const radius = toValidNumber(locationModel.radius);

  // ✅ Case 1: valid lat/lng
  if (lat !== null && lng !== null) {
    return {
      lat,
      lng,
      // optional radius fallback
      radius: radius !== null ? radius : 5,
    };
  }

  // ✅ Case 2: valid city/state
  if (city && state) {
    return {
      city,
      state,
    };
  }

  // ❌ Anything else is invalid
  return null;
}