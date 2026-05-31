import { parseLocation } from "./locationUtils.js";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_GEO_KEY = "grubbid.discovery.geo";

const STATE_CODE_TO_NAME = {
  AL: "Alabama",
  AZ: "Arizona",
  CA: "California",
  CO: "Colorado",
  FL: "Florida",
  GA: "Georgia",
  IL: "Illinois",
  MA: "Massachusetts",
  MI: "Michigan",
  NC: "North Carolina",
  NY: "New York",
  OH: "Ohio",
  PA: "Pennsylvania",
  TN: "Tennessee",
  TX: "Texas",
  VA: "Virginia",
  WA: "Washington",
};

export const JOIN_MARKETS = {
  generic: {
    market: null,
    city: null,
    state: null,
    state_code: null,
    signup_source: "join_generic",
    headlineLocation: "your area",
    signupHref: "/restaurant/signup/free-profile",
  },
  losangeles: {
    market: "losangeles",
    city: "Los Angeles",
    state: "California",
    state_code: "CA",
    signup_source: "join_losangeles",
    headlineLocation: "Los Angeles, California",
    signupHref: "/restaurant/signup/free-profile?market=losangeles",
  },
  dothan: {
    market: "dothan",
    city: "Dothan",
    state: "Alabama",
    state_code: "AL",
    signup_source: "join_dothan",
    headlineLocation: "Dothan, Alabama",
    signupHref: "/restaurant/signup/free-profile?market=dothan",
  },
};

const LA_METRO_CITY_ALIASES = new Set([
  "los angeles",
  "la",
  "pasadena",
  "glendale",
  "burbank",
  "santa monica",
  "long beach",
  "torrance",
  "inglewood",
  "culver city",
  "west hollywood",
  "hollywood",
  "north hollywood",
  "van nuys",
  "encino",
  "sherman oaks",
  "studio city",
  "beverly hills",
  "malibu",
  "redondo beach",
  "manhattan beach",
  "el segundo",
  "hawthorne",
  "compton",
  "carson",
  "downey",
  "norwalk",
  "whittier",
  "pomona",
  "ontario",
  "riverside",
  "san bernardino",
  "anaheim",
  "santa ana",
  "irvine",
  "huntington beach",
  "costa mesa",
  "fullerton",
  "orange",
  "thousand oaks",
  "woodland hills",
  "calabasas",
  "agoura hills",
]);

function normalizeCityToken(city) {
  return String(city || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
}

function readStoredDiscoveryLocation() {
  if (typeof window === "undefined") return { city: "", state: "", label: "" };
  try {
    const label = String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
    const parsed = parseLocation(label);
    return {
      label,
      city: parsed.city || "",
      state: parsed.state || "",
    };
  } catch {
    return { city: "", state: "", label: "" };
  }
}

function readStoredDiscoveryCoords() {
  if (typeof window === "undefined") return { lat: null, lng: null };
  try {
    const raw = window.sessionStorage.getItem(SESSION_GEO_KEY);
    if (!raw) return { lat: null, lng: null };
    const geo = JSON.parse(raw);
    const lat = Number(geo?.lat);
    const lng = Number(geo?.lng);
    return {
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
  } catch {
    return { lat: null, lng: null };
  }
}

function isInLosAngelesRegion(lat, lng) {
  return lat >= 33.2 && lat <= 34.9 && lng >= -119.1 && lng <= -117.0;
}

function isInDothanRegion(lat, lng) {
  return lat >= 30.6 && lat <= 31.6 && lng >= -86.1 && lng <= -84.7;
}

function matchMarketFromCityState(city, stateCode) {
  const cityNorm = normalizeCityToken(city);
  const state = String(stateCode || "").trim().toUpperCase();

  if (state === "CA") {
    if (!cityNorm || LA_METRO_CITY_ALIASES.has(cityNorm) || cityNorm.includes("los angeles")) {
      return JOIN_MARKETS.losangeles;
    }
    return JOIN_MARKETS.losangeles;
  }

  if (state === "AL") {
    if (!cityNorm || cityNorm.includes("dothan")) {
      return JOIN_MARKETS.dothan;
    }
  }

  if (cityNorm.includes("dothan")) return JOIN_MARKETS.dothan;
  if (cityNorm.includes("los angeles") || cityNorm === "la") return JOIN_MARKETS.losangeles;

  return null;
}

function matchMarketFromCoords(lat, lng) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (isInDothanRegion(lat, lng)) return JOIN_MARKETS.dothan;
  if (isInLosAngelesRegion(lat, lng)) return JOIN_MARKETS.losangeles;
  return null;
}

function titleCaseWords(value) {
  return String(value || "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Display label for join headline, e.g. "Atlanta, Georgia". */
export function formatHeadlineLocation(city, stateInput) {
  const cityDisplay = titleCaseWords(city);
  const stateRaw = String(stateInput || "").trim();
  if (!cityDisplay && !stateRaw) return "your area";

  const stateUpper = stateRaw.length === 2 ? stateRaw.toUpperCase() : "";
  const stateDisplay = stateUpper
    ? STATE_CODE_TO_NAME[stateUpper] || stateUpper
    : titleCaseWords(stateRaw);

  return [cityDisplay, stateDisplay].filter(Boolean).join(", ") || "your area";
}

function normalizeStateCode(stateInput) {
  const raw = String(stateInput || "").trim();
  if (!raw) return "";
  if (raw.length === 2) return raw.toUpperCase();
  const entry = Object.entries(STATE_CODE_TO_NAME).find(
    ([, name]) => name.toLowerCase() === raw.toLowerCase()
  );
  return entry ? entry[0] : "";
}

/**
 * Build join landing market from explicit city/state (URL or discovery preference).
 * Launch markets (LA, Dothan) use branded buckets; others get a dynamic headline.
 */
export function buildMarketFromCityState(city, stateInput) {
  const cityTrim = String(city || "").trim();
  const stateTrim = String(stateInput || "").trim();
  const stateCode = normalizeStateCode(stateTrim) || (stateTrim.length === 2 ? stateTrim.toUpperCase() : "");

  const bucket = matchMarketFromCityState(cityTrim, stateCode || stateTrim);
  if (bucket) return { ...bucket };

  if (!cityTrim && !stateTrim) return { ...JOIN_MARKETS.generic };

  const headlineLocation = formatHeadlineLocation(cityTrim, stateCode || stateTrim);
  const params = new URLSearchParams();
  if (cityTrim) params.set("city", cityTrim);
  if (stateCode) params.set("state", stateCode);
  else if (stateTrim) params.set("state", stateTrim);
  const qs = params.toString();

  return {
    market: null,
    city: cityTrim || null,
    state: stateCode ? STATE_CODE_TO_NAME[stateCode] || stateTrim : stateTrim || null,
    state_code: stateCode || null,
    signup_source: "join_context",
    headlineLocation,
    signupHref: qs
      ? `/restaurant/signup/free-profile?${qs}`
      : JOIN_MARKETS.generic.signupHref,
  };
}

function parseCityStateFromSearch(search) {
  const raw = String(search || "").trim();
  const params = new URLSearchParams(raw.startsWith("?") ? raw : raw ? `?${raw}` : "");
  return {
    city: String(params.get("city") || "").trim(),
    state: String(params.get("state") || "").trim(),
  };
}

/** Infer join market from discovery session (no live GPS on /join). */
export function detectJoinMarketFromGeo() {
  const stored = readStoredDiscoveryLocation();
  if (stored.city && stored.state) {
    return buildMarketFromCityState(stored.city, stored.state);
  }

  const labelLower = stored.label.toLowerCase();
  if (labelLower.includes("dothan")) return JOIN_MARKETS.dothan;
  if (labelLower.includes("los angeles") || labelLower.includes("losangeles")) {
    return JOIN_MARKETS.losangeles;
  }

  const { lat, lng } = readStoredDiscoveryCoords();
  const fromCoords = matchMarketFromCoords(lat, lng);
  if (fromCoords) return fromCoords;

  return null;
}

export function resolveJoinMarketFromPath(pathname) {
  const path = String(pathname || "");
  if (path === "/join/losangeles" || path === "/join/los-angeles") return JOIN_MARKETS.losangeles;
  if (path === "/join/dothan") return JOIN_MARKETS.dothan;
  return null;
}

export function resolveJoinMarket(marketKey) {
  const key = String(marketKey || "").trim().toLowerCase();
  if (key === "losangeles" || key === "los-angeles") return JOIN_MARKETS.losangeles;
  if (key === "dothan") return JOIN_MARKETS.dothan;
  return JOIN_MARKETS.generic;
}

/**
 * Resolve market for join landing: route/prop → URL city/state → session preference → coords → generic.
 */
export function resolveJoinMarketForLanding({ marketKey, pathname, search = "" }) {
  const explicitKey = String(marketKey || "").trim().toLowerCase();
  if (explicitKey && explicitKey !== "generic") {
    return resolveJoinMarket(explicitKey);
  }

  const fromPath = resolveJoinMarketFromPath(pathname);
  if (fromPath) return fromPath;

  const { city, state } = parseCityStateFromSearch(search);
  if (city && state) {
    return buildMarketFromCityState(city, state);
  }

  const fromGeo = detectJoinMarketFromGeo();
  if (fromGeo) return fromGeo;

  return JOIN_MARKETS.generic;
}

/**
 * Resolve market for free-profile signup: market param → city/state → session → generic.
 */
export function resolveJoinMarketForSignup(searchParams) {
  const fromQuery = searchParams?.get?.("market");
  if (fromQuery) return resolveJoinMarket(fromQuery);

  const city = String(searchParams?.get?.("city") || "").trim();
  const state = String(searchParams?.get?.("state") || "").trim();
  if (city && state) {
    return buildMarketFromCityState(city, state);
  }

  const fromGeo = detectJoinMarketFromGeo();
  if (fromGeo) return fromGeo;

  return JOIN_MARKETS.generic;
}

export function isJoinLandingPath(pathname) {
  const path = String(pathname || "");
  if (path === "/join") return true;
  if (path === "/join/losangeles" || path === "/join/los-angeles" || path === "/join/dothan") return true;
  if (path === "/join/diners") return true;
  return false;
}

export { STATE_CODE_TO_NAME };
