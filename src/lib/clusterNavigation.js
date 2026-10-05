import { parseLocation } from "./locationUtils.js";
import { clusterPath, toCitySlug, toStateSlug } from "./clusterUrl.js";

/** Search-page cluster pill label. Change here only. */
export const CLUSTER_PILL_LABEL = "Explore clusters";

/** Location panel link to the grouped all-clusters page (/clusters). */
export const SEARCH_ALL_CLUSTERS_LABEL = "Search all clusters";

export const EXIT_CLUSTER_LABEL = "Exit Cluster";

/** Query key the search-page pill adds so the Cluster page can offer "Exit Cluster". */
export const CLUSTER_EXIT_TO_QUERY_KEY = "exitTo";

const EXIT_STORAGE_KEY = "menuply.cluster.exitTo";

/**
 * Fixed system order for cluster navigation (by slug). Clusters not listed keep
 * the backend order after these. Not alphabetical.
 */
export const CLUSTER_NAV_ORDER = Object.freeze(["usc", "lacc", "la-live"]);

/**
 * Optional one-line descriptors (by slug). Only render what is listed here —
 * never derive or invent descriptors for other clusters.
 */
export const CLUSTER_NAV_DESCRIPTORS = Object.freeze({
  usc: "USC students",
  lacc: "Convention visitors",
});

export function clusterNavDescriptor(cluster) {
  const slug = String(cluster?.slug || "").toLowerCase();
  return CLUSTER_NAV_DESCRIPTORS[slug] || "";
}

export function sortClustersForNav(clusters = []) {
  if (!Array.isArray(clusters)) return [];
  const rank = (cluster) => {
    const index = CLUSTER_NAV_ORDER.indexOf(String(cluster?.slug || "").toLowerCase());
    return index === -1 ? CLUSTER_NAV_ORDER.length : index;
  };
  return clusters
    .map((cluster, index) => ({ cluster, index }))
    .sort((a, b) => rank(a.cluster) - rank(b.cluster) || a.index - b.index)
    .map((entry) => entry.cluster);
}

/** "Los Angeles, CA" → { city, state, citySlug, stateSlug } or null when not a city+state label. */
export function marketFromLocationLabel(label) {
  const parsed = parseLocation(label);
  const city = String(parsed.city || "").trim();
  const state = String(parsed.state || "").trim().split(/\s+/)[0] || "";
  if (!city || !/^[A-Z]{2}$/.test(state)) return null;
  return { city, state, citySlug: toCitySlug(city), stateSlug: toStateSlug(state) };
}

export function clusterInMarket(cluster, market) {
  if (!cluster || !market) return false;
  return toCitySlug(cluster.city) === market.citySlug && toStateSlug(cluster.state) === market.stateSlug;
}

export function sameMarket(a, b) {
  return Boolean(a && b && a.citySlug === b.citySlug && a.stateSlug === b.stateSlug);
}

/** Cluster page link from the search page. No search text is carried over. */
export function clusterNavHref(cluster, exitTo) {
  const path = clusterPath({ state: cluster?.state, city: cluster?.city, slug: cluster?.slug });
  if (!path) return null;
  const safeExit = sanitizeExitTo(exitTo);
  if (!safeExit) return path;
  const params = new URLSearchParams();
  params.set(CLUSTER_EXIT_TO_QUERY_KEY, safeExit);
  return `${path}?${params.toString()}`;
}

export function sanitizeExitTo(value) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return "";
  return raw;
}

/**
 * Resolve where "Exit Cluster" goes for this cluster. The URL param wins and is
 * remembered for this tab so in-cluster navigation (view toggle, restaurant and
 * back) keeps the exit. Returns "" when the cluster was not entered from search.
 */
export function resolveClusterExitTo(searchParams, clusterSlug) {
  const slug = String(clusterSlug || "").toLowerCase();
  const fromParam = sanitizeExitTo(searchParams?.get(CLUSTER_EXIT_TO_QUERY_KEY));
  if (typeof window === "undefined") return fromParam;
  try {
    if (fromParam) {
      window.sessionStorage.setItem(EXIT_STORAGE_KEY, JSON.stringify({ slug, path: fromParam }));
      return fromParam;
    }
    const stored = JSON.parse(window.sessionStorage.getItem(EXIT_STORAGE_KEY) || "null");
    if (stored && stored.slug === slug) return sanitizeExitTo(stored.path);
  } catch {
    // ignore storage failures
  }
  return fromParam;
}

export function clearClusterExit() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(EXIT_STORAGE_KEY);
  } catch {
    // ignore
  }
}
