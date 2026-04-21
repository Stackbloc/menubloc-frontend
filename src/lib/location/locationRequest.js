import {
  normalizeLocation,
  isCityMode,
  isGeoMode,
  isValidCityLocation,
  isValidGeoLocation,
  isValidLocation,
} from "./locationModel.js";

function normalizeRadiusMiles(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function buildApiLocationParams(locationInput) {
  const location = normalizeLocation(locationInput);

  if (!isValidLocation(location)) {
    return null;
  }

  if (isCityMode(location) && isValidCityLocation(location)) {
    return {
      city: location.city,
      state: location.state,
    };
  }

  if (isGeoMode(location) && isValidGeoLocation(location)) {
    const params = {
      lat: location.lat,
      lng: location.lng,
    };

    const radiusMiles = normalizeRadiusMiles(location.radius_miles);
    if (radiusMiles !== null) {
      params.radius = radiusMiles;
    }

    return params;
  }

  return null;
}
