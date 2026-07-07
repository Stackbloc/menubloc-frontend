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

export function clusterTypeLabel(type) {
  const labels = {
    mall: "Shopping mall",
    airport: "Airport terminal",
    stadium: "Stadium district",
    casino: "Casino",
    entertainment_complex: "Entertainment district",
    university: "University",
    other: "Destination",
  };
  return labels[String(type || "").toLowerCase()] || "Destination";
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
