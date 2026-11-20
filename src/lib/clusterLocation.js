import { parseLocation } from "./locationUtils.js";
import {
  clusterCityPath,
  clusterPath,
  FEATURED_CLUSTER_FALLBACK_SLUGS,
  toCitySlug,
  toStateSlug,
  stateDisplayName,
} from "./clusterUrl.js";
import { STATE_NAMES } from "./slugs.js";
import { readDetectedLocation } from "./discoveryLocationPersistence.js";
import { FEED_SHELL_SEARCH_PATH } from "./feedShellNavigation.js";

export const CLUSTER_DISCOVERY_LOCATION_KEY = "grubbid.discovery.location";

export function readStoredDiscoveryLocationLabel() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.sessionStorage.getItem(CLUSTER_DISCOVERY_LOCATION_KEY) || "").trim();
  } catch {
    return "";
  }
}

// 2026-11-20: fall back to the detected location (localStorage) when no city was typed,
// so the Clusters page knows the diner's market without a typed location.
function readDetectedLocationLabel() {
  if (typeof window === "undefined") return "";
  try {
    const detected = readDetectedLocation(window.localStorage);
    const city = String(detected?.city || "").trim();
    const state = String(detected?.state || "").trim();
    return city && state ? `${city}, ${state}` : "";
  } catch {
    return "";
  }
}

export function resolveClusterMarketFromStoredLocation() {
  const label = readStoredDiscoveryLocationLabel() || readDetectedLocationLabel();
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
  // 2026-11-20: no Cluster in this market → no auto-open link (the empty city page was a dead end).
  return null;
}

// 2026-11-20: "No Clusters in [City, ST]" notice. Shown when the diner's market has no Cluster.
export function marketHasCluster(clusters = [], market) {
  return Boolean(pickPrimaryClusterForMarket(clusters, market));
}

/** "Austin, TX" from a market or a { city, state } pair; "" when either part is missing. */
export function marketDisplayLabel({ city, state } = {}) {
  const c = String(city || "").trim();
  const st = String(state || "").trim();
  if (!c || !st) return "";
  return `${c}, ${stateAbbreviation(st)}`;
}

/** "tx" / "TX" / "texas" (URL slug) / "Texas" → "TX"; unknown values pass through. */
function stateAbbreviation(state) {
  const raw = String(state || "").trim();
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  const slug = toStateSlug(raw);
  const abbr = Object.keys(STATE_NAMES).find((key) => STATE_NAMES[key] === slug);
  return abbr || stateDisplayName(raw);
}

export const NO_CLUSTERS_SEARCH_PATH = FEED_SHELL_SEARCH_PATH;

export function noClustersNoticeCopy({ city, state } = {}) {
  const label = marketDisplayLabel({ city, state });
  const c = String(city || "").trim();
  if (!label) return null;
  return {
    title: `No Clusters in ${label} yet`,
    body: `Search ${c} for local restaurants and dishes.`,
    action: `Search ${c}`,
  };
}

/** Makes Search open on this city: the Search page reads this session location on load. */
export function rememberSearchMarket({ city, state } = {}) {
  const label = marketDisplayLabel({ city, state });
  if (!label || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CLUSTER_DISCOVERY_LOCATION_KEY, label);
  } catch {
    // storage blocked: Search falls back to the detected location
  }
}

export { clusterCityPath };

// 2026-11-20 (Andre): Clusters tab rule, same as the app. California is the test market, so
// California (or no known location) keeps opening the USC Cluster; outside California the tab
// opens /clusters, which shows the local Cluster link or "No Clusters in [City, ST] yet".
export const CLUSTERS_TAB_HOME_STATE = "CA";

export function clustersTabTarget(market, homeClusterPath) {
  const state = market?.state ? stateAbbreviation(market.state) : "";
  if (!state || state === CLUSTERS_TAB_HOME_STATE) return homeClusterPath;
  return "/clusters";
}
