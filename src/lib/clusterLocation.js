import { parseLocation } from "./locationUtils.js";
import {
  clusterCityPath,
  clusterPath,
  FEATURED_CLUSTER_FALLBACK_SLUGS,
  toCitySlug,
  toStateSlug,
  stateDisplayName,
} from "./clusterUrl.js";

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

export function clusterMatchesMarket(cluster, market) {
  if (!cluster || !market) return false;
  return (
    toStateSlug(cluster.state) === market.stateSlug &&
    toCitySlug(cluster.city) === market.citySlug
  );
}

export function pickPrimaryClusterForMarket(clusters = [], market) {
  if (!Array.isArray(clusters) || !market) return null;
  const inCity = clusters.filter((cluster) => clusterMatchesMarket(cluster, market));
  if (inCity.length === 0) return null;
  if (inCity.length === 1) return inCity[0];

  for (const slug of FEATURED_CLUSTER_FALLBACK_SLUGS) {
    const match = inCity.find((cluster) => String(cluster.slug || "").toLowerCase() === slug);
    if (match) return match;
  }

  return [...inCity].sort((a, b) => {
    const aCount = Number(a.directory_count ?? a.restaurant_count ?? 0);
    const bCount = Number(b.directory_count ?? b.restaurant_count ?? 0);
    if (bCount !== aCount) return bCount - aCount;
    return String(a.name || "").localeCompare(String(b.name || ""));
  })[0];
}

export function resolveClusterAutoOpenPath(clusters = [], market) {
  if (!market) return null;
  const primary = pickPrimaryClusterForMarket(clusters, market);
  if (primary) {
    const path = clusterPath({
      state: primary.state,
      city: primary.city,
      slug: primary.slug,
    });
    return path ? `${path}?view=menu` : market.cityPath;
  }
  return market.cityPath;
}

export { clusterCityPath };
