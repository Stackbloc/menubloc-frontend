import { parseLocation } from "./locationUtils.js";
import { clusterCityPath, toCitySlug, toStateSlug, stateDisplayName } from "./clusterUrl.js";

export const CLUSTER_DISCOVERY_LOCATION_KEY = "grubbid.discovery.location";

export function readStoredDiscoveryLocationLabel() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.sessionStorage.getItem(CLUSTER_DISCOVERY_LOCATION_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function resolveClusterMarketFromStoredLocation() {
  const label = readStoredDiscoveryLocationLabel();
  if (!label) return null;
  const parsed = parseLocation(label);
  if (!parsed.city || !parsed.state) return null;
  return {
    city: parsed.city,
    state: parsed.state,
    label,
    stateSlug: toStateSlug(parsed.state),
    citySlug: toCitySlug(parsed.city),
    stateLabel: stateDisplayName(parsed.state),
    cityPath: clusterCityPath({ state: parsed.state, city: parsed.city }),
  };
}

export { clusterCityPath };
