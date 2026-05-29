import { parseLocation } from "./locationUtils.js";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_GEO_KEY = "grubbid.discovery.geo";

const STATE_CODE_TO_NAME = {
  CA: "California",
  AL: "Alabama",
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

/** Infer join market from discovery geo/session (used on generic `/join`). */
export function detectJoinMarketFromGeo() {
  const stored = readStoredDiscoveryLocation();
  const fromLabel = matchMarketFromCityState(stored.city, stored.state);
  if (fromLabel) return fromLabel;

  const labelLower = stored.label.toLowerCase();
  if (labelLower.includes("dothan")) return JOIN_MARKETS.dothan;
  if (labelLower.includes("los angeles") || labelLower.includes("losangeles")) {
    return JOIN_MARKETS.losangeles;
  }
  if (/\bca\b/.test(labelLower) || labelLower.includes("california")) {
    return JOIN_MARKETS.losangeles;
  }
  if (/\bal\b/.test(labelLower) || labelLower.includes("alabama")) {
    return JOIN_MARKETS.dothan;
  }

  const { lat, lng } = readStoredDiscoveryCoords();
  return matchMarketFromCoords(lat, lng);
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
 * Resolve market for join landing: explicit route/prop first, then discovery geo, then generic.
 */
export function resolveJoinMarketForLanding({ marketKey, pathname }) {
  const explicitKey = String(marketKey || "").trim().toLowerCase();
  if (explicitKey && explicitKey !== "generic") {
    return resolveJoinMarket(explicitKey);
  }

  const fromPath = resolveJoinMarketFromPath(pathname);
  if (fromPath) return fromPath;

  const fromGeo = detectJoinMarketFromGeo();
  if (fromGeo) return fromGeo;

  return JOIN_MARKETS.generic;
}

/**
 * Resolve market for free-profile signup: query param first, then discovery geo.
 */
export function resolveJoinMarketForSignup(searchParams) {
  const fromQuery = searchParams?.get?.("market");
  if (fromQuery) return resolveJoinMarket(fromQuery);

  const fromGeo = detectJoinMarketFromGeo();
  if (fromGeo) return fromGeo;

  return JOIN_MARKETS.generic;
}

export function isJoinLandingPath(pathname) {
  const path = String(pathname || "");
  if (path === "/join") return true;
  if (path === "/join/losangeles" || path === "/join/los-angeles" || path === "/join/dothan") return true;
  return false;
}

export { STATE_CODE_TO_NAME };
