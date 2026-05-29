import { isActiveMarket } from "../config/activeMarkets.js";
import { parseLocation } from "./locationUtils.js";

/**
 * Resolve city/state for market checks from an explicit label and/or auto-detected geo.
 */
export function resolveDiscoveryMarketLocation({
  explicitLabel = "",
  autoLocation = null,
  useAutoGeo = false,
} = {}) {
  const label = String(explicitLabel || "").trim();
  if (label) {
    const parsed = parseLocation(label);
    if (parsed.city && parsed.state) {
      return { city: parsed.city, state: parsed.state };
    }
    if (parsed.city) {
      return { city: parsed.city, state: parsed.state || "" };
    }
  }

  if (useAutoGeo && autoLocation) {
    const city = String(autoLocation.city || "").trim();
    const state = String(autoLocation.state || "").trim().toUpperCase();
    if (city && state) return { city, state };
    if (city) return { city, state: "" };
  }

  return null;
}

/** True when we can tell the market is outside LA County / Dothan. */
export function isOutOfMarketSearch(location) {
  if (!location?.city) return false;
  if (!location.state) return false;
  return !isActiveMarket(location);
}

export function buildOutOfMarketJoinPath(location) {
  const params = new URLSearchParams();
  if (location?.city) params.set("city", location.city);
  if (location?.state) params.set("state", location.state);
  const qs = params.toString();
  return qs ? `/join?${qs}` : "/join";
}

/**
 * True when two resolved locations should share the same discovery browse scope.
 * LA County cities share one scope (radius around device). Dothan only matches Dothan.
 */
export function activeMarketsShareBrowseScope(locationA, locationB) {
  const cityA = String(locationA?.city || "").trim().toLowerCase();
  const stateA = String(locationA?.state || "").trim().toUpperCase();
  const cityB = String(locationB?.city || "").trim().toLowerCase();
  const stateB = String(locationB?.state || "").trim().toUpperCase();
  if (!cityA || !stateA || !cityB || !stateB) return false;

  const locA = { city: cityA, state: stateA };
  const locB = { city: cityB, state: stateB };
  if (!isActiveMarket(locA) || !isActiveMarket(locB)) return false;
  if (stateA !== stateB) return false;

  if (stateA === "AL") return cityA === cityB;
  if (stateA === "CA") return true;

  return cityA === cityB;
}
