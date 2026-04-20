/**
 * ============================================================
 * File: GrubbidDiscovery.jsx
 * Path: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-04-17
 * Purpose:
 *   Mobile-first discovery page. Fixed top bar + search, auto-loading
 *   browse feed, left drawer, more-options bottom sheet.
 *   All search/location/filter logic preserved from prior version.
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
import { BrandLogo, BrandLockup } from "../components/BrandLogo.jsx";
import {
  buildSearchLocationParams,
  normalizeLocationLabel,
  parseLocation,
  reverseGeocode,
} from "../lib/locationUtils.js";
import { captureEvent } from "../services/posthog.js";
import ActiveFilterChips from "../components/discovery/ActiveFilterChips.jsx";
import DiscoveryDrawer from "../components/grubbid/DiscoveryDrawer.jsx";
import DiscoveryCard from "../components/discovery/DiscoveryCard.jsx";
import DiscoveryMoreSheet from "../components/grubbid/DiscoveryMoreSheet.jsx";
import AppMenuSheet from "../components/grubbid/AppMenuSheet.jsx";
import BottomNav from "../components/BottomNav.jsx";

const BROWSE_MENUS_PATH = "/browse-menus";
const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const LOCAL_RADIUS_MILES = 8;
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const RECENT_LOCATIONS_KEY = "grubbid.recent.locations";
const MAX_RECENT_LOCATIONS = 3;
const ALLERGEN_KEY = "grubbid.allergen.exclusions";

const ALLERGENS = [
  { id: "nuts",      label: "Nuts" },
  { id: "dairy",     label: "Dairy" },
  { id: "shellfish", label: "Shellfish" },
  { id: "gluten",    label: "Gluten" },
  { id: "soy",       label: "Soy" },
  { id: "eggs",      label: "Eggs" },
  { id: "fish",      label: "Fish" },
];

const FOOD_CHIPS = [
  { id: "pizza",      icon: "🍕", label: "Pizza",      query: "pizza" },
  { id: "burgers",    icon: "🍔", label: "Burgers",    query: "burgers" },
  { id: "sandwiches", icon: "🥪", label: "Sandwiches", query: "sandwiches" },
  { id: "tacos",      icon: "🌮", label: "Tacos",      query: "tacos" },
  { id: "sushi",      icon: "🍣", label: "Sushi",      query: "sushi" },
  { id: "wings",      icon: "🍗", label: "Wings",      query: "wings" },
  { id: "salads",     icon: "🥗", label: "Salads",     query: "salads" },
];

// Re-ranks feed when query is active; falls back to full list if nothing matches
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
    if (/low.?sodium/.test(q) && menu.has_low_sodium_options) score += 8;
    if (/diabetic/.test(q) && menu.has_diabetic_friendly_options) score += 8;
    if (/deal/.test(q) && menu.has_deals) score += 8;
    return { menu, score };
  });
  const matches = scored.filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);
  return matches.length > 0 ? matches.map(({ menu }) => menu) : menus;
}

// Returns one short match reason, or null if no strong signal
function buildMatchReason(menu, filters, query) {
  if (filters.vegan && menu.has_vegan_options) return "Match: Vegan Friendly";
  if (filters.gluten_free && menu.has_gluten_free_options) return "Match: Gluten-Free";
  if (filters.diabetic_friendly && menu.has_diabetic_friendly_options) return "Match: Diabetic Friendly";
  if (filters.keto && menu.has_keto_options) return "Match: Low Carb";
  if (filters.dairy_free && menu.has_dairy_free_options) return "Match: Dairy-Free";
  if (filters.low_sodium && menu.has_low_sodium_options) return "Match: Low Sodium";
  const q = (query || "").toLowerCase();
  if (q) {
    if (/vegan|plant.?based/.test(q) && menu.has_vegan_options) return "Match: Vegan Friendly";
    if (/gluten.?free/.test(q) && menu.has_gluten_free_options) return "Match: Gluten-Free";
    if (/keto|low.?carb/.test(q) && menu.has_keto_options) return "Match: Low Carb";
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

function removeRecentLocation(label) {
  if (typeof window === "undefined") return;
  try {
    const updated = loadRecentLocations().filter((l) => l !== label);
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
  } catch {}
}

function useAutoLocation() {
  const [state, setState] = useState({
    status: "locating",
    label: "", city: "", state: "", confidence: "low", lat: null, lng: null,
  });

  useEffect(() => {
    if (!navigator?.geolocation) {
      setState({ status: "unavailable", label: "", city: "", state: "", confidence: "low", lat: null, lng: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setState({ status: "unavailable", label: "", city: "", state: "", confidence: "low", lat: null, lng: null });
          return;
        }
        try {
          const geo = await reverseGeocode(lat, lng);
          setState({ status: "ready", label: geo.label, city: geo.city, state: geo.state, confidence: geo.confidence, lat, lng });
        } catch {
          setState({ status: "ready", label: "", city: "", state: "", confidence: "low", lat, lng });
        }
      },
      () => {
        setState({ status: "denied", label: "", city: "", state: "", confidence: "low", lat: null, lng: null });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return state;
}

export default function GrubbidDiscovery() {
  const { t } = useLanguage();
  const { isAuthenticated: consumerLoggedIn, loading: consumerLoading } = useConsumer();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const autoLocation = useAutoLocation();

  // ── existing state ──────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
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
  const [selectedCategory, setSelectedCategory] = useState("");

  // ── new state ───────────────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreSheet, setMoreSheet] = useState(null);
  const [appMenuOpen, setAppMenuOpen] = useState(false);
  const [feedMenus, setFeedMenus] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [excludedAllergens, setExcludedAllergens] = useState(() => {
    try {
      const stored = localStorage.getItem(ALLERGEN_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const resolvedLocationLabel = useMemo(() => {
    if (appliedLocation) return appliedLocation;
    return autoLocation.label;
  }, [appliedLocation, autoLocation.label]);

  const displayMenus = useMemo(() => {
    let menus = filterAndRankMenus(feedMenus, query);
    if (excludedAllergens.size > 0) {
      menus = menus.filter((menu) => {
        const allergens = [
          ...(menu?.allergens || []),
          ...(menu?.preview_allergens || []),
          ...(menu?.chips?.nutrition_chip?.allergens || []),
        ].map((a) => String(a).toLowerCase().replace(/_/g, " ").trim());
        return ![...excludedAllergens].some((ex) =>
          allergens.some((a) => a.includes(ex) || ex.includes(a))
        );
      });
    }
    return menus;
  }, [feedMenus, query, excludedAllergens]);

  // Persist dietary prefs whenever they change
  useEffect(() => { saveDietPrefs(filters); }, [filters]);

  // Persist allergen exclusions
  useEffect(() => {
    try { localStorage.setItem(ALLERGEN_KEY, JSON.stringify([...excludedAllergens])); } catch {}
  }, [excludedAllergens]);

  function handleAllergenToggle(id) {
    setExcludedAllergens((prev) => {
      const next = new Set(prev);
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

  // Auto-load feed when location becomes available or changes
  useEffect(() => {
    const hasLocation =
      (autoLocation.status === "ready" && (autoLocation.city || autoLocation.lat)) ||
      appliedLocation;
    if (!hasLocation) return;

    const params = new URLSearchParams();
    if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.city) params.set("city", loc.city);
      if (loc.state) params.set("state", loc.state);
    } else if (autoLocation.lat != null && autoLocation.lng != null) {
      // Auto-detected location: filter by geo radius, not city name.
      // reverseGeocode locality names often don't match restaurant DB city values.
      params.set("lat", String(autoLocation.lat));
      params.set("lng", String(autoLocation.lng));
      params.set("radius", String(LOCAL_RADIUS_MILES));
    }

    setFeedLoading(true);
    fetch(`${API}/menus/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => { setFeedMenus(json.menus || []); })
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, [autoLocation.status, autoLocation.city, autoLocation.lat, appliedLocation]);

  // ── existing logic (unchanged) ──────────────────────────────────────────────

  function buildSearchParams(queryValue, options = {}) {
    const includeFilters = options.includeFilters !== false;
    const explicitLocationValue = String(options.locationOverride ?? appliedLocation ?? "").trim();
    const params = buildSearchLocationParams({
      query: queryValue,
      explicitLocationValue,
      autoLocation,
      radiusMiles: LOCAL_RADIUS_MILES,
    });
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

  async function runSearch(queryValue = query) {
    const params = buildSearchParams(queryValue, { locationOverride: getEffectiveSearchLocation() });
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
      const count = (json?.menu_items?.length || 0) + (json?.buckets?.restaurants?.length || 0);
      if (count === 0) {
        const loc = getEffectiveSearchLocation() || "";
        const nearText = loc ? ` near ${loc}` : "";
        setInlineError(t("discovery.noResultsFoundFor", `No results found for "${qTerm}"${nearText}`, { query: qTerm, nearText }));
      } else {
        const locationLabel = resolvedLocationLabel || "";
        if (locationLabel) {
          saveRecentLocation(locationLabel);
          setRecentLocations(loadRecentLocations());
          try { window.sessionStorage.setItem(SESSION_LOCATION_KEY, locationLabel); } catch {}
        }
        navigate(`/search?${params.toString()}`);
      }
    } catch {
      const locationLabel = resolvedLocationLabel || "";
      if (locationLabel) {
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

  function getEffectiveSearchLocation() {
    const draft = locationInput.trim();
    if (showLocationEditor && draft) return draft;
    return appliedLocation;
  }

  function handleChipClick(chip) {
    const params = buildSearchParams(chip.query, { locationOverride: getEffectiveSearchLocation() });
    navigate(`/search?${params.toString()}`);
  }

  function handleFilterToggle(key) {
    setFilters((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleBrowse() {
    const p = new URLSearchParams();
    if (appliedLocation) {
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
    : autoLocation.status === "denied"
    ? "Location access denied"
    : "Enter city, state or zip";

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
      <style>{`
        .disc-search-input::placeholder { color: #9ca3af; font-size: 15px; font-weight: 500; }
        .disc-search-input:focus { outline: none; box-shadow: 0 0 0 2px rgba(31,78,61,0.25); }
        .disc-feed-skeleton { animation: skelPulse 1.4s ease-in-out infinite; }
        @keyframes skelPulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .disc-feed-grid { display:flex; flex-direction:column; gap:6px; }
      `}</style>

      <DiscoveryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        setFilters={setFilters}
        excludedAllergens={excludedAllergens}
        onAllergenToggle={handleAllergenToggle}
      />

      <DiscoveryMoreSheet
        open={!!moreSheet}
        menu={moreSheet}
        onClose={() => setMoreSheet(null)}
      />

      <AppMenuSheet
        open={appMenuOpen}
        onClose={() => setAppMenuOpen(false)}
      />

      <div style={{ maxWidth: 576, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* ── STICKY HEADER ──────────────────────────────────────────────── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "#f7f6f1",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
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
                fontSize: 22, color: "#101828", cursor: "pointer",
                padding: 4, lineHeight: 1, flexShrink: 0,
              }}
            >
              ☰
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <BrandLogo width={72} height={48} radius={14} pageColor="#f7f6f1" />
              <div style={{
                width: 72,
                marginTop: -1,
                padding: "4px 0 6px",
                textAlign: "center",
                background: "linear-gradient(180deg, #1a6b47 0%, #0d3d28 100%)",
                color: "#6ee7b7",
                fontSize: 8,
                fontWeight: 900,
                letterSpacing: "0.13em",
                textTransform: "uppercase",
                borderRadius: "0 0 7px 7px",
                boxShadow: "0 6px 16px rgba(13,61,40,0.55), inset 0 1px 0 rgba(255,255,255,0.10)",
                userSelect: "none",
              }}>
                ✦ BidFree Bidding
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <Link
                to="/deals"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  minHeight: 32, padding: "0 12px",
                  borderRadius: 999,
                  border: "1.5px solid rgba(196,55,0,0.38)",
                  background: "#fff4ef",
                  color: "#c03200",
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
                    fontSize: 13, fontWeight: 700, color: "#1F4E3D", textDecoration: "none",
                  }}>
                    Sign in
                  </Link>
                )
              )}
              <button
                type="button"
                onClick={() => setAppMenuOpen(true)}
                aria-label="Open app menu"
                style={{
                  border: "none", background: "transparent",
                  fontSize: 20, color: "#667085", cursor: "pointer",
                  padding: 4, lineHeight: 1,
                }}
              >
                ⋯
              </button>
            </div>
          </div>

          <div style={{ padding: "0 16px" }}>
            <div style={{ position: "relative" }}>
              <input
                ref={inputRef}
                className="disc-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); runSearch(); } }}
                placeholder="Search by food, restaurant, dietary preference, ingredient…"
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 999,
                  border: "1.5px solid #e4e7ec",
                  background: "#fff",
                  paddingLeft: 22,
                  paddingRight: 56,
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#101828",
                  boxSizing: "border-box",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
                }}
              />
              <button
                type="button"
                aria-label="Add menu photo"
                onClick={() => navigate("/restaurant/menu-upload-choice")}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)",
                  border: "none", background: "transparent",
                  fontSize: 20, color: "#667085", cursor: "pointer",
                  padding: 4, lineHeight: 1,
                }}
              >
                📸
              </button>
            </div>
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
                border: "1px solid rgba(22,101,62,0.18)",
                background: showLocationEditor ? "rgba(22,101,62,0.12)" : "rgba(22,101,62,0.08)",
                color: "#486257",
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
                  color: "#1F4E3D",
                  opacity: 0.65,
                  lineHeight: 1,
                }}
              >
                ▾
              </span>
            </button>
          </div>

          {/* Food category chips */}
          <div style={{
            padding: "8px 16px 0",
            display: "flex", gap: 6,
            overflowX: "auto", scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}>
            {FOOD_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipClick(chip)}
                style={{
                  height: 28, padding: "0 12px", borderRadius: 999,
                  flexShrink: 0, cursor: "pointer", whiteSpace: "nowrap",
                  border: "1.5px solid #e4e7ec",
                  background: "#fff", color: "#344054",
                  fontSize: 12, fontWeight: 700,
                }}
              >
                {chip.icon} {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SCROLLABLE FEED CONTENT ────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "8px 10px 80px" }}>

          {/* Location editor — plain text field, no autocomplete (CLAUDE.md rule) */}
          {showLocationEditor && (
            <div
              id="discovery-location-editor"
              style={{
              background: "#fff", borderRadius: 16,
              border: "1px solid #e4e7ec",
              padding: "16px", marginBottom: 16,
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#344054", marginBottom: 10 }}>
                {t("discovery.locationInputLabel", "Enter your location")}
              </div>

              {recentLocations.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
                  {recentLocations.map((label) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 10,
                      border: "1px solid #e4e7ec",
                      background: locationInput === label ? "#f0faf4" : "#fafafa",
                    }}>
                      <button
                        type="button"
                        onClick={() => { setLocationInput(label); applyLocationChange(label); }}
                        style={{
                          border: "none", background: "transparent",
                          padding: 0, fontSize: 14, fontWeight: 700,
                          color: "#11211a", cursor: "pointer", textAlign: "left", flex: 1,
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
                          padding: "0 0 0 8px", color: "#9ca3af",
                          fontSize: 16, lineHeight: 1, cursor: "pointer",
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              <input
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyLocationChange(); }}
                placeholder={t("discovery.locationInputPlaceholder", "City, state or zip code")}
                style={{
                  width: "100%", height: 42, borderRadius: 12,
                  border: "1px solid #d7dce5", padding: "0 12px",
                  fontSize: 14, background: "#fff", boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => applyLocationChange()}
                  style={{
                    height: 38, padding: "0 16px", borderRadius: 10,
                    border: "1px solid #cbd5e1", background: "#fff",
                    color: "#11211a", fontWeight: 900, fontSize: 13, cursor: "pointer",
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
                      border: "1px solid #cbd5e1", background: "#fff",
                      color: "#11211a", fontWeight: 900, fontSize: 13, cursor: "pointer",
                    }}
                  >
                    Use Current Location
                  </button>
                )}
              </div>

              {consumerLoggedIn && (
                <div style={{
                  marginTop: 8, fontSize: 12, fontWeight: 600,
                  color: locationSaveState === "error" ? "#b42318" : "#667085",
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
              borderRadius: 14, border: "1px solid #fecaca",
              background: "#fff8f8",
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#b91c1c", marginBottom: 4 }}>
                {inlineError}
              </div>
              <div style={{ fontSize: 13, color: "#667085" }}>
                {t("discovery.tryDifferent", "Try a different search or location.")}
              </div>
            </div>
          )}

          {/* Feed count + active filter status */}
          {!feedLoading && (
            <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 8, paddingLeft: 2, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {displayMenus.length > 0 && (
                <span>{displayMenus.length} {displayMenus.length === 1 ? "menu" : "menus"}</span>
              )}
              {excludedAllergens.size > 0 && (
                <span style={{ color: "#dc2626", fontSize: 11, fontWeight: 800 }}>
                  ⚠ {[...excludedAllergens].map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join(", ")} excluded
                </span>
              )}
            </div>
          )}

          {/* Feed */}
          {feedLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="disc-feed-skeleton" style={{
                background: "#e4e7ec", borderRadius: 20,
                height: 130, marginBottom: 10,
              }} />
            ))
          ) : displayMenus.length === 0 && autoLocation.status !== "locating" ? (
            <div style={{
              textAlign: "center", padding: "48px 20px",
              color: "#9ca3af", fontSize: 15, fontWeight: 600, lineHeight: 1.6,
            }}>
              {autoLocation.status === "denied"
                ? "Enable location access to see menus, or tap your location to enter a city."
                : "No menus found. Try changing your location."}
            </div>
          ) : (
            <div className="disc-feed-grid">
              {displayMenus.map((menu, i) => (
                <DiscoveryCard key={menu.menu_id || `feed-${i}`} menu={menu} />
              ))}
            </div>
          )}

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
