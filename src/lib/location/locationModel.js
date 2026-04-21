export const LOCATION_MODE_CITY = "city";
export const LOCATION_MODE_GEO = "geo";
export const DEFAULT_RADIUS_MILES = 8;

const VALID_SOURCES = new Set(["url", "manual", "auto"]);
const VALID_MODES = new Set([LOCATION_MODE_CITY, LOCATION_MODE_GEO]);

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeState(value) {
  return normalizeString(value).toUpperCase();
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeSource(value) {
  const source = normalizeString(value).toLowerCase();
  return VALID_SOURCES.has(source) ? source : "manual";
}

function normalizeMode(value) {
  const mode = normalizeString(value).toLowerCase();
  return VALID_MODES.has(mode) ? mode : "";
}

function inferMode(input) {
  const hasCityFields = Boolean(normalizeString(input?.city) && normalizeState(input?.state));
  const lat = normalizeNumber(input?.lat);
  const lng = normalizeNumber(input?.lng);
  const hasGeoFields = lat !== null && lng !== null;

  if (hasCityFields) return LOCATION_MODE_CITY;
  if (hasGeoFields) return LOCATION_MODE_GEO;
  return "";
}

export function isCityMode(location) {
  return normalizeMode(location?.mode) === LOCATION_MODE_CITY;
}

export function isGeoMode(location) {
  return normalizeMode(location?.mode) === LOCATION_MODE_GEO;
}

export function isValidCityLocation(location) {
  return Boolean(normalizeString(location?.city) && normalizeState(location?.state));
}

export function isValidGeoLocation(location) {
  return normalizeNumber(location?.lat) !== null && normalizeNumber(location?.lng) !== null;
}

export function isValidLocation(location) {
  return isValidCityLocation(location) || isValidGeoLocation(location);
}

export function normalizeLocation(input = {}) {
  const explicitMode = normalizeMode(input?.mode);
  const inferredMode = inferMode(input);
  const mode = explicitMode || inferredMode;

  const normalized = {
    mode,
    city: normalizeString(input?.city),
    state: normalizeState(input?.state),
    lat: normalizeNumber(input?.lat),
    lng: normalizeNumber(input?.lng),
    radius_miles: normalizeNumber(input?.radius_miles),
    source: normalizeSource(input?.source),
  };

  if (mode === LOCATION_MODE_CITY) {
    normalized.lat = null;
    normalized.lng = null;
    normalized.radius_miles = null;
  }

  if (mode === LOCATION_MODE_GEO) {
    normalized.city = "";
    normalized.state = "";
    if (normalized.radius_miles === null) {
      normalized.radius_miles = DEFAULT_RADIUS_MILES;
    }
  }

  return normalized;
}
