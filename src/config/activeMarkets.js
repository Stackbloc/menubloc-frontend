/**
 * activeMarkets.js
 * Market routing configuration for Menuply restaurant signup.
 *
 * ── Architecture ─────────────────────────────────────────────────────────────
 * The backend `GET /api/markets/signup-flow` endpoint is authoritative.
 * This file provides:
 *   1. Synchronous `isActiveMarket()` / `getSignupFlow()` — used as fallback
 *      when the backend is unreachable.
 *   2. Async `fetchSignupFlow()` — primary path; calls the backend with a 5s
 *      timeout, falls back to local config on any error.
 *
 * See docs/onboarding-architecture.md for full market routing rules.
 *
 * ── Local config limitations ─────────────────────────────────────────────────
 * The city-list approach does NOT handle:
 *
 *   1. Neighborhood names — "Venice", "Hollywood", "Silver Lake", "Sherman Oaks",
 *      "North Hollywood", "East Los Angeles", "Mar Vista", "Los Feliz", etc.
 *      These are not incorporated cities and won't match the city list.
 *
 *   2. Unincorporated areas — "Marina del Rey", "East LA", "Hacienda Heights",
 *      "Rowland Heights", "Walnut Park", etc. are Census Designated Places (CDPs)
 *      within LA County but have no incorporated city status.
 *
 *   3. Alternate spellings / abbreviations — "L.A.", "West LA", "So Cal", etc.
 *
 *   4. ZIP codes — users sometimes enter a ZIP rather than a city name.
 *
 * The backend markets table stores a full cities array per county market and
 * supports ZIP-code lookup. These gaps are addressed at the backend layer.
 * Uncertain inputs always default to founders flow — signup is never blocked.
 */

const API = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  "http://localhost:3001"
).replace(/\/$/, "");

// ── Local fallback data ───────────────────────────────────────────────────────
// Incorporated cities within Los Angeles County, CA.
// Mirrors the `cities` array in the markets DB row.
const LA_COUNTY_CITIES = new Set([
  "los angeles", "long beach", "santa monica", "glendale", "burbank",
  "pasadena", "torrance", "inglewood", "compton", "carson", "hawthorne",
  "el monte", "alhambra", "downey", "pomona", "west covina", "norwalk",
  "santa clarita", "lancaster", "palmdale", "beverly hills", "culver city",
  "monrovia", "arcadia", "whittier", "covina", "west hollywood", "gardena",
  "lakewood", "signal hill", "redondo beach", "hermosa beach", "manhattan beach",
  "el segundo", "lomita", "lawndale", "cerritos", "artesia", "la mirada",
  "la puente", "walnut", "diamond bar", "azusa", "san gabriel", "san dimas",
  "glendora", "claremont", "monterey park", "montebello", "commerce",
  "pico rivera", "south el monte", "baldwin park", "irwindale", "la verne",
  "duarte", "sierra madre", "bradbury", "temple city", "san marino",
  "rosemead", "south pasadena", "la canada flintridge", "calabasas",
  "agoura hills", "hidden hills", "westlake village", "malibu",
  "rolling hills", "rolling hills estates", "rancho palos verdes",
  "palos verdes estates", "bellflower", "lynwood", "south gate",
  "huntington park", "maywood", "bell", "bell gardens", "cudahy", "vernon",
  "santa fe springs", "industry",
]);

export const ACTIVE_MARKETS = [
  {
    type: "county",
    label: "Los Angeles County, CA",
    state: "CA",
    county: "Los Angeles",
    citiesInCounty: LA_COUNTY_CITIES,
  },
  {
    type: "city",
    label: "Dothan, AL",
    state: "AL",
    city: "Dothan",
  },
];

// ── Synchronous helpers (local fallback only) ─────────────────────────────────

/**
 * Returns true if the location matches a known active market in local config.
 * Used as fallback when `fetchSignupFlow` cannot reach the backend.
 *
 * @param {{ city?: string, state?: string }} location
 * @returns {boolean}
 */
export function isActiveMarket(location) {
  if (!location) return false;
  const city  = String(location.city  || "").trim().toLowerCase();
  const state = String(location.state || "").trim().toUpperCase();
  if (!city || !state) return false;

  for (const market of ACTIVE_MARKETS) {
    if (market.state !== state) continue;
    if (market.type === "city"   && city === market.city.toLowerCase()) return true;
    if (market.type === "county" && market.citiesInCounty.has(city))    return true;
  }
  return false;
}

/**
 * Synchronous flow lookup against local config (fallback only).
 * Prefer `fetchSignupFlow` for authoritative results.
 *
 * @param {{ city?: string, state?: string } | null} location
 * @returns {"full" | "founders"}
 */
export function getSignupFlow(location) {
  if (!location) return "founders";
  return isActiveMarket(location) ? "full" : "founders";
}

// ── Async backend-authoritative lookup ───────────────────────────────────────

/**
 * Fetches the authoritative signup flow for a location from the backend.
 * Falls back to local config if the backend is unreachable or returns an error.
 * Never throws — always resolves to { flow, source, market }.
 *
 * @param {{ city?: string, state?: string, zip?: string }} location
 * @returns {Promise<{ flow: "full"|"founders", source: "backend"|"fallback", market: object|null }>}
 */
export async function fetchSignupFlow({ city = "", state = "", zip = "" } = {}) {
  const localFlow = getSignupFlow({ city, state });

  // Skip the network call when there's nothing to look up.
  if (!city && !state && !zip) {
    return { flow: "founders", source: "fallback", market: null };
  }

  try {
    const params = new URLSearchParams();
    if (city)  params.set("city",  city);
    if (state) params.set("state", state);
    if (zip)   params.set("zip",   zip);

    const res = await fetch(`${API}/api/markets/signup-flow?${params}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return { flow: localFlow, source: "fallback", market: null };
    }

    const data = await res.json().catch(() => null);
    if (!data?.ok) {
      return { flow: localFlow, source: "fallback", market: null };
    }

    return {
      flow:   data.signup_flow  || "founders",
      source: "backend",
      market: data.market       || null,
    };
  } catch {
    // Network error, timeout, AbortError — fall back to local config silently.
    return { flow: localFlow, source: "fallback", market: null };
  }
}
