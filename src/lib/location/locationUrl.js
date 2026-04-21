import {
  LOCATION_MODE_CITY,
  LOCATION_MODE_GEO,
  normalizeLocation,
  isCityMode,
  isGeoMode,
  isValidCityLocation,
  isValidGeoLocation,
  isValidLocation,
} from "./locationModel.js";

function toSearchParams(searchParams) {
  if (searchParams instanceof URLSearchParams) {
    return new URLSearchParams(searchParams);
  }

  if (typeof searchParams === "string") {
    const raw = searchParams.startsWith("?") ? searchParams.slice(1) : searchParams;
    return new URLSearchParams(raw);
  }

  return new URLSearchParams();
}

function readString(params, key) {
  return String(params.get(key) || "").trim();
}

function readNumber(params, key) {
  const raw = params.get(key);
  if (raw === null || raw === undefined || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export function parseLocationFromSearch(searchParams) {
  const params = toSearchParams(searchParams);

  const rawMode = readString(params, "mode").toLowerCase();
  const city = readString(params, "city");
  const state = readString(params, "state").toUpperCase();
  const lat = readNumber(params, "lat");
  const lng = readNumber(params, "lng");
  const radius_miles = readNumber(params, "radius_miles");

  const explicitMode =
    rawMode === LOCATION_MODE_CITY || rawMode === LOCATION_MODE_GEO
      ? rawMode
      : "";

  const inferredMode =
    city && state
      ? LOCATION_MODE_CITY
      : lat !== null && lng !== null
      ? LOCATION_MODE_GEO
      : "";

  return normalizeLocation({
    mode: explicitMode || inferredMode,
    city,
    state,
    lat,
    lng,
    radius_miles,
    source: "url",
  });
}

export function serializeLocationToSearch(locationInput) {
  const location = normalizeLocation(locationInput);

  if (!isValidLocation(location)) {
    return new URLSearchParams();
  }

  const params = new URLSearchParams();

  if (isCityMode(location) && isValidCityLocation(location)) {
    params.set("mode", location.mode);
    params.set("city", location.city);
    params.set("state", location.state);
    return params;
  }

  if (isGeoMode(location) && isValidGeoLocation(location)) {
    params.set("mode", location.mode);
    params.set("lat", String(location.lat));
    params.set("lng", String(location.lng));
    if (location.radius_miles !== null) {
      params.set("radius_miles", String(location.radius_miles));
    }
    return params;
  }

  return new URLSearchParams();
}

export function mergeLocationIntoSearch(existingSearch, locationInput) {
  const params = toSearchParams(existingSearch);
  const locationParams = serializeLocationToSearch(locationInput);

  params.delete("mode");
  params.delete("city");
  params.delete("state");
  params.delete("lat");
  params.delete("lng");
  params.delete("radius_miles");
  params.delete("location_label");

  for (const [key, value] of locationParams.entries()) {
    params.set(key, value);
  }

  return params;
}
