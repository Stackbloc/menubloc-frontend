import { toCitySlug, toStateSlug, STATE_NAMES } from "./slugs.js";

export { toCitySlug, toStateSlug };

export function stateDisplayName(state) {
  const abbr = String(state || "").trim().toUpperCase();
  const slug = STATE_NAMES[abbr];
  if (!slug) {
    return String(state || "")
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function clusterDirectoryPath() {
  return "/clusters";
}

export function clusterPath({ state, city, slug }) {
  const stateSlug = toStateSlug(state);
  const citySlug = toCitySlug(city);
  const clusterSlug = String(slug || "").trim();
  if (!stateSlug || !citySlug || !clusterSlug) return null;
  return `/clusters/${stateSlug}/${citySlug}/${clusterSlug}`;
}

export function clusterCityPath({ state, city }) {
  const stateSlug = toStateSlug(state);
  const citySlug = toCitySlug(city);
  if (!stateSlug || !citySlug) return null;
  return `/clusters/${stateSlug}/${citySlug}`;
}

/** Standard destination taxonomy — every state uses the same category list. */
export const CLUSTER_DESTINATION_TYPES = Object.freeze([
  "university",
  "downtown",
  "airport",
  "entertainment_complex",
  "tourist_destination",
  "stadium",
  "convention_district",
  "historic_district",
  "waterfront",
  "casino",
  "theme_park",
  "business_district",
]);

export const FEATURED_CLUSTER_FALLBACK_SLUGS = Object.freeze(["usc", "la-live", "lax", "atl-airport", "ucla"]);

export const CLUSTER_GROWING_HELP_TEXT =
  "This Cluster is actively expanding. Menuply is continuously adding restaurants and outlets to this directory.";

export const CLUSTER_GROWING_NOTICE = Object.freeze({
  title: "Growing Cluster",
  body:
    "Menuply is actively expanding this collection with more restaurants and outlets. If you know of a location that's missing, you can help improve this Cluster.",
});

export function isClusterGrowing(cluster) {
  const coverage = String(cluster?.coverage_status || "").trim().toLowerCase();
  if (coverage === "growing") return true;
  if (coverage === "complete") return false;
  return cluster?.progressive_listing === true;
}

export function clusterCoverageBadge(cluster) {
  return isClusterGrowing(cluster) ? "🟡 Growing" : null;
}

export function resolveClusterDirectoryCount(cluster) {
  const directory = Number(cluster?.directory_count ?? cluster?.placeholder_count) || 0;
  const verified = Number(cluster?.verified_profile_count ?? cluster?.restaurant_count) || 0;
  if (directory > 0) return directory;
  return verified;
}

export function formatClusterOutletCountLabel(cluster) {
  const dining = Number(cluster?.dining_count ?? cluster?.listing_stats?.total_dining_placeholders) || 0;
  const drinks = Number(cluster?.drinks_count ?? cluster?.listing_stats?.total_drinks_placeholders) || 0;
  const count = resolveClusterDirectoryCount(cluster);
  if (count <= 0) return null;
  const type = String(cluster?.type || "").toLowerCase();
  if (type === "airport" && drinks > 0) {
    const diningLabel = dining > 0 ? `${dining} dining` : "";
    const drinksLabel = `${drinks} drink${drinks === 1 ? "" : "s"}`;
    return diningLabel ? `${diningLabel} · ${drinksLabel}` : drinksLabel;
  }
  const noun = type === "airport" ? "Dining outlet" : "Restaurant";
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

export function clusterTypeLabel(type) {
  const labels = {
    mall: "Shopping mall",
    airport: "Airport",
    stadium: "Stadium district",
    casino: "Casino resort",
    entertainment_complex: "Entertainment district",
    university: "University",
    downtown: "Downtown",
    tourist_destination: "Tourist destination",
    convention_district: "Convention district",
    historic_district: "Historic district",
    waterfront: "Waterfront",
    theme_park: "Theme park",
    business_district: "Business district",
    other: "Destination",
  };
  return labels[String(type || "").toLowerCase()] || "Destination";
}

export function clusterDestinationCategoryLabel(type) {
  const labels = {
    university: "Universities",
    downtown: "Downtowns",
    airport: "Airports",
    entertainment_complex: "Entertainment Districts",
    tourist_destination: "Tourist Destinations",
    stadium: "Stadium Districts",
    convention_district: "Convention Districts",
    historic_district: "Historic Districts",
    waterfront: "Waterfronts",
    casino: "Casino Resorts",
    theme_park: "Theme Parks",
    business_district: "Business Districts",
    mall: "Shopping Malls",
    other: "Other Destinations",
  };
  return labels[String(type || "").toLowerCase()] || "Destinations";
}

export function clusterVerificationBadge(level) {
  const normalized = String(level || "").toLowerCase();
  if (normalized === "community") return "🟡 Community Cluster";
  return "🟢 Verified Cluster";
}

export function clusterMembershipHeading(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "university") return "Part of";
  return "Located in";
}

export function clusterMembershipAction(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "university") return "View Cluster →";
  return "Explore Cluster →";
}

export function groupClustersByStateCity(clusters) {
  if (!Array.isArray(clusters) || clusters.length === 0) return [];

  const states = new Map();
  for (const cluster of clusters) {
    const stateKey = String(cluster.state || "").trim().toUpperCase();
    if (!stateKey) continue;

    if (!states.has(stateKey)) {
      states.set(stateKey, {
        state: stateKey,
        stateLabel: stateDisplayName(stateKey),
        stateSlug: toStateSlug(stateKey),
        cities: new Map(),
      });
    }

    const stateEntry = states.get(stateKey);
    const cityKey = String(cluster.city || "").trim();
    if (!cityEntryExists(stateEntry, cityKey)) {
      stateEntry.cities.set(cityKey, {
        city: cityKey,
        citySlug: toCitySlug(cityKey),
        clusters: [],
      });
    }
    stateEntry.cities.get(cityKey).clusters.push(cluster);
  }

  return Array.from(states.values())
    .sort((a, b) => a.stateLabel.localeCompare(b.stateLabel))
    .map((stateEntry) => ({
      ...stateEntry,
      cities: Array.from(stateEntry.cities.values()).sort((a, b) => a.city.localeCompare(b.city)),
    }));
}

function cityEntryExists(stateEntry, cityKey) {
  return stateEntry.cities.has(cityKey);
}

export function listUsStateCodes() {
  return Object.keys(STATE_NAMES)
    .sort((a, b) => stateDisplayName(a).localeCompare(stateDisplayName(b)));
}

/**
 * United States → State → Destination Type → Cluster
 * Every state exposes the same destination categories (empty types included).
 */
export function groupClustersByStateAndType(clusters, { destinationTypes = CLUSTER_DESTINATION_TYPES } = {}) {
  const types = Array.isArray(destinationTypes) ? destinationTypes : CLUSTER_DESTINATION_TYPES;
  const clustersByStateType = new Map();

  if (Array.isArray(clusters)) {
    for (const cluster of clusters) {
      const stateKey = String(cluster.state || "").trim().toUpperCase();
      const typeKey = String(cluster.type || "").trim().toLowerCase();
      if (!stateKey || !typeKey) continue;
      if (!clustersByStateType.has(stateKey)) clustersByStateType.set(stateKey, new Map());
      const typeMap = clustersByStateType.get(stateKey);
      if (!typeMap.has(typeKey)) typeMap.set(typeKey, []);
      typeMap.get(typeKey).push(cluster);
    }
  }

  return listUsStateCodes().map((state) => {
    const typeMap = clustersByStateType.get(state) || new Map();
    const destinationTypesForState = types.map((type) => {
      const items = [...(typeMap.get(type) || [])].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
      return {
        type,
        label: clusterDestinationCategoryLabel(type),
        clusters: items,
        count: items.length,
      };
    });
    const clusterCount = destinationTypesForState.reduce((sum, entry) => sum + entry.count, 0);
    return {
      state,
      stateLabel: stateDisplayName(state),
      stateSlug: toStateSlug(state),
      destinationTypes: destinationTypesForState,
      clusterCount,
    };
  });
}

export function resolveFeaturedClusters(featured = [], clusters = []) {
  if (Array.isArray(featured) && featured.length > 0) return featured;
  const pool = Array.isArray(clusters) ? clusters : [];
  const fallback = pool.filter((cluster) =>
    FEATURED_CLUSTER_FALLBACK_SLUGS.includes(String(cluster.slug || "").toLowerCase())
  );
  if (fallback.length > 0) return fallback;
  return pool.slice(0, 6);
}

/** Reserved for future cluster tabs/sections — not rendered yet. */
export const CLUSTER_RESERVED_FUTURE_SECTIONS = Object.freeze([
  "events",
  "parking",
  "hotels",
  "directions",
  "deals",
  "maps",
  "student_discounts",
  "campus_dining_dollars",
  "late_night",
  "study_friendly",
  "outdoor_seating",
  "open_late",
  "game_day_dining",
]);

/** Future walking-time presets (minutes) — routing not implemented yet. */
export const CLUSTER_WALKING_TIME_PRESETS_MINUTES = Object.freeze([5, 10, 15, 20]);
