import {
  normalizeLocation,
  isCityMode,
  isGeoMode,
  isValidCityLocation,
  isValidGeoLocation,
} from "./locationModel.js";

function titleCaseCity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatGeoNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "";
  return num.toFixed(4).replace(/\.?0+$/, "");
}

export function buildLocationLabel(locationInput) {
  const location = normalizeLocation(locationInput);

  if (isCityMode(location) && isValidCityLocation(location)) {
    return `${titleCaseCity(location.city)}, ${location.state}`;
  }

  if (isGeoMode(location) && isValidGeoLocation(location)) {
    return `${formatGeoNumber(location.lat)}, ${formatGeoNumber(location.lng)}`;
  }

  return "";
}
