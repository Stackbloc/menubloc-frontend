const US_STATES = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga",
  "hi","id","il","in","ia","ks","ky","la","me","md",
  "ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc",
  "sd","tn","tx","ut","vt","va","wa","wv","wi","wy","dc",
]);

/** "los-angeles-ca" → { city: "Los Angeles", state: "CA" } | null */
export function parseCityStateSlug(slug) {
  if (!slug || typeof slug !== "string") return null;
  const parts = slug.toLowerCase().split("-");
  if (parts.length < 2) return null;
  const stateCode = parts[parts.length - 1];
  if (!US_STATES.has(stateCode)) return null;
  const city = parts.slice(0, -1).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { city, state: stateCode.toUpperCase() };
}

/** "Los Angeles", "CA" → "los-angeles-ca" */
export function toCityStateSlug(city, state) {
  const cityPart = String(city || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const statePart = String(state || "").toLowerCase().slice(0, 2);
  return `${cityPart}-${statePart}`;
}

/** Returns true when a URL segment is a city-state slug. No DB call needed. */
export function isCityStateSlug(slug) {
  return parseCityStateSlug(slug) !== null;
}
