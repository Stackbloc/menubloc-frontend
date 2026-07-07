export function toCitySlug(city) {
  return String(city || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function toStateSlug(state) {
  return String(state || "").trim().toLowerCase().slice(0, 2);
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
    entertainment_complex: "Entertainment complex",
    other: "Destination",
  };
  return labels[String(type || "").toLowerCase()] || "Destination";
}
