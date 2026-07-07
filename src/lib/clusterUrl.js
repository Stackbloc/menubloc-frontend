import { toCitySlug, toStateSlug } from "./slugs.js";

export { toCitySlug, toStateSlug };

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
    entertainment_complex: "Entertainment complex",
    university: "University area",
    other: "Destination",
  };
  return labels[String(type || "").toLowerCase()] || "Destination";
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
