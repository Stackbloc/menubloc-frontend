/**
 * ============================================================
 * File: GrubbidDiscovery.jsx
 * Path: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-05-06
 * Purpose:
 *   Mobile-first discovery page. Fixed top bar + search, auto-loading
 *   browse feed, left drawer, more-options bottom sheet.
 *   All search/location/filter logic preserved from prior version.
 *   Visual-only update: dark Menuply theme.
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadDietPrefs, saveDietPrefs } from "../hooks/useDietPreferences";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { addLocation, getLocations, updateLocation } from "../lib/consumerApi.js";
import { buildDietaryQueryParams } from "../lib/dietaryParams.js";
import { buildRestaurantFilterQueryParams } from "../lib/restaurantFilterParams.js";
import { filtersToUrlParams } from "../lib/filterUtils.js";
import { BrandLogo } from "../components/BrandLogo.jsx";
import {
  buildSearchLocationParams,
  formatLocationLabel,
  normalizeLocationLabel,
  parseLocation,
  reverseGeocode,
} from "../lib/locationUtils.js";
import { captureEvent } from "../services/posthog.js";
import ActiveFilterChips from "../components/discovery/ActiveFilterChips.jsx";
import ChipRail from "../components/chips/ChipRail.jsx";
import DiscoveryDrawer from "../components/grubbid/DiscoveryDrawer.jsx";
import DiscoveryCard from "../components/discovery/DiscoveryCard.jsx";
import FeaturedDiscoveryCard from "../components/discovery/FeaturedDiscoveryCard.jsx";
import DiscoveryMoreSheet from "../components/grubbid/DiscoveryMoreSheet.jsx";
import BottomNav from "../components/BottomNav.jsx";
import {
  appliedLocationMatchesGeoCityState,
  buildDiscoveryFeedScopeKey,
  buildDiscoveryLocationKey,
  dedupeDiscoveryMenus,
} from "../lib/discoveryFeedGuardrails.js";
import {
  buildOutOfMarketJoinPath,
  isOutOfMarketSearch,
  activeMarketsShareBrowseScope,
  resolveDiscoveryMarketLocation,
} from "../lib/marketGate.js";
import {
  readDetectedLocation,
  saveDetectedLocation,
  shouldRequestGeolocation,
} from "../lib/discoveryLocationPersistence.js";

const BROWSE_MENUS_PATH = "/browse-menus";
const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const LOCAL_RADIUS_MILES = 8;
const SESSION_GEO_KEY = "grubbid.discovery.geo";
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const RECENT_LOCATIONS_KEY = "grubbid.recent.locations";
const MAX_RECENT_LOCATIONS = 3;
const DIET_PREFS_STORAGE_KEY = "grubbid.diet.prefs";
const ALLERGEN_KEY = "grubbid.allergen.exclusions";
const ALLERGEN_NONE_ID = "none";
const OUT_OF_MARKET_PROMO_KEY = "grubbid.discovery.outOfMarketPromo";
const FILTER_HEALTH_CHECKED_KEY = "grubbid.filterHealthChecked";
const FILTER_HEALTH_BROKEN_KEY = "grubbid.filterHealthBroken";

function loadStoredOutOfMarketPromo() {
  if (typeof window === "undefined") return null;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const raw = storage.getItem(OUT_OF_MARKET_PROMO_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.locationKey) return parsed;
    } catch {
      // ignore storage read issues
    }
  }
  return null;
}

function saveStoredOutOfMarketPromo(payload) {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      storage.setItem(OUT_OF_MARKET_PROMO_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage write issues
    }
  }
}

const ALLERGENS = [
  { id: "nuts",      label: "Nuts" },
  { id: "dairy",     label: "Dairy" },
  { id: "shellfish", label: "Shellfish" },
  { id: "gluten",    label: "Gluten" },
  { id: "soy",       label: "Soy" },
  { id: "eggs",      label: "Eggs" },
  { id: "fish",      label: "Fish" },
];

/** Row 1 — category shortcuts on discovery (breakfast / drinks / fries / wings removed). */
const FOOD_CATEGORY_CHIPS = [
  { id: "pizza",        icon: "🍕", label: "Pizza",              query: "pizza" },
  { id: "burgers",      icon: "🍔", label: "Burgers",            query: "burgers" },
  { id: "salads",       icon: "🥗", label: "Salads",             query: "salads" },
  { id: "chicken",      icon: "🍗", label: "Chicken",            query: "chicken" },
  { id: "tacos",        icon: "🌮", label: "Tacos",              query: "tacos" },
  { id: "sandwiches",   icon: "🥪", label: "Sandwiches",         query: "sandwiches" },
];

/** Row 2 — nutrition & diet intent. */
const INTELLIGENCE_CHIPS = [
  { id: "low-carb",     icon: "🥦", label: "Low Carb",           query: "low carb" },
  { id: "high-protein", icon: "💪", label: "High Protein",       query: "high protein" },
  { id: "diabetic",     icon: "🩺", label: "Diabetic Friendly",  query: "diabetic friendly" },
  { id: "glp1",         icon: "🥗", label: "GLP-1 Friendly",     query: "", filterKey: "glp1_friendly" },
  { id: "low-fat",      icon: "🧈", label: "Low Fat",            query: "low fat", filterKey: "low_fat" },
  { id: "low-sodium",   icon: "🧂", label: "Low Sodium",         query: "low sodium", filterKey: "low_sodium" },
  { id: "high-fiber",   icon: "🌾", label: "High Fiber",         query: "high fiber" },
];

function DiscoveryChipRow({ chips, filters, onChipClick }) {
  return (
    <div style={{ padding: "0 16px", minWidth: 0, width: "100%" }}>
      <ChipRail>
        {chips.map((chip) => {
          const isActive = chip.filterKey ? !!filters[chip.filterKey] : false;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onChipClick(chip)}
              style={{
                height: 28, padding: "0 12px", borderRadius: 999,
                cursor: "pointer",
                border: isActive ? "1.5px solid var(--gb-color-accent)" : "1.5px solid var(--gb-color-border)",
                background: isActive ? "rgba(45,106,79,0.12)" : "var(--gb-color-surface-strong)",
                color: isActive ? "var(--gb-color-accent)" : "var(--gb-color-ink-muted)",
                fontSize: 12, fontWeight: 700,
              }}
            >
              {chip.icon} {chip.label}
            </button>
          );
        })}
      </ChipRail>
    </div>
  );
}

function DiscoveryInlineSelect({ value, onChange, options, ariaLabel, disabled = false, prefix = "", compact = false }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
      style={compact ? {
        fontSize: 12,
        fontWeight: 700,
        color: "#9ca3af",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "0 2px",
        outline: "none",
      } : {
        minHeight: 28,
        border: "1px solid rgba(156,163,175,0.25)",
        borderRadius: 999,
        background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)",
        color: disabled ? "rgba(156,163,175,0.4)" : "#9ca3af",
        fontSize: 12,
        fontWeight: 700,
        padding: "0 24px 0 9px",
        cursor: disabled ? "default" : "pointer",
        outline: "none",
        whiteSpace: "nowrap",
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{prefix}{opt.label}</option>
      ))}
    </select>
  );
}

function hasStoredDietSelection() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DIET_PREFS_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function hasStoredAllergenSelection() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ALLERGEN_KEY) !== null;
  } catch {
    return false;
  }
}

function buildDiscoveryDietPrefsFromProfile(rows) {
  const enabled = new Set(
    (Array.isArray(rows) ? rows : [])
      .filter((row) => row?.is_enabled)
      .map((row) => String(row?.preference_key || "").trim().toLowerCase())
      .filter(Boolean)
  );

  return {
    vegan: enabled.has("vegan"),
    vegetarian: enabled.has("vegetarian"),
    gluten_free: enabled.has("gluten_free"),
    keto: enabled.has("keto") || enabled.has("low_carb"),
    low_fat: false,
    low_sodium: enabled.has("low_sodium"),
    dairy_free: enabled.has("dairy_free"),
    diabetic_friendly: enabled.has("diabetic_friendly"),
  };
}

function buildDiscoveryAllergenSetFromProfile(allergenRows, allergenFilter) {
  if (allergenFilter?.configured && allergenFilter?.status === "off") {
    return new Set([ALLERGEN_NONE_ID]);
  }

  const sourceKeys = Array.isArray(allergenFilter?.active_allergen_keys) && allergenFilter.active_allergen_keys.length > 0
    ? allergenFilter.active_allergen_keys
    : (Array.isArray(allergenRows) ? allergenRows.filter((row) => row?.is_enabled).map((row) => row?.allergen_key) : []);

  const mapped = new Set();
  for (const rawKey of sourceKeys) {
    const key = String(rawKey || "").trim().toLowerCase();
    if (!key) continue;
    if (key === "peanuts" || key === "tree_nuts") mapped.add("nuts");
    if (key === "dairy") mapped.add("dairy");
    if (key === "gluten" || key === "wheat") mapped.add("gluten");
    if (key === "shellfish" || key === "molluscs") mapped.add("shellfish");
    if (key === "soy") mapped.add("soy");
    if (key === "eggs") mapped.add("eggs");
    if (key === "fish") mapped.add("fish");
  }
  return mapped;
}

function formatDiscoveryAllergenLabel(value) {
  return String(value || "")
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Re-ranks feed when query is active without hiding the default cards.
function filterAndRankMenus(menus, query) {
  const q = (query || "").toLowerCase().trim();
  if (!q) return menus;
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = menus.map((menu) => {
    let score = 0;
    const name = (menu.restaurant_name || "").toLowerCase();
    const cuisine = (menu.cuisine || menu.category || "").toLowerCase();
    const items = (menu.preview_items || []).join(" ").toLowerCase();
    if (name.includes(q)) score += 10;
    if (cuisine.includes(q)) score += 6;
    if (items.includes(q)) score += 4;
    terms.forEach((t) => {
      if (name.includes(t)) score += 3;
      if (cuisine.includes(t)) score += 2;
      if (items.includes(t)) score += 1;
    });
    if (/vegan|plant.?based/.test(q) && menu.has_vegan_options) score += 8;
    if (/gluten.?free/.test(q) && menu.has_gluten_free_options) score += 8;
    if (/keto|low.?carb/.test(q) && menu.has_keto_options) score += 8;
    if (/low.?fat/.test(q) && menu.has_low_fat_options) score += 8;
    if (/low.?sodium/.test(q) && menu.has_low_sodium_options) score += 8;
    if (/diabetic/.test(q) && menu.has_diabetic_friendly_options) score += 8;
    if (/deal/.test(q) && menu.has_deals) score += 8;
    return { menu, score };
  });
  const matches = scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ menu }) => menu);
  if (matches.length === 0) return menus;

  const matchedIds = new Set(matches.map((menu) => menu.menu_id || menu.restaurant_id));
  const remainder = menus.filter((menu) => !matchedIds.has(menu.menu_id || menu.restaurant_id));
  return [...matches, ...remainder];
}

// Returns one short match reason, or null if no strong signal
function buildMatchReason(menu, filters, query) {
  if (filters.vegan && menu.has_vegan_options) return "Match: Vegan Friendly";
  if (filters.gluten_free && menu.has_gluten_free_options) return "Match: Gluten-Free";
  if (filters.diabetic_friendly && menu.has_diabetic_friendly_options) return "Match: Diabetic Friendly";
  if (filters.keto && menu.has_keto_options) return "Match: Low Carb";
  if (filters.dairy_free && menu.has_dairy_free_options) return "Match: Dairy-Free";
  if (filters.low_fat && menu.has_low_fat_options) return "Match: Low Fat";
  if (filters.low_sodium && menu.has_low_sodium_options) return "Match: Low Sodium";
  const q = (query || "").toLowerCase();
  if (q) {
    if (/vegan|plant.?based/.test(q) && menu.has_vegan_options) return "Match: Vegan Friendly";
    if (/gluten.?free/.test(q) && menu.has_gluten_free_options) return "Match: Gluten-Free";
    if (/keto|low.?carb/.test(q) && menu.has_keto_options) return "Match: Low Carb";
    if (/low.?fat/.test(q) && menu.has_low_fat_options) return "Match: Low Fat";
    if (/low.?sodium/.test(q) && menu.has_low_sodium_options) return "Match: Low Sodium";
    if (/diabetic/.test(q) && menu.has_diabetic_friendly_options) return "Match: Diabetic Friendly";
    if (/deal/.test(q) && menu.has_deals) return "Match: Deals Available";
  }
  return null;
}

function loadRecentLocations() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(RECENT_LOCATIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecentLocation(label) {
  if (typeof window === "undefined" || !label) return;
  try {
    const existing = loadRecentLocations().filter((l) => l !== label);
    const updated = [label, ...existing].slice(0, MAX_RECENT_LOCATIONS);
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
  } catch {}
}

function countSearchResults(payload) {
  if (Array.isArray(payload?.results)) return payload.results.length;
  return 0;
}

async function verifyFilterHealth(locationParams) {
  try {
    const query = "chicken";

    const baseQuery = new URLSearchParams({
      q: query,
      ...locationParams,
    }).toString();

    const dietaryQuery = new URLSearchParams({
      q: query,
      ...locationParams,
      gluten_free: "1",
    }).toString();

    const allergenQuery = new URLSearchParams({
      q: query,
      ...locationParams,
      allergens: "gluten",
    }).toString();

    const [baseRes, dietaryRes, allergenRes] = await Promise.all([
      fetch(`${API}/search?${baseQuery}`),
      fetch(`${API}/search?${dietaryQuery}`),
      fetch(`${API}/search?${allergenQuery}`),
    ]);

    const [baseData, dietaryData, allergenData] = await Promise.all([
      baseRes.json(),
      dietaryRes.json(),
      allergenRes.json(),
    ]);

    const baseCount = countSearchResults(baseData);
    const dietaryCount = countSearchResults(dietaryData);
    const allergenCount = countSearchResults(allergenData);

    return {
      baseCount,
      dietaryCount,
      allergenCount,
      isWorking: dietaryCount < baseCount && allergenCount < baseCount,
    };
  } catch (err) {
    console.warn("Filter health check failed to run", err);
    return { isWorking: true };
  }
}

function removeRecentLocation(label) {
  if (typeof window === "undefined") return;
  try {
    const updated = loadRecentLocations().filter((l) => l !== label);
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
  } catch {}
}

function useAutoLocation() {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") return {
      status: "unavailable", label: "", city: "", state: "", confidence: "low", lat: null, lng: null,
    };
    return readDetectedLocation(window.localStorage) || {
      status: "locating", label: "", city: "", state: "", confidence: "low", lat: null, lng: null,
    };
  });

  useEffect(() => {
    const cached = readDetectedLocation(window.localStorage);
    if (!shouldRequestGeolocation(cached)) return;

    async function ipFallback() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const json = await res.json().catch(() => ({}));
        const city = String(json?.city || "").trim();
        const st   = String(json?.region_code || "").trim();
        if (city && st) {
          setState({ status: "ready", label: `${city}, ${st}`, city, state: st,
                     confidence: "low", lat: null, lng: null });
          return;
        }
      } catch {}
      setState({ status: "unavailable", label: "", city: "", state: "",
                 confidence: "low", lat: null, lng: null });
    }

    if (!navigator?.geolocation) {
      ipFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          ipFallback();
          return;
        }
        // Unblock the initial Discovery feed as soon as browser geo resolves.
        // Reverse geocoding is a secondary enrichment step and must not gate cards.
        const coordinateLocation = {
          status: "ready",
          label: "",
          city: "",
          state: "",
          confidence: "low",
          lat,
          lng,
        };
        setState(coordinateLocation);
        saveDetectedLocation(window.localStorage, coordinateLocation);

        try {
          const geo = await reverseGeocode(lat, lng);
          setState((prev) => {
            if (prev.lat !== lat || prev.lng !== lng) return prev;
            const resolved = {
              status: "ready",
              label: geo.label,
              city: geo.city,
              state: geo.state,
              confidence: geo.confidence,
              lat,
              lng,
            };
            saveDetectedLocation(window.localStorage, resolved);
            return resolved;
          });
        } catch {
          // Keep the coordinate-backed ready state so Discovery cards remain visible.
        }
      },
      () => {
        ipFallback();
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return state;
}

export default function GrubbidDiscovery() {
  const { t, language } = useLanguage();
  const {
    isAuthenticated: consumerLoggedIn,
    loading: consumerLoading,
    profile: consumerProfile,
    dietaryPreferences,
    allergenPreferences,
    allergenFilter: consumerAllergenFilter,
  } = useConsumer();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const locationEditorRef = useRef(null);
  const locationEditorInputRef = useRef(null);
  const autoLocation = useAutoLocation();

  // ── existing state ──────────────────────────────────────────────────────────
  const [draftQuery, setDraftQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [searching, setSearching] = useState(false);
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [locationSaveState, setLocationSaveState] = useState("idle");
  const [locationInput, setLocationInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  });
  const [appliedLocation, setAppliedLocation] = useState(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  });
  const [recentLocations, setRecentLocations] = useState(() => loadRecentLocations());
  const [filters, setFilters] = useState(() => loadDietPrefs());
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [sortMode, setSortMode] = useState("");
  const [feedFacetCuisines, setFeedFacetCuisines] = useState([]);
  const [marketplaceMenuCount, setMarketplaceMenuCount] = useState(0);
  const [feedSupportsNearbySort, setFeedSupportsNearbySort] = useState(false);
  const [canonicalCuisineOptions, setCanonicalCuisineOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [rememberedOutOfMarketPromo, setRememberedOutOfMarketPromo] = useState(() => loadStoredOutOfMarketPromo());

  // ── new state ───────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheet, setMoreSheet] = useState(null);
  const [feedMenus, setFeedMenus] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const locationManuallySet = useRef(
    typeof window !== "undefined" && !!window.sessionStorage.getItem(SESSION_LOCATION_KEY)
  );
  const seededProfilePrefsRef = useRef(false);
  const seededProfileLocationRef = useRef(false);
  const [excludedAllergens, setExcludedAllergens] = useState(() => {
    try {
      const stored = localStorage.getItem(ALLERGEN_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [filterHealthBroken, setFilterHealthBroken] = useState(() => {
    try {
      return typeof window !== "undefined" && window.sessionStorage.getItem(FILTER_HEALTH_BROKEN_KEY) === "1";
    } catch {
      return false;
    }
  });
  const discoveryRequestRef = useRef(0);
  const feedCacheRef = useRef({});
  const resolvedLocationLabel = useMemo(() => {
    if (appliedLocation) return appliedLocation;
    return autoLocation.label;
  }, [appliedLocation, autoLocation.label]);
  const normalizedAppliedLocation = normalizeLocationLabel(appliedLocation);
  const normalizedAutoLocationLabel = normalizeLocationLabel(autoLocation.label);
  const autoLocationMatchesApplied =
    Boolean(normalizedAppliedLocation) &&
    normalizedAppliedLocation === normalizedAutoLocationLabel;
  const geoMarketLocation = useMemo(
    () =>
      resolveDiscoveryMarketLocation({
        autoLocation,
        useAutoGeo: autoLocation.status === "ready",
      }),
    [autoLocation]
  );
  const appliedMarketLocation = useMemo(
    () =>
      appliedLocation
        ? resolveDiscoveryMarketLocation({ explicitLabel: appliedLocation })
        : null,
    [appliedLocation]
  );
  // Radius browse (stable ~8mi count): device geo in an active market AND the selected
  // label is unset, matches geo label, same city/state, or another city in the same active
  // market (e.g. re-pick "Los Angeles, CA" after visiting Dothan while still in LA County).
  const shouldUseGeoBrowse =
    autoLocation.status === "ready" &&
    autoLocation.lat != null &&
    autoLocation.lng != null &&
    geoMarketLocation &&
    (!appliedLocation ||
      autoLocationMatchesApplied ||
      appliedLocationMatchesGeoCityState(appliedLocation, autoLocation) ||
      (appliedMarketLocation &&
        activeMarketsShareBrowseScope(geoMarketLocation, appliedMarketLocation)));
  const locationKey = useMemo(
    () => buildDiscoveryLocationKey({ shouldUseGeoBrowse, autoLocation, appliedLocation }),
    [shouldUseGeoBrowse, autoLocation, appliedLocation]
  );
  const joinInfoPath = useMemo(() => {
    const explicit = String(appliedLocation || "").trim();
    const marketLoc = resolveDiscoveryMarketLocation({
      explicitLabel: explicit,
      autoLocation,
      useAutoGeo: shouldUseGeoBrowse && !explicit,
    });
    return buildOutOfMarketJoinPath(marketLoc || {});
  }, [appliedLocation, shouldUseGeoBrowse, autoLocation]);

  const joinDinersPath = useMemo(() => {
    const qs = joinInfoPath.includes("?") ? joinInfoPath.slice(joinInfoPath.indexOf("?")) : "";
    return `/join/diners${qs}`;
  }, [joinInfoPath]);

  /** Empty-state copy: "City, ST" when we know location, else "your area". */
  const outOfMarketAreaLabel = useMemo(() => {
    const explicit = String(appliedLocation || "").trim();
    if (explicit) {
      const normalized = normalizeLocationLabel(explicit);
      if (normalized) return normalized;
      const parsed = parseLocation(explicit);
      const fromParsed = formatLocationLabel(parsed.city, parsed.state);
      if (fromParsed) return fromParsed;
    }
    if (autoLocation.label) return autoLocation.label;
    const fromGeo = formatLocationLabel(autoLocation.city, autoLocation.state);
    if (fromGeo) return fromGeo;
    return "your area";
  }, [
    appliedLocation,
    autoLocation.label,
    autoLocation.city,
    autoLocation.state,
  ]);

  const feedScopeKey = useMemo(
    () =>
      buildDiscoveryFeedScopeKey({
        locationKey,
        filters,
        browseMode: shouldUseGeoBrowse ? "geo" : "city",
      }),
    [locationKey, filters, shouldUseGeoBrowse]
  );

  const activeFilterLabel = (() => {
    if (filters.vegan) return "vegan";
    if (filters.vegetarian) return "vegetarian";
    if (filters.diabetic_friendly) return "diabetic-friendly";
    if (filters.dairy_free) return "dairy-free";
    if (filters.gluten_free) return "gluten-free";
    if (filters.keto) return "keto";
    if (filters.low_fat) return "low-fat";
    if (filters.low_sodium) return "low-sodium";
    return null;
  })();

  const activeFilterParams = filtersToUrlParams(filters).toString();
  const hasNoneAllergenSelected = excludedAllergens.has(ALLERGEN_NONE_ID);
  const activeExcludedAllergens = [...excludedAllergens].filter((value) => value !== ALLERGEN_NONE_ID);
  const hasActivePublicFilters =
    Object.values(filters).some(Boolean) || activeExcludedAllergens.length > 0;

  const displayMenus = useMemo(() => {
    let menus = filterAndRankMenus(feedMenus, committedQuery);
    if (activeExcludedAllergens.length > 0) {
      menus = menus.filter((menu) => {
        const allergens = [
          ...(menu?.allergens || []),
          ...(menu?.preview_allergens || []),
          ...(menu?.chips?.nutrition_chip?.allergens || []),
        ].map((a) => String(a).toLowerCase().replace(/_/g, " ").trim());
        return !activeExcludedAllergens.some((ex) =>
          allergens.some((a) => a.includes(ex) || ex.includes(a))
        );
      });
    }
    if (selectedCuisine) {
      menus = menus.filter((m) => String(m?.cuisine || "").trim().toLowerCase() === selectedCuisine);
    }
    if (sortMode === "nearby") {
      menus = [...menus].sort((a, b) => {
        const da = Number(a?.distance_miles ?? Infinity);
        const db = Number(b?.distance_miles ?? Infinity);
        if (!Number.isFinite(da) && !Number.isFinite(db)) return 0;
        if (!Number.isFinite(da)) return 1;
        if (!Number.isFinite(db)) return -1;
        return da - db;
      });
    }
    return menus;
  }, [feedMenus, committedQuery, activeExcludedAllergens, selectedCuisine, sortMode]);

  const feedCuisineOptions = useMemo(() => {
    const canonicalLabelByValue = new Map(
      canonicalCuisineOptions.map((opt) => [
        String(opt?.value || "").trim().toLowerCase(),
        opt?.label || opt?.value || "",
      ])
    );
    if (feedFacetCuisines.length > 0) {
      return feedFacetCuisines
        .filter((f) => Number(f?.count ?? 0) > 0)
        .map((f) => {
          const val = String(f.value || "").trim().toLowerCase();
          const label = canonicalLabelByValue.get(val) || f.label || val;
          return label ? { value: val, label } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    if (canonicalCuisineOptions.length === 0) return [];
    const seen = new Set();
    const opts = [];
    for (const menu of feedMenus) {
      const val = String(menu?.cuisine || "").trim().toLowerCase();
      const label = canonicalLabelByValue.get(val);
      if (val && label && !seen.has(val)) {
        seen.add(val);
        opts.push({ value: val, label });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [feedFacetCuisines, feedMenus, canonicalCuisineOptions]);

  const useExpandedBrowseControls = (marketplaceMenuCount || feedMenus.length) > 25;

  const hasBackendFeedData = feedMenus.length > 0;
  const hasVisibleMenus = displayMenus.length > 0;
  const showBackendEmptyState =
    !feedLoading &&
    !inlineError &&
    autoLocation.status !== "locating" &&
    !hasBackendFeedData;
  const showFilterEmptyState =
    !feedLoading &&
    !inlineError &&
    autoLocation.status !== "locating" &&
    hasBackendFeedData &&
    !hasVisibleMenus;
  const showOutOfMarketPromo = showBackendEmptyState;

  useEffect(() => {
    if (!showBackendEmptyState) return;

    const payload = {
      locationKey,
      label: outOfMarketAreaLabel,
      joinInfoPath,
      joinDinersPath,
      seenAt: Date.now(),
    };
    setRememberedOutOfMarketPromo(payload);
    saveStoredOutOfMarketPromo(payload);
  }, [showBackendEmptyState, locationKey, outOfMarketAreaLabel, joinInfoPath, joinDinersPath]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/api/meta/cuisines`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!cancelled && Array.isArray(json?.cuisines)) {
          setCanonicalCuisineOptions(json.cuisines);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSelectedCuisine("");
    setSortMode("");
  }, [feedScopeKey]);

  // Persist dietary prefs whenever they change
  useEffect(() => { saveDietPrefs(filters); }, [filters]);

  // Persist allergen exclusions
  useEffect(() => {
    try { localStorage.setItem(ALLERGEN_KEY, JSON.stringify([...excludedAllergens])); } catch {}
  }, [excludedAllergens]);

  useEffect(() => {
    if (consumerLoading || !consumerLoggedIn || seededProfilePrefsRef.current) return;

    if (!hasStoredDietSelection()) {
      setFilters(buildDiscoveryDietPrefsFromProfile(dietaryPreferences));
    }

    if (!hasStoredAllergenSelection()) {
      setExcludedAllergens(buildDiscoveryAllergenSetFromProfile(allergenPreferences, consumerAllergenFilter));
    }

    seededProfilePrefsRef.current = true;
  }, [
    consumerLoading,
    consumerLoggedIn,
    dietaryPreferences,
    allergenPreferences,
    consumerAllergenFilter,
  ]);

  function buildApiLocationParams() {
    const requestedLocationValue = String(getEffectiveSearchLocation() || "").trim();
    const explicitLocationValue =
      shouldUseGeoBrowse && (!requestedLocationValue || normalizeLocationLabel(requestedLocationValue) === normalizedAutoLocationLabel)
        ? ""
        : requestedLocationValue;
    const params = buildSearchLocationParams({
      query: "",
      explicitLocationValue,
      autoLocation,
      radiusMiles: LOCAL_RADIUS_MILES,
    });
    params.delete("q");
    return Object.fromEntries(params.entries());
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(FILTER_HEALTH_CHECKED_KEY) === "1") return;

    try { window.sessionStorage.setItem(FILTER_HEALTH_CHECKED_KEY, "1"); } catch {}
    const locationParams = buildApiLocationParams();
    if (!Object.keys(locationParams).length) return;

    verifyFilterHealth(locationParams)
      .then((result) => {
        if (!result.isWorking) {
          console.warn("FILTER HEALTH CHECK FAILED", result);
          setFilterHealthBroken(true);
          try { window.sessionStorage.setItem(FILTER_HEALTH_BROKEN_KEY, "1"); } catch {}
        } else {
          try { window.sessionStorage.setItem(FILTER_HEALTH_BROKEN_KEY, "0"); } catch {}
        }
      });
  // Intentionally once per session; location is read at mount time only.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save auto-detected label for cross-page location reading (e.g., Waiter page)
  useEffect(() => {
    if (!autoLocation.label) return;
    try { window.sessionStorage.setItem("grubbid.discovery.auto_label", autoLocation.label); } catch {}
  }, [autoLocation.label]);

  // When geo resolves, overwrite stale session location unless user manually set one
  useEffect(() => {
    if (autoLocation.status !== "ready" || autoLocation.lat == null || autoLocation.lng == null) return;

    try {
      window.sessionStorage.setItem(
        SESSION_GEO_KEY,
        JSON.stringify({ lat: autoLocation.lat, lng: autoLocation.lng })
      );
    } catch {}

    if (locationManuallySet.current) return;

    setAppliedLocation(autoLocation.label);
    if (autoLocation.label) setLocationInput(autoLocation.label);

    try {
      window.sessionStorage.removeItem(SESSION_LOCATION_KEY);
    } catch {}
  }, [autoLocation.status, autoLocation.lat, autoLocation.lng, autoLocation.label]);

  function handleAllergenToggle(id) {
    setExcludedAllergens((prev) => {
      if (id === ALLERGEN_NONE_ID) {
        return prev.has(ALLERGEN_NONE_ID) ? new Set() : new Set([ALLERGEN_NONE_ID]);
      }
      const next = new Set(prev);
      if (next.has(ALLERGEN_NONE_ID)) next.delete(ALLERGEN_NONE_ID);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Seed recent locations from session on first load
  useEffect(() => {
    const sessionLoc = typeof window !== "undefined"
      ? String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim()
      : "";
    if (sessionLoc) {
      saveRecentLocation(sessionLoc);
      setRecentLocations(loadRecentLocations());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showLocationEditor) return;

    const rafId = window.requestAnimationFrame(() => {
      locationEditorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      locationEditorInputRef.current?.focus();
      locationEditorInputRef.current?.select();
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [showLocationEditor]);

  // Auto-load feed when location becomes available or changes
  useEffect(() => {
    const hasLocation =
      shouldUseGeoBrowse ||
      appliedLocation;
    if (!hasLocation) return;

    const params = new URLSearchParams();
    if (shouldUseGeoBrowse) {
      // Omit city/state so /menus/browse uses geo+radius (consistent local radius).
      params.set("lat", String(autoLocation.lat));
      params.set("lng", String(autoLocation.lng));
      params.set("radius", String(LOCAL_RADIUS_MILES));
    } else if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.zip && !loc.city && !loc.state) {
        setFeedMenus([]);
        return;
      }
      if (loc.zip)   params.set("zip",   loc.zip);
      if (loc.city)  params.set("city",  loc.city);
      if (loc.state) params.set("state", loc.state);
    }

    const dietaryParams = buildDietaryQueryParams(filters);
    for (const [key, value] of Object.entries(dietaryParams)) {
      if (value) params.set(key, String(value));
    }

    const cachedMenus = feedCacheRef.current[feedScopeKey];
    const controller = new AbortController();
    const requestId = discoveryRequestRef.current + 1;
    discoveryRequestRef.current = requestId;

    // GUARDRAIL:
    // Menu/discovery results are location-scoped. Never append or merge results across
    // city/state/lat/lng location keys. On location key change, replace the result set
    // and ignore stale async responses from prior locations.
    setFeedMenus(Array.isArray(cachedMenus) ? cachedMenus : []);
    setFeedLoading(true);
    if (language && language !== "en") {
      params.set("lang", language);
    }
    const feedUrl = `${API}/menus/browse?${params.toString()}`;
    console.log("[Discovery] fetch URL:", feedUrl);
    fetch(feedUrl, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (controller.signal.aborted || discoveryRequestRef.current !== requestId) return;
        const menus = Array.isArray(json?.menus)
          ? json.menus
          : Array.isArray(json?.rows?.[0]?.menus)
            ? json.rows[0].menus
            : [];
        const nextMenus = dedupeDiscoveryMenus(menus);
        feedCacheRef.current[feedScopeKey] = nextMenus;
        setFeedMenus(nextMenus);
        setFeedFacetCuisines(Array.isArray(json?.facets?.cuisines) ? json.facets.cuisines : []);
        setMarketplaceMenuCount(Number(json?.marketplace_menu_count ?? 0));
        setFeedSupportsNearbySort(json?.supports?.sort_nearby === true);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
      })
      .finally(() => {
        if (controller.signal.aborted || discoveryRequestRef.current !== requestId) return;
        setFeedLoading(false);
      });

    return () => controller.abort();
  }, [shouldUseGeoBrowse, autoLocation.lat, autoLocation.lng, autoLocation.city, autoLocation.state, appliedLocation, filters, feedScopeKey, language]);

  // ── existing logic (unchanged) ──────────────────────────────────────────────

  function buildSearchParams(queryValue, options = {}) {
    const includeFilters = options.includeFilters !== false;
    const requestedLocationValue = String(options.locationOverride ?? appliedLocation ?? "").trim();
    const explicitLocationValue =
      shouldUseGeoBrowse && (!requestedLocationValue || normalizeLocationLabel(requestedLocationValue) === normalizedAutoLocationLabel)
        ? ""
        : requestedLocationValue;
    const params = buildSearchLocationParams({
      query: queryValue,
      explicitLocationValue,
      autoLocation,
      radiusMiles: LOCAL_RADIUS_MILES,
    });
    if (shouldUseGeoBrowse && autoLocation.label) {
      params.set("location_label", autoLocation.label);
    }
    if (includeFilters) {
      const dietaryParams = buildDietaryQueryParams(filters);
      for (const [key, value] of Object.entries(dietaryParams)) {
        if (value) params.set(key, String(value));
      }
      const restaurantParams = buildRestaurantFilterQueryParams({
        cuisine: selectedCuisine,
        category: selectedCategory,
      });
      for (const [key, value] of Object.entries(restaurantParams)) {
        if (value) params.set(key, value);
      }
    }
    return params;
  }

  async function runSearch(queryValue = draftQuery) {
    console.log("[Discovery] search committed:", queryValue);
    const locationOverride = getEffectiveSearchLocation();
    if (redirectIfInactiveSearchMarket(locationOverride)) return;

    setCommittedQuery(queryValue.trim());
    const params = buildSearchParams(queryValue, { locationOverride });
    setInlineError("");
    const qTerm = String(queryValue || "").trim();
    if (!qTerm) {
      navigate(`/search?${params.toString()}`);
      return;
    }
    captureEvent("search_performed", {
      query: qTerm,
      filters: { vegan: Boolean(filters.vegan), gluten_free: Boolean(filters.gluten_free), price_max: null },
    });
    setSearching(true);
    try {
      const url = `${API}/search?${params.toString()}&limit=1`;
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      const count = Array.isArray(json?.results) ? json.results.length : 0;
      if (count === 0) {
        const loc = getEffectiveSearchLocation() || "";
        const nearText = loc ? ` near ${loc}` : "";
        setInlineError(t("discovery.noResultsFoundFor", `No results found for "${qTerm}"${nearText}`, { query: qTerm, nearText }));
      } else {
        const locationLabel = resolvedLocationLabel || "";
        if (shouldUseGeoBrowse) {
          try {
            window.sessionStorage.removeItem(SESSION_LOCATION_KEY);
            window.sessionStorage.setItem(
              SESSION_GEO_KEY,
              JSON.stringify({ lat: autoLocation.lat, lng: autoLocation.lng })
            );
          } catch {}
        } else if (locationLabel) {
          saveRecentLocation(locationLabel);
          setRecentLocations(loadRecentLocations());
          try { window.sessionStorage.setItem(SESSION_LOCATION_KEY, locationLabel); } catch {}
        }
        navigate(`/search?${params.toString()}`);
      }
    } catch {
      const locationLabel = resolvedLocationLabel || "";
      if (!shouldUseGeoBrowse && locationLabel) {
        try { window.sessionStorage.setItem(SESSION_LOCATION_KEY, locationLabel); } catch {}
      }
      navigate(`/search?${params.toString()}`);
    } finally {
      setSearching(false);
    }
  }

  async function persistDefaultLocation(rawLabel, sourceOverride = null) {
    if (!consumerLoggedIn) return;
    const normalizedLabel = normalizeLocationLabel(String(rawLabel || ""));
    if (!normalizedLabel) return;
    const parsed = parseLocation(normalizedLabel);
    const useAutoCoords = autoLocation.label && normalizeLocationLabel(autoLocation.label) === normalizedLabel;
    const lat = useAutoCoords ? autoLocation.lat : null;
    const lng = useAutoCoords ? autoLocation.lng : null;
    const source = sourceOverride || (useAutoCoords ? "autodetect" : "manual");
    if (useAutoCoords && autoLocation.city) parsed.city = autoLocation.city;
    if (useAutoCoords && autoLocation.state) parsed.state = autoLocation.state;
    setLocationSaveState("saving");
    try {
      const locationsResponse = await getLocations();
      const locations = Array.isArray(locationsResponse?.locations) ? locationsResponse.locations : [];
      const existingDefault = locations.find((l) => l.is_default);
      const payload = {
        label: normalizedLabel,
        city: parsed.city || null,
        state: parsed.state || null,
        lat, lng, source, is_default: true,
      };
      if (existingDefault?.id) {
        await updateLocation(existingDefault.id, payload);
      } else {
        await addLocation(payload);
      }
      setLocationSaveState("saved");
    } catch {
      setLocationSaveState("error");
    }
  }

  async function applyLocationChange(rawValue, options = {}) {
    const nextLocation = normalizeLocationLabel((rawValue ?? locationInput).trim());
    locationManuallySet.current = true;
    setAppliedLocation(nextLocation);
    if (typeof window !== "undefined") {
      if (nextLocation) {
        window.sessionStorage.setItem(SESSION_LOCATION_KEY, nextLocation);
      } else {
        window.sessionStorage.removeItem(SESSION_LOCATION_KEY);
      }
    }
    if (nextLocation) {
      saveRecentLocation(nextLocation);
      setRecentLocations(loadRecentLocations());
    }
    setShowLocationEditor(false);
    if (nextLocation) {
      await persistDefaultLocation(nextLocation, options.source || null);
    }
  }

  useEffect(() => {
    if (consumerLoading || !consumerLoggedIn || seededProfileLocationRef.current) return;
    seededProfileLocationRef.current = true;

    if (typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_LOCATION_KEY)) {
      return;
    }

    const savedProfileLocation = normalizeLocationLabel(consumerProfile?.default_location_label || "");
    if (!savedProfileLocation) return;

    setLocationInput(savedProfileLocation);
    void applyLocationChange(savedProfileLocation, {
      source: consumerProfile?.location_source || "manual",
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    consumerLoading,
    consumerLoggedIn,
    consumerProfile?.default_location_label,
    consumerProfile?.location_source,
  ]);

  function getEffectiveSearchLocation() {
    const draft = locationInput.trim();
    if (showLocationEditor && draft) return draft;
    return appliedLocation;
  }

  function redirectIfInactiveSearchMarket(locationOverride) {
    const explicit = String(locationOverride ?? getEffectiveSearchLocation() ?? "").trim();
    const marketLoc = resolveDiscoveryMarketLocation({
      explicitLabel: explicit,
      autoLocation,
      useAutoGeo: shouldUseGeoBrowse && !explicit,
    });
    if (!isOutOfMarketSearch(marketLoc)) return false;
    navigate(buildOutOfMarketJoinPath(marketLoc), { replace: true });
    return true;
  }

  function handleChipClick(chip) {
    const locationOverride = getEffectiveSearchLocation();
    if (redirectIfInactiveSearchMarket(locationOverride)) return;
    const params = buildSearchParams(chip.query || "", { locationOverride });
    if (chip.filterKey) {
      params.set(chip.filterKey, "true");
    }
    navigate(`/search?${params.toString()}`);
  }

  function handleFilterToggle(key) {
    setFilters((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleBrowse() {
    const p = new URLSearchParams();
    if (shouldUseGeoBrowse) {
      if (autoLocation.city) p.set("city", autoLocation.city);
      if (autoLocation.state) p.set("state", autoLocation.state);
      p.set("lat", String(autoLocation.lat));
      p.set("lng", String(autoLocation.lng));
      p.set("radius_miles", String(LOCAL_RADIUS_MILES));
    } else if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.city) p.set("city", loc.city);
      if (loc.state) p.set("state", loc.state);
    } else if (autoLocation.city || autoLocation.state) {
      if (autoLocation.city) p.set("city", autoLocation.city);
      if (autoLocation.state) p.set("state", autoLocation.state);
    }
    const qs = p.toString();
    navigate(qs ? `${BROWSE_MENUS_PATH}?${qs}` : BROWSE_MENUS_PATH);
  }

  // ── render ──────────────────────────────────────────────────────────────────

  const locationPreferenceSummary = resolvedLocationLabel
    ? `Near ${resolvedLocationLabel}`
    : autoLocation.status === "locating"
    ? "Using current location"
    : "Enter city, state or zip";

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)" }}>
      <style>{`
        .disc-search-input::placeholder { color: var(--gb-color-ink-muted); font-size: 15px; font-weight: 500; }
        .disc-search-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(45,106,79,0.35); }
        .disc-feed-skeleton { animation: skelPulse 1.4s ease-in-out infinite; }
        @keyframes skelPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .disc-feed-grid { display:flex; flex-direction:column; gap:10px; }
        .disc-oom-copy {
          max-width: 620px;
          margin: 0;
          font-size: 14px;
          line-height: 1.65;
          color: var(--gb-color-ink);
          text-align: left;
        }
        .disc-oom-actions {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 320px;
          margin: 24px 0 0;
        }
        @media (min-width: 760px) {
          .disc-oom-actions {
            flex-direction: row;
            max-width: 360px;
          }
        }
        .disc-oom-button {
          flex: 1 1 0;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          padding: 10px 14px;
          border-radius: 12px;
          background: var(--gb-color-accent);
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
          text-decoration: none;
          white-space: nowrap;
          box-shadow: 0 10px 20px rgba(45, 106, 79, 0.18);
        }
        .disc-oom-button:hover { filter: brightness(1.03); }
      `}</style>

      <DiscoveryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        excludedAllergens={excludedAllergens}
        allergenNoneSelected={hasNoneAllergenSelected}
        onAllergenToggle={handleAllergenToggle}
      />

      <DiscoveryMoreSheet
        open={!!moreSheet}
        menu={moreSheet}
        onClose={() => setMoreSheet(null)}
      />


      <div style={{ maxWidth: 576, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: "calc(var(--bottom-nav-h, 72px) + 8px)" }}>

        {/* ── STICKY HEADER ──────────────────────────────────────────────── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          minWidth: 0,
          background: "var(--gb-color-page)",
          borderBottom: "1px solid var(--gb-color-border)",
          paddingBottom: 12,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 10px",
          }}>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                border: "none", background: "transparent",
                fontSize: 22, color: "var(--gb-color-ink-muted)", cursor: "pointer",
                padding: 4, lineHeight: 1, flexShrink: 0,
              }}
            >
              ☰
            </button>

            <BrandLogo height={36} radius={8} matchPageBackground={false} />

            <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
              <Link
                to="/deals"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  minHeight: 32, padding: "0 12px",
                  borderRadius: 999,
                  border: "1.5px solid rgba(34,197,94,0.3)",
                  background: "rgba(34,197,94,0.08)",
                  color: "#22C55E",
                  fontSize: 13, fontWeight: 800,
                  textDecoration: "none", whiteSpace: "nowrap",
                  letterSpacing: "0.01em",
                }}
              >
                🔥 Deals
              </Link>
              {!consumerLoading && (
                consumerLoggedIn ? (
                  <Link to="/account" style={{ fontSize: 22, textDecoration: "none" }}>
                    👤
                  </Link>
                ) : (
                  <Link to="/account/login" style={{
                    fontSize: 13, fontWeight: 700, color: "#22C55E", textDecoration: "none",
                  }}>
                    Sign in
                  </Link>
                )
              )}
            </div>
          </div>

          <div style={{ padding: "0 16px" }}>
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); runSearch(); }}
            >
              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  className="disc-search-input"
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  value={draftQuery}
                  onChange={(e) => {
                    console.log("[Discovery] input changed:", e.target.value);
                    setDraftQuery(e.target.value);
                  }}
                  placeholder="Search dishes, ingredients, cuisines, or restaurants..."
                  style={{
                    width: "100%",
                    height: 52,
                    borderRadius: 999,
                    border: "1.5px solid var(--gb-color-border)",
                    background: "var(--gb-color-surface-strong)",
                    paddingLeft: 22,
                    paddingRight: 92,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "var(--gb-color-ink)",
                    boxSizing: "border-box",
                    boxShadow: "var(--gb-shadow-soft)",
                  }}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  style={{
                    position: "absolute", right: 46, top: "50%",
                    transform: "translateY(-50%)",
                    border: "none", background: "transparent",
                    fontSize: 18, color: "#9CA3AF", cursor: "pointer",
                    padding: 4, lineHeight: 1,
                  }}
                >
                  🔍
                </button>
                <button
                  type="button"
                  aria-label="Add photo of menu text"
                  onClick={() => navigate("/menu-capture")}
                  style={{
                    position: "absolute", right: 14, top: "50%",
                    transform: "translateY(-50%)",
                    border: "none", background: "transparent",
                    fontSize: 20, color: "#9CA3AF", cursor: "pointer",
                    padding: 4, lineHeight: 1,
                  }}
                >
                  📸
                </button>
              </div>
            </form>
            {filterHealthBroken && (
              <div style={{
                marginTop: 10,
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid rgba(234,179,8,0.25)",
                background: "rgba(234,179,8,0.08)",
                color: "#FCD34D",
                fontSize: 13,
                fontWeight: 600,
              }}>
                ⚠️ Filters may not be applied correctly. Please refresh or try again.
              </div>
            )}
          </div>

          <div style={{ padding: "10px 16px 0" }}>
            <button
              type="button"
              onClick={() => setShowLocationEditor((prev) => !prev)}
              aria-expanded={showLocationEditor}
              aria-controls="discovery-location-editor"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                maxWidth: "100%",
                minHeight: 34,
                padding: "0 12px",
                borderRadius: 999,
                border: "1px solid rgba(34,197,94,0.2)",
                background: showLocationEditor ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)",
                color: "#22C55E",
                cursor: "pointer",
                transition: "background 140ms ease, opacity 140ms ease, border-color 140ms ease",
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 13, lineHeight: 1 }}>
                📍
              </span>
              <span
                style={{
                  minWidth: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {locationPreferenceSummary}
              </span>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  fontSize: 16,
                  color: "#22C55E",
                  opacity: 0.65,
                  lineHeight: 1,
                }}
              >
                ▾
              </span>
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, padding: "12px 0 4px", minWidth: 0 }}>
            <DiscoveryChipRow
              chips={FOOD_CATEGORY_CHIPS}
              filters={filters}
              onChipClick={handleChipClick}
            />
            <DiscoveryChipRow
              chips={INTELLIGENCE_CHIPS}
              filters={filters}
              onChipClick={handleChipClick}
            />
          </div>

          {/* Feed count + browse controls — sticky with header */}
          {!feedLoading && !inlineError && (
            <div style={{ padding: "6px 16px 0" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", fontSize: 12, fontWeight: 700, color: "#9ca3af" }}>
                {hasVisibleMenus && (
                  <span>{displayMenus.length} {displayMenus.length === 1 ? "menu" : "menus"}</span>
                )}
                {useExpandedBrowseControls ? (
                  <>
                    {feedCuisineOptions.length > 0 && (
                      <DiscoveryInlineSelect
                        value={selectedCuisine}
                        onChange={setSelectedCuisine}
                        options={[{ value: "", label: "All cuisines" }, ...feedCuisineOptions]}
                        ariaLabel="Filter by cuisine"
                      />
                    )}
                    <DiscoveryInlineSelect
                      value={sortMode || "nearby"}
                      onChange={setSortMode}
                      options={[{ value: "nearby", label: "Nearby" }]}
                      ariaLabel="Sort"
                      prefix="Sort: "
                      disabled={!feedSupportsNearbySort}
                    />
                    <button
                      type="button"
                      disabled
                      title="Open Now is unavailable until public hours logic is available."
                      style={{
                        minHeight: 28,
                        border: "1px solid rgba(156,163,175,0.25)",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.03)",
                        color: "rgba(156,163,175,0.4)",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "0 9px",
                        cursor: "default",
                      }}
                    >
                      Open Now
                    </button>
                  </>
                ) : (
                  feedCuisineOptions.length > 0 && (
                    <DiscoveryInlineSelect
                      value={selectedCuisine}
                      onChange={setSelectedCuisine}
                      options={[{ value: "", label: "All cuisines" }, ...feedCuisineOptions]}
                      ariaLabel="Filter by cuisine"
                      compact
                    />
                  )
                )}
                {/* GUARDRAIL:
                    Do not render broad allergen warning blocks on public discovery/browse/menu-list cards.
                    Allergen alerts are contextual item-level signals only and must remain small/restrained
                    unless the user explicitly opens an allergen/nutrition detail context. */}
                {hasNoneAllergenSelected ? (
                  <span style={{ color: "#667085", fontSize: 11, fontWeight: 800 }}>Allergen filter off</span>
                ) : activeExcludedAllergens.length > 0 ? (
                  <span style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700 }}>
                    Allergen exclusions: {activeExcludedAllergens.map((a) => formatDiscoveryAllergenLabel(a)).join(", ")}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* ── SCROLLABLE FEED CONTENT ────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "8px 10px 80px" }}>

          {/* Location editor — plain text field, no autocomplete (CLAUDE.md rule) */}
          {showLocationEditor && (
            <div
              id="discovery-location-editor"
              ref={locationEditorRef}
              style={{
              background: "var(--gb-color-surface-strong)", borderRadius: 16,
              border: "1px solid var(--gb-color-border)",
              padding: "16px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gb-color-ink)", marginBottom: 10 }}>
                {t("discovery.locationInputLabel", "Enter your location")}
              </div>

              {recentLocations.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
                  {recentLocations.map((label) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 10,
                      border: "1px solid var(--gb-color-border)",
                      background: locationInput === label ? "rgba(45,106,79,0.1)" : "var(--gb-color-surface)",
                    }}>
                      <button
                        type="button"
                        onClick={() => { setLocationInput(label); applyLocationChange(label); }}
                        style={{
                          border: "none", background: "transparent",
                          padding: 0, fontSize: 14, fontWeight: 700,
                          color: "var(--gb-color-ink)", cursor: "pointer", textAlign: "left", flex: 1,
                        }}
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentLocation(label);
                          setRecentLocations(loadRecentLocations());
                          if (locationInput === label) setLocationInput("");
                        }}
                        style={{
                          border: "none", background: "transparent",
                          padding: "0 0 0 8px", color: "#6B7280",
                          fontSize: 16, lineHeight: 1, cursor: "pointer",
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={locationEditorInputRef}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyLocationChange(); }}
                placeholder={t("discovery.locationInputPlaceholder", "City, state or zip code")}
                style={{
                  width: "100%", height: 42, borderRadius: 12,
                  border: "1px solid var(--gb-color-border-strong)", padding: "0 12px",
                  fontSize: 14, background: "var(--gb-color-surface-strong)", color: "var(--gb-color-ink)",
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => applyLocationChange()}
                  style={{
                    height: 38, padding: "0 16px", borderRadius: 10,
                    border: "1px solid var(--gb-color-border-strong)", background: "var(--gb-color-surface-strong)",
                    color: "var(--gb-color-ink)", fontWeight: 900, fontSize: 13, cursor: "pointer",
                  }}
                >
                  Apply
                </button>
                {autoLocation.label && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocationInput(autoLocation.label);
                      void applyLocationChange(autoLocation.label, { source: "autodetect" });
                    }}
                    style={{
                      height: 38, padding: "0 16px", borderRadius: 10,
                      border: "1px solid var(--gb-color-border-strong)", background: "var(--gb-color-surface-strong)",
                      color: "var(--gb-color-ink)", fontWeight: 900, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Use Current Location
                  </button>
                )}
              </div>

              {consumerLoggedIn && (
                <div style={{
                  marginTop: 8, fontSize: 12, fontWeight: 600,
                  color: locationSaveState === "error" ? "#FCA5A5" : "#6B7280",
                }}>
                  {locationSaveState === "saving" ? "Saving…"
                    : locationSaveState === "saved" ? "Default location updated."
                    : locationSaveState === "error" ? "Could not update account default."
                    : "Location changes also update your account default."}
                </div>
              )}
            </div>
          )}

          {/* Active drawer filters — shown as removable chips */}
          <ActiveFilterChips
            filters={filters}
            onToggle={handleFilterToggle}
          />

          {/* Inline search error */}
          {inlineError && (
            <div style={{
              marginBottom: 16, padding: "14px 18px",
              borderRadius: 14, border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.08)",
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#FCA5A5", marginBottom: 4 }}>
                {inlineError}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF" }}>
                {t("discovery.tryDifferent", "Try a different search or location.")}
              </div>
            </div>
          )}

          {/* Feed */}
          {feedLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="disc-feed-skeleton" style={{
                background: "rgba(18,34,28,0.07)", borderRadius: 20,
                height: 130, marginBottom: 10,
              }} />
            ))
          ) : inlineError ? null : showOutOfMarketPromo ? (
            <div style={{ textAlign: "left", padding: "24px 4px 32px" }}>
              <div style={{ color: "#1e2924", fontSize: 16, fontWeight: 700, lineHeight: 1.55, width: "100%", maxWidth: 760, margin: 0, textAlign: "left" }}>
                As the cost of dining continues to rise, Menuply is building a lower-cost alternative that enables restaurants to offer better value to diners in {outOfMarketAreaLabel}. Click below to learn more.
              </div>
              <div className="disc-oom-actions">
                <Link to={joinInfoPath} className="disc-oom-button">
                  Restaurants
                </Link>
                <Link to={joinDinersPath} className="disc-oom-button">
                  Diners
                </Link>
              </div>
            </div>
          ) : showFilterEmptyState ? (
            <div style={{
              textAlign: "center", padding: "48px 20px",
              color: "#9ca3af", fontSize: 15, fontWeight: 600, lineHeight: 1.6,
            }}>
              {"No items match the current filters."}
            </div>
          ) : (
            <div className="disc-feed-grid">
              {displayMenus.map((menu, i) => (
                (i + 1) % 6 === 0 ? (
                  <FeaturedDiscoveryCard
                    key={menu.menu_id || `feed-featured-${i}`}
                    menu={menu}
                    hasActiveFilters={hasActivePublicFilters}
                    activeFilterLabel={activeFilterLabel}
                    activeFilterParams={activeFilterParams}
                  />
                ) : (
                  <DiscoveryCard
                    key={menu.menu_id || `feed-${i}`}
                    menu={menu}
                    hasActiveFilters={hasActivePublicFilters}
                    activeFilterLabel={activeFilterLabel}
                    activeFilterParams={activeFilterParams}
                  />
                )
              ))}
            </div>
          )}

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
