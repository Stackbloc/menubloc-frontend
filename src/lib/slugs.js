// Canonical slug utility — single source of truth for all URL segment generation.
// Identical to menubloc-backend/src/lib/slugs.js. Any change to either copy must
// be applied to both. The test suite verifies they produce identical output.

// Pre-slugged state names. Values are already slug-safe (no toSlug call needed).
export const STATE_NAMES = {
  AL: "alabama",             AK: "alaska",
  AZ: "arizona",             AR: "arkansas",
  CA: "california",          CO: "colorado",
  CT: "connecticut",         DE: "delaware",
  FL: "florida",             GA: "georgia",
  HI: "hawaii",              ID: "idaho",
  IL: "illinois",            IN: "indiana",
  IA: "iowa",                KS: "kansas",
  KY: "kentucky",            LA: "louisiana",
  ME: "maine",               MD: "maryland",
  MA: "massachusetts",       MI: "michigan",
  MN: "minnesota",           MS: "mississippi",
  MO: "missouri",            MT: "montana",
  NE: "nebraska",            NV: "nevada",
  NH: "new-hampshire",       NJ: "new-jersey",
  NM: "new-mexico",          NY: "new-york",
  NC: "north-carolina",      ND: "north-dakota",
  OH: "ohio",                OK: "oklahoma",
  OR: "oregon",              PA: "pennsylvania",
  RI: "rhode-island",        SC: "south-carolina",
  SD: "south-dakota",        TN: "tennessee",
  TX: "texas",               UT: "utah",
  VT: "vermont",             VA: "virginia",
  WA: "washington",          WV: "west-virginia",
  WI: "wisconsin",           WY: "wyoming",
  DC: "district-of-columbia",
};

// Shared primitive. Must match menuply_to_slug(text) in PostgreSQL and the
// backend toSlug() function exactly.
// Apostrophes/quotes stripped first so possessives join cleanly:
// "Hunt's" → "hunts" not "hunt-s".
export function toSlug(str) {
  if (str == null) return "";
  return String(str)
    .toLowerCase()
    .replace(/['''""`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Restaurant name → URL slug. Falls back to "restaurant" for empty/null names.
export function toRestaurantSlug(name) {
  return toSlug(name) || "restaurant";
}

// City name → URL slug.
export function toCitySlug(city) {
  return toSlug(city);
}

// 2-letter US state code → full state name slug (e.g. "CA" → "california").
// Falls back to toSlug(code) for unrecognized codes.
export function toStateSlug(code) {
  if (!code) return "";
  return STATE_NAMES[String(code).toUpperCase()] || toSlug(code);
}
