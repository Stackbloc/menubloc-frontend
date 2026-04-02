/**
 * ============================================================
 * File: GrubbidDiscovery.jsx
 * Path: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-03-17
 * Purpose:
 *   Search-first discovery page with automatic location detection.
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { loadDietPrefs, saveDietPrefs } from "../hooks/useDietPreferences";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";

const BROWSE_MENUS_PATH = "/browse-menus";
const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const LOCAL_RADIUS_MILES = 8;
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const RECENT_LOCATIONS_KEY = "grubbid.recent.locations";
const MAX_RECENT_LOCATIONS = 3;

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
  } catch {
    // ignore storage errors
  }
}

function removeRecentLocation(label) {
  if (typeof window === "undefined") return;
  try {
    const updated = loadRecentLocations().filter((l) => l !== label);
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}
const CANDIDATE_SUGGESTED_SEARCHES = [
  { value: "chicken sandwich", labelKey: "suggested.chickenSandwich" },
  { value: "tacos", labelKey: "suggested.tacos" },
  { value: "vegan breakfast", labelKey: "suggested.veganBreakfast" },
  { value: "gluten-free pizza", labelKey: "suggested.glutenFreePizza" },
  { value: "burger", labelKey: "suggested.burger" },
  { value: "salad", labelKey: "suggested.salad" },
  { value: "breakfast", labelKey: "suggested.breakfast" },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function handleResize() {
      setIsMobile(window.innerWidth <= breakpoint);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}

const US_STATE_ABBREVS = new Set([
  "al","ak","az","ar","ca","co","ct","de","fl","ga","hi","id","il","in","ia",
  "ks","ky","la","me","md","ma","mi","mn","ms","mo","mt","ne","nv","nh","nj",
  "nm","ny","nc","nd","oh","ok","or","pa","ri","sc","sd","tn","tx","ut","vt",
  "va","wa","wv","wi","wy","dc",
]);

function parseLocation(rawValue) {
  const raw = String(rawValue || "").trim();
  if (!raw) return { zip: "", city: "", state: "", near: "", label: "" };
  if (/^\d{5}(?:-\d{4})?$/.test(raw)) {
    return { zip: raw, city: "", state: "", near: "", label: raw };
  }

  // Handle "City, ST" format (with comma)
  const parts = raw.split(",");
  if (parts.length >= 2) {
    const city = String(parts[0] || "").trim();
    const state = String(parts[1] || "").trim().toUpperCase();
    return { zip: "", city, state, near: "", label: raw };
  }

  // Handle "City ST" format (no comma) — strip trailing 2-letter state abbreviation
  const tokens = raw.split(/\s+/);
  const last = tokens[tokens.length - 1].toLowerCase();
  if (tokens.length >= 2 && US_STATE_ABBREVS.has(last)) {
    const city = tokens.slice(0, -1).join(" ");
    return { zip: "", city, state: last.toUpperCase(), near: "", label: raw };
  }

  return { zip: "", city: raw, state: "", near: "", label: raw };
}

function FilterChip({ label, active, onClick, accentColor = "#111827" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        border: active ? `1px solid ${accentColor}` : "1px solid #d8dee8",
        background: active ? accentColor : "#fff",
        color: active ? "#fff" : "#1f2937",
        padding: "8px 12px",
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

async function reverseGeocode(lat, lng) {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("localityLanguage", "en");

  const res = await fetch(url.toString());
  const json = await res.json().catch(() => ({}));

  const city =
    String(json?.city || json?.locality || json?.principalSubdivision || "").trim();
  const locality =
    String(json?.city || json?.locality || json?.localityInfo?.administrative?.[2]?.name || "").trim();
  const rawState =
    String(json?.principalSubdivisionCode || json?.principalSubdivision || "").trim();
  // principalSubdivisionCode returns "US-CA" format — strip country prefix
  const state = rawState.includes("-") ? rawState.split("-").pop() : rawState;

  const cityLike = locality || city;
  return [cityLike, state].filter(Boolean).join(", ");
}

function useAutoLocation() {
  const [state, setState] = useState({
    status: "locating",
    label: "",
    lat: null,
    lng: null,
  });

  useEffect(() => {
    if (!navigator?.geolocation) {
      setState({ status: "unavailable", label: "", lat: null, lng: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setState({ status: "unavailable", label: "", lat: null, lng: null });
          return;
        }

        try {
          const label = await reverseGeocode(lat, lng);
          setState({ status: "ready", label, lat, lng });
        } catch {
          setState({ status: "ready", label: "", lat, lng });
        }
      },
      () => {
        setState({ status: "denied", label: "", lat: null, lng: null });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return state;
}

export default function GrubbidDiscovery() {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated: consumerLoggedIn, loading: consumerLoading } = useConsumer();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const isMobile = useIsMobile();
  const autoLocation = useAutoLocation();

  const [query, setQuery] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showLocationEditor, setShowLocationEditor] = useState(false);
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
  const [metaCategories, setMetaCategories] = useState([]);
  const [metaCuisines, setMetaCuisines] = useState([]);
  const suggestedSearches = CANDIDATE_SUGGESTED_SEARCHES.map((entry) => ({
    ...entry,
    label: t(entry.labelKey, entry.value),
  }));

  const resolvedLocationLabel = useMemo(() => {
    if (appliedLocation) return appliedLocation;
    return autoLocation.label;
  }, [appliedLocation, autoLocation.label]);

  // Persist dietary prefs whenever they change so other pages see them
  useEffect(() => { saveDietPrefs(filters); }, [filters]);

  // Load category and cuisine options from the meta API
  useEffect(() => {
    fetch(`${API}/api/meta/categories`)
      .then((r) => r.json())
      .then((json) => { if (json?.categories) setMetaCategories(json.categories); })
      .catch(() => {});
    fetch(`${API}/api/meta/cuisines`)
      .then((r) => r.json())
      .then((json) => { if (json?.cuisines) setMetaCuisines(json.cuisines); })
      .catch(() => {});
  }, []);

  // Seed recent locations from the session location on first load
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


  function buildSearchParams(queryValue, options = {}) {
    const includeFilters = options.includeFilters !== false;
    const params = new URLSearchParams();
    const q = String(queryValue || "").trim();
    const explicitLocationValue = String(
      options.locationOverride ?? appliedLocation ?? ""
    ).trim();

    // Append selected cuisine/category to the query so the backend text-matches them
    let effectiveQ = q;
    if (includeFilters) {
      if (selectedCuisine) effectiveQ = effectiveQ ? `${effectiveQ} ${selectedCuisine}` : selectedCuisine;
      if (selectedCategory) effectiveQ = effectiveQ ? `${effectiveQ} ${selectedCategory}` : selectedCategory;
    }
    if (effectiveQ) params.set("q", effectiveQ);

    if (includeFilters) {
      if (filters.gluten_free) params.set("gluten_free", "1");
      if (filters.keto) params.set("keto", "1");
      if (filters.low_sodium) params.set("low_sodium", "1");
      if (filters.vegan) params.set("vegan", "1");
      if (filters.vegetarian) params.set("vegetarian", "1");
      if (filters.diabetic_friendly) params.set("diabetic_friendly", "1");
      if (filters.dairy_free) params.set("dairy_free", "1");
    }

    const explicitLocation = parseLocation(explicitLocationValue);
    if (explicitLocation.zip) params.set("zip", explicitLocation.zip);
    if (explicitLocation.city) params.set("city", explicitLocation.city);
    if (explicitLocation.state) params.set("state", explicitLocation.state);
    if (explicitLocation.near) params.set("near", explicitLocation.near);
    if (explicitLocation.label) params.set("location_label", explicitLocation.label);

    if (!explicitLocation.label && autoLocation.lat != null && autoLocation.lng != null) {
      params.set("lat", String(autoLocation.lat));
      params.set("lng", String(autoLocation.lng));
      params.set("radius_miles", String(LOCAL_RADIUS_MILES));
      if (autoLocation.label) params.set("location_label", autoLocation.label);
    }

    return params;
  }

  async function runSearch(queryValue = query) {
    const params = buildSearchParams(queryValue, {
      locationOverride: getEffectiveSearchLocation(),
    });
    setInlineError("");

    // Need a query term to check results
    const qTerm = String(queryValue || "").trim();
    if (!qTerm) {
      navigate(`/search?${params.toString()}`);
      return;
    }

    setSearching(true);
    try {
      const url = `${API}/search?${params.toString()}&limit=1`;
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      const count = (json?.menu_items?.length || 0) + (json?.buckets?.restaurants?.length || 0);

      if (count === 0) {
        // Build a readable location label for the error message
        const loc = getEffectiveSearchLocation() || "";
        const parsed = loc.match(/^\d{5}/) ? loc : loc;
        const nearText = parsed ? ` near ${parsed}` : "";
        setInlineError(
          t("discovery.noResultsFoundFor", `No results found for "${qTerm}"${nearText}`, {
            query: qTerm,
            nearText,
          })
        );
      } else {
        const locationLabel = resolvedLocationLabel || "";
        if (locationLabel) {
          saveRecentLocation(locationLabel);
          setRecentLocations(loadRecentLocations());
          // Persist so returning to this page keeps the same location pre-filled,
          // even when the location was auto-detected (not manually applied).
          try { window.sessionStorage.setItem(SESSION_LOCATION_KEY, locationLabel); } catch { /* ignore */ }
        }
        navigate(`/search?${params.toString()}`);
      }
    } catch {
      // On network error just navigate anyway — still persist location
      const locationLabel = resolvedLocationLabel || "";
      if (locationLabel) {
        try { window.sessionStorage.setItem(SESSION_LOCATION_KEY, locationLabel); } catch { /* ignore */ }
      }
      navigate(`/search?${params.toString()}`);
    } finally {
      setSearching(false);
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  }

  function normalizeLocationLabel(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return trimmed;
    // Use parseLocation to handle both "City, ST" and "City ST" formats
    const parsed = parseLocation(trimmed);
    const city = parsed.city.replace(/\b\w/g, (c) => c.toUpperCase());
    if (parsed.zip) return parsed.zip;
    // Reconstruct state from label if parseLocation didn't extract it
    const labelParts = trimmed.split(",");
    const rawState = labelParts.length >= 2
      ? labelParts[1].trim()
      : (() => {
          const tokens = trimmed.split(/\s+/);
          const last = tokens[tokens.length - 1];
          return US_STATE_ABBREVS.has(last.toLowerCase()) ? last : "";
        })();
    const state = rawState.toUpperCase();
    return state ? `${city}, ${state}` : city;
  }

  function applyLocationChange(rawValue) {
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
  }

  function getEffectiveSearchLocation() {
    const draft = locationInput.trim();
    if (showLocationEditor && draft) return draft;
    return appliedLocation;
  }

  function buildTopPicksHref() {
    const params = buildSearchParams("", {
      includeFilters: false,
      locationOverride: getEffectiveSearchLocation(),
    });
    return `/top-picks?${params.toString()}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: isMobile ? "36px 14px 56px" : "72px 32px 80px",
          boxSizing: "border-box",
        }}
      >
        <style>
          {`
            .grubbid-discovery-search-row {
              width: 100%;
            }

            .grubbid-discovery-search::placeholder {
              font-size: 14px;
              font-weight: 400;
              color: #667085;
            }

            @media (max-width: 768px) {
              .grubbid-discovery-search-row {
                width: calc(100% + 28px);
                margin-left: -14px;
              }

              .grubbid-discovery-search::placeholder {
                font-size: 13px;
              }
            }
          `}
        </style>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isMobile ? 44 : 64 }}>
          <div>
            <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#11211a" }}>
              Grubbid
            </div>
            <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700, color: "#667085", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 2 }}>
              {t("nav.discovery")}
            </div>
          </div>
          {!consumerLoading && (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {consumerLoggedIn ? (
                <Link to="/account" style={{ fontSize: 14, fontWeight: 700, color: "#1F4E3D", textDecoration: "none" }}>
                  Account
                </Link>
              ) : (
                <>
                  <Link to="/account/login" style={{ fontSize: 14, fontWeight: 600, color: "#1F4E3D", textDecoration: "none" }}>
                    Log In
                  </Link>
                  <Link to="/account/signup" style={{ fontSize: 14, fontWeight: 700, color: "#fff", background: "#1F4E3D", padding: "6px 14px", borderRadius: 8, textDecoration: "none" }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ maxWidth: 920 }}>
          <div
            style={{
              fontSize: isMobile ? 15 : 17,
              fontWeight: 800,
              color: "#667085",
              letterSpacing: 0.3,
              marginBottom: isMobile ? 20 : 24,
              paddingLeft: 14,
            }}
          >
            {t("discovery.tagline")}
          </div>

          {/* Search row — input and button are the same height */}
          <div
            className="grubbid-discovery-search-row"
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 10,
            }}
          >
            <input
              className="grubbid-discovery-search"
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={t("discovery.searchPlaceholder")}
              style={{
                flex: 1,
                width: isMobile ? "100%" : undefined,
                height: isMobile ? 56 : 64,
                borderRadius: 16,
                border: "1px solid #d7dce5",
                padding: isMobile ? "0 16px" : "0 20px",
                fontSize: isMobile ? 16 : 18,
                fontWeight: 600,
                boxSizing: "border-box",
                background: "#fff",
                color: "#101828",
                boxShadow: "0 8px 24px rgba(15,23,42,0.07)",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={() => runSearch(query)}
              disabled={searching}
              style={{
                flexShrink: 0,
                width: isMobile ? "100%" : 120,
                height: isMobile ? 56 : 64,
                borderRadius: 16,
                border: "none",
                background: searching ? "#344054" : "#101828",
                color: "#fff",
                fontSize: 16,
                fontWeight: 900,
                cursor: searching ? "default" : "pointer",
                letterSpacing: 0.2,
                transition: "background 160ms ease",
              }}
            >
              {searching ? "…" : t("common.search")}
            </button>
          </div>

          {/* Suggested searches */}
          <div style={{ marginTop: 20, fontSize: isMobile ? 13 : 14, color: "#475467", lineHeight: 1.6 }}>
            {t("discovery.tryLine")}
          </div>

          {/* OR divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: isMobile ? 32 : 40,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "#e4e7ec" }} />
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: "#9ca3af",
                letterSpacing: 1.2,
              }}
            >
              {t("discovery.or")}
            </div>
            <div style={{ flex: 1, height: 1, background: "#e4e7ec" }} />
          </div>

          {/* Browse Menus — centered space-bar style button */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: isMobile ? 20 : 24 }}>
            <button
              type="button"
              onClick={() => {
                if (resolvedLocationLabel) {
                  const loc = parseLocation(resolvedLocationLabel);
                  const p = new URLSearchParams();
                  if (loc.city) p.set("city", loc.city);
                  // Extract state from label (parseLocation doesn't return it directly)
                  const labelParts = resolvedLocationLabel.split(",");
                  const stateRaw = labelParts.length >= 2 ? labelParts[1].trim() : "";
                  if (stateRaw) p.set("state", stateRaw.toUpperCase());
                  navigate(`${BROWSE_MENUS_PATH}?${p.toString()}`);
                } else {
                  navigate(BROWSE_MENUS_PATH);
                }
              }}
              style={{
                height: isMobile ? 46 : 52,
                padding: "0 52px",
                borderRadius: 14,
                border: "1px solid #d7dce5",
                background: "#fff",
                color: "#101828",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 0.1,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <span>{t("discovery.browseMenus")}</span>
                <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.6 }}>{t("discovery.local")}</span>
              </span>
            </button>
          </div>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: isMobile ? 4 : 10,
                alignItems: isMobile ? "flex-start" : "center",
              }}
            >
              <div style={{ fontSize: 14, color: "#475467", fontWeight: 700 }}>
              {resolvedLocationLabel
                ? t("discovery.searchingNear", `Searching near ${resolvedLocationLabel}`, { location: resolvedLocationLabel })
                : autoLocation.status === "locating"
                ? t("discovery.determiningLocation")
                : t("discovery.searchingNearYou")}
              </div>

              <button
                type="button"
                onClick={() => setShowLocationEditor((prev) => !prev)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#11211a",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {t("discovery.changeLocation")}
              </button>
            </div>
          </div>

          {showLocationEditor ? (
            <div
              style={{
                marginTop: 12,
                maxWidth: 420,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: "#344054" }}>
                {t("discovery.locationInputLabel")}
              </div>

              {/* Recent locations — click to select */}
              {recentLocations.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {recentLocations.map((label) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        borderRadius: 10,
                        border: "1px solid #e4e7ec",
                        background: locationInput === label ? "#f0faf4" : "#fafafa",
                        cursor: "pointer",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => { setLocationInput(label); applyLocationChange(label); }}
                        style={{
                          border: "none",
                          background: "transparent",
                          padding: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#11211a",
                          cursor: "pointer",
                          textAlign: "left",
                          flex: 1,
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
                          border: "none",
                          background: "transparent",
                          padding: "0 0 0 8px",
                          color: "#9ca3af",
                          fontSize: 16,
                          lineHeight: 1,
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <input
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                placeholder={t("discovery.locationInputPlaceholder")}
                style={{
                  height: 42,
                  borderRadius: 12,
                  border: "1px solid #d7dce5",
                  padding: "0 12px",
                  fontSize: 14,
                  background: "#fff",
                }}
              />
              <div>
                <button
                  type="button"
                  onClick={() => applyLocationChange()}
                  style={{
                    height: 42,
                    padding: "0 16px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#11211a",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  {t("common.apply")}
                </button>
              </div>
            </div>
          ) : null}

          {inlineError ? (
            <div
              style={{
                marginTop: 20,
                padding: "16px 20px",
                borderRadius: 16,
                border: "1px solid rgba(18,34,28,0.08)",
                background: "#fff",
                boxShadow: "0 4px 14px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900, color: "#11211a", marginBottom: 4 }}>
                {inlineError}
              </div>
              <div style={{ fontSize: 13, color: "#667085", fontWeight: 500 }}>
                {t("discovery.tryDifferent")}
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 40 }}>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              style={{
                border: "none",
                background: "transparent",
                color: "#11211a",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer",
                padding: 0,
              }}
            >
              {`${t("discovery.preferences")} ${showFilters ? "▴" : "▾"}`}
            </button>

            {showFilters ? (
              <div
                style={{
                  marginTop: 14,
                  borderRadius: 18,
                  border: "1px solid #e4e7ec",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
                  overflow: "hidden",
                }}
              >
                {/* Dietary filters */}
                <div
                  style={{
                    padding: "14px 18px",
                    background: "#fff",
                    borderBottom: "1px solid #e4e7ec",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 900, color: "#9ca3af", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 10 }}>
                    {t("discovery.dietary")}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <FilterChip
                      label={t("diet.dairy_free")}
                      active={filters.dairy_free}
                      onClick={() => setFilters((prev) => ({ ...prev, dairy_free: !prev.dairy_free }))}
                    />
                    <FilterChip
                      label={t("diet.diabetic_friendly")}
                      active={filters.diabetic_friendly}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          diabetic_friendly: !prev.diabetic_friendly,
                        }))
                      }
                    />
                    <FilterChip
                      label={t("diet.gluten_free")}
                      active={filters.gluten_free}
                      onClick={() => setFilters((prev) => ({ ...prev, gluten_free: !prev.gluten_free }))}
                    />
                    <FilterChip
                      label={t("diet.keto")}
                      active={filters.keto}
                      onClick={() => setFilters((prev) => ({ ...prev, keto: !prev.keto }))}
                    />
                    <FilterChip
                      label={t("diet.low_sodium")}
                      active={filters.low_sodium}
                      onClick={() => setFilters((prev) => ({ ...prev, low_sodium: !prev.low_sodium }))}
                    />
                    <FilterChip
                      label={t("diet.vegan")}
                      active={filters.vegan}
                      onClick={() => setFilters((prev) => ({ ...prev, vegan: !prev.vegan }))}
                    />
                    <FilterChip
                      label={t("diet.vegetarian")}
                      active={filters.vegetarian}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, vegetarian: !prev.vegetarian }))
                      }
                    />
                  </div>
                </div>

                {/* Cuisine & Category filters */}
                <div
                  style={{
                    padding: "14px 18px",
                    background: "#f0faf4",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: "#065f46", letterSpacing: 1.1, textTransform: "uppercase" }}>
                      {t("browse.cuisine")}
                    </label>
                    <select
                      value={selectedCuisine}
                      onChange={(e) => setSelectedCuisine(e.target.value)}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid #a7f3d0",
                        background: "#fff",
                        color: "#065f46",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "0 10px",
                        cursor: "pointer",
                        minWidth: 160,
                      }}
                    >
                      <option value="">{t("discovery.allCuisines")}</option>
                      {metaCuisines.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 900, color: "#065f46", letterSpacing: 1.1, textTransform: "uppercase" }}>
                      {t("browse.category")}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{
                        height: 36,
                        borderRadius: 8,
                        border: "1px solid #a7f3d0",
                        background: "#fff",
                        color: "#065f46",
                        fontWeight: 700,
                        fontSize: 13,
                        padding: "0 10px",
                        cursor: "pointer",
                        minWidth: 160,
                      }}
                    >
                      <option value="">{t("discovery.allCategories")}</option>
                      {metaCategories.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div
            style={{
              marginTop: isMobile ? 72 : 100,
              paddingTop: isMobile ? 32 : 40,
              borderTop: "1px solid #e4e7ec",
              display: "flex",
              flexWrap: "wrap",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: isMobile ? "flex-start" : "space-between",
              gap: isMobile ? 16 : 20,
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: isMobile ? 16 : 28,
                fontSize: 13,
                alignItems: "center",
                flex: isMobile ? "0 0 auto" : "1 1 auto",
              }}
            >
              <Link to="/restaurant/signup" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
                {t("discovery.footer.signup")}
              </Link>
              <Link
                to={(() => {
                  if (!resolvedLocationLabel) return "/deals";
                  const parts = resolvedLocationLabel.split(",").map((s) => s.trim());
                  const p = new URLSearchParams();
                  if (parts[0]) p.set("city", parts[0]);
                  if (parts[1]) p.set("state", parts[1]);
                  return `/deals?${p.toString()}`;
                })()}
                style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}
              >
                {t("discovery.footer.deals")}
              </Link>
              {(resolvedLocationLabel || (autoLocation.lat != null && autoLocation.lng != null)) ? (
                <Link
                  to={buildTopPicksHref()}
                  style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}
                >
                  {resolvedLocationLabel
                    ? t("discovery.footer.topPicksIn", `Top Picks in ${resolvedLocationLabel.split(",")[0].trim()}`, {
                        city: resolvedLocationLabel.split(",")[0].trim(),
                      })
                    : t("discovery.footer.topPicksNearYou")}
                </Link>
              ) : (
                <span style={{ color: "#9ca3af", fontWeight: 700, cursor: "default" }}>
                  {t("discovery.footer.topPicksNearYou")}
                </span>
              )}
              <Link to="/terms" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
                {t("discovery.footer.terms")}
              </Link>
              <Link to="/about" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
                About Grubbid
              </Link>
              <Link to="/contact" style={{ color: "#344054", fontWeight: 700, textDecoration: "none" }}>
                {t("discovery.footer.contact")}
              </Link>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginLeft: isMobile ? 0 : "auto",
              }}
            >
              <span style={{ color: "#667085", fontWeight: 800 }} aria-hidden="true">
                🌐
              </span>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label={t("footer.language")}
                style={{
                  height: 32,
                  borderRadius: 10,
                  border: "1px solid rgba(18,34,28,0.12)",
                  background: "#fff",
                  color: "#11211a",
                  padding: "0 10px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <option value="en">{t("language.english")}</option>
                <option value="es">{t("language.spanish")}</option>
                <option value="zh">{t("language.chinese")}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
