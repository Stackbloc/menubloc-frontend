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
