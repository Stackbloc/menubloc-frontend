/**
 * ============================================================
 * File: GrubbidDiscovery.jsx
 * Path: menubloc-frontend/src/pages/GrubbidDiscovery.jsx
 * Date: 2026-03-15
 * Purpose:
 *   Search-first discovery page with automatic location detection.
 * ============================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const BROWSE_MENUS_PATH = "/browse-menus";
const LOCAL_RADIUS_MILES = 8;
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const CANDIDATE_SUGGESTED_SEARCHES = [
  "chicken sandwich",
  "tacos",
  "vegan breakfast",
  "gluten-free pizza",
  "burger",
  "salad",
  "breakfast",
];

function normalizeRows(json) {
  if (!json) return [];
  if (Array.isArray(json.results)) return json.results;
  if (Array.isArray(json.rows)) return json.rows;
  if (Array.isArray(json.menu_items)) return json.menu_items;
  if (Array.isArray(json.restaurants)) return json.restaurants;
  return [];
}

function hasSearchResults(json) {
  return normalizeRows(json).length > 0;
}

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
  if (!raw) return { zip: "", city: "", near: "", label: "" };
  if (/^\d{5}(?:-\d{4})?$/.test(raw)) {
    return { zip: raw, city: "", near: "", label: raw };
  }

  // Handle "City, ST" format (with comma)
  const parts = raw.split(",");
  if (parts.length >= 2) {
    const city = String(parts[0] || "").trim();
    return { zip: "", city, near: "", label: raw };
  }

  // Handle "City ST" format (no comma) — strip trailing 2-letter state abbreviation
  const tokens = raw.split(/\s+/);
  const last = tokens[tokens.length - 1].toLowerCase();
  if (tokens.length >= 2 && US_STATE_ABBREVS.has(last)) {
    const city = tokens.slice(0, -1).join(" ");
    return { zip: "", city, near: "", label: raw };
  }

  return { zip: "", city: raw, near: "", label: raw };
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 999,
        border: active ? "1px solid #111827" : "1px solid #d8dee8",
        background: active ? "#111827" : "#fff",
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
  const state =
    String(json?.principalSubdivisionCode || json?.principalSubdivision || "").trim();

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
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const isMobile = useIsMobile();
  const autoLocation = useAutoLocation();

  const [query, setQuery] = useState("");
  const [inlineError, setInlineError] = useState("");
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
  const [suggestedSearches, setSuggestedSearches] = useState([]);
  const [filters, setFilters] = useState({
    dairy_free: false,
    diabetic_friendly: false,
    gluten_free: false,
    vegan: false,
    vegetarian: false,
  });

  const resolvedLocationLabel = useMemo(() => {
    if (appliedLocation) return appliedLocation;
    return autoLocation.label;
  }, [appliedLocation, autoLocation.label]);

  function buildSearchParams(queryValue, options = {}) {
    const includeFilters = options.includeFilters !== false;
    const params = new URLSearchParams();
    const q = String(queryValue || "").trim();
    const explicitLocationValue = String(
      options.locationOverride ?? appliedLocation ?? ""
    ).trim();
    if (q) params.set("q", q);

    if (includeFilters) {
      if (filters.gluten_free) params.set("gluten_free", "1");
      if (filters.vegan) params.set("vegan", "1");
      if (filters.vegetarian) params.set("vegetarian", "1");
      if (filters.diabetic_friendly) params.set("health", "diabetic-friendly");
      if (filters.dairy_free) params.set("ingredients", "Dairy-free");
    }

    const explicitLocation = parseLocation(explicitLocationValue);
    if (explicitLocation.zip) params.set("zip", explicitLocation.zip);
    if (explicitLocation.city) params.set("city", explicitLocation.city);
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

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestedSearches() {
      const verified = [];

      for (const candidate of CANDIDATE_SUGGESTED_SEARCHES) {
        try {
          const params = buildSearchParams(candidate, { includeFilters: false });
          params.set("limit", "1");

          const res = await fetch(`${API}/search?${params.toString()}`, {
            credentials: "include",
          });
          const json = await res.json().catch(() => ({}));

          if (!cancelled && res.ok && json?.ok && hasSearchResults(json)) {
            verified.push(candidate);
          }
        } catch {}

        if (verified.length >= 4) break;
      }

      if (!cancelled) setSuggestedSearches(verified);
    }

    loadSuggestedSearches();
    return () => {
      cancelled = true;
    };
  }, [appliedLocation, autoLocation.lat, autoLocation.lng]);

  function runSearch(queryValue = query) {
    const params = buildSearchParams(queryValue, {
      locationOverride: getEffectiveSearchLocation(),
    });
    setInlineError("");
    navigate(`/search?${params.toString()}`);
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      runSearch();
    }
  }

  function applyLocationChange() {
    const nextLocation = locationInput.trim();
    setAppliedLocation(nextLocation);
    if (typeof window !== "undefined") {
      if (nextLocation) {
        window.sessionStorage.setItem(SESSION_LOCATION_KEY, nextLocation);
      } else {
        window.sessionStorage.removeItem(SESSION_LOCATION_KEY);
      }
    }
    setShowLocationEditor(false);
  }

  function getEffectiveSearchLocation() {
    const draft = locationInput.trim();
    if (showLocationEditor && draft) return draft;
    return appliedLocation;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f1", color: "#101828" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: isMobile ? "28px 16px 40px" : "52px 24px 56px",
          boxSizing: "border-box",
        }}
      >
        <style>
          {`
            .grubbid-discovery-search::placeholder {
              font-size: 14px;
              font-weight: 400;
              color: #667085;
            }
          `}
        </style>

        <div style={{ marginBottom: isMobile ? 32 : 48, fontSize: isMobile ? 22 : 28, fontWeight: 900 }}>
          Grubbid
        </div>

        <div style={{ maxWidth: 920 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto",
              gap: 12,
              alignItems: "stretch",
            }}
          >
            <input
              className="grubbid-discovery-search"
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="What do you want to eat today? Search food, ingredients, restaurants, or deals"
              style={{
                height: isMobile ? 64 : 72,
                width: "100%",
                borderRadius: 22,
                border: "1px solid #d7dce5",
                padding: isMobile ? "0 18px" : "0 22px",
                fontSize: isMobile ? 17 : 19,
                fontWeight: 600,
                boxSizing: "border-box",
                background: "#fff",
                color: "#101828",
                boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
              }}
            />

            <button
              type="button"
              onClick={() => runSearch(query)}
              style={{
                minWidth: isMobile ? "100%" : 132,
                height: isMobile ? 48 : 58,
                borderRadius: 16,
                border: "none",
                background: "#101828",
                color: "#fff",
                fontSize: isMobile ? 15 : 16,
                fontWeight: 900,
                cursor: "pointer",
                padding: "0 18px",
              }}
            >
              Search
            </button>
          </div>

          {suggestedSearches.length > 0 ? (
            <div style={{ marginTop: 14, fontSize: isMobile ? 14 : 15, color: "#475467", lineHeight: 1.5 }}>
              <span style={{ fontWeight: 800 }}>Try:</span>{" "}
              {suggestedSearches.map((term, index) => (
                <React.Fragment key={term}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(term);
                      runSearch(term);
                    }}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: 0,
                      color: "#124ba3",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {term}
                  </button>
                  {index < suggestedSearches.length - 1 ? " • " : ""}
                </React.Fragment>
              ))}
            </div>
          ) : null}

          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              width: isMobile ? "100%" : 132,
              marginLeft: isMobile ? 0 : "auto",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: "#667085",
                letterSpacing: 0.5,
              }}
            >
              OR
            </div>

            <button
              type="button"
              onClick={() => navigate(BROWSE_MENUS_PATH)}
              style={{
                width: "100%",
                height: isMobile ? 48 : 58,
                borderRadius: 16,
                border: "1px solid #101828",
                background: "#fff",
                color: "#101828",
                fontSize: isMobile ? 15 : 16,
                fontWeight: 900,
                cursor: "pointer",
                padding: "0 18px",
              }}
            >
              Browse Menus
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 6,
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
                ? `Searching near ${resolvedLocationLabel}`
                : autoLocation.status === "locating"
                ? "Determining your location"
                : "Searching near your location"}
              </div>

              <button
                type="button"
                onClick={() => setShowLocationEditor((prev) => !prev)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#124ba3",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Change location
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
                City, State or Zip Code
              </div>
              <input
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
                placeholder="City, State or Zip"
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
                  onClick={applyLocationChange}
                  style={{
                    height: 42,
                    padding: "0 16px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#111827",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          ) : null}

          {inlineError ? (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid #f4c7c7",
                background: "#fff1f1",
                color: "#8b1e1e",
                fontWeight: 700,
              }}
            >
              {inlineError}
            </div>
          ) : null}

          <div style={{ marginTop: 22 }}>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              style={{
                border: "none",
                background: "transparent",
                color: "#111827",
                fontSize: 15,
                fontWeight: 900,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Dietary Preferences {showFilters ? "▴" : "▾"}
            </button>

            {showFilters ? (
              <div
                style={{
                  marginTop: 14,
                  padding: "16px 18px",
                  background: "#fff",
                  borderRadius: 18,
                  border: "1px solid #e4e7ec",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
                }}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <FilterChip
                    label="Dairy Free"
                    active={filters.dairy_free}
                    onClick={() => setFilters((prev) => ({ ...prev, dairy_free: !prev.dairy_free }))}
                  />
                  <FilterChip
                    label="Diabetic Friendly"
                    active={filters.diabetic_friendly}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        diabetic_friendly: !prev.diabetic_friendly,
                      }))
                    }
                  />
                  <FilterChip
                    label="Gluten Free"
                    active={filters.gluten_free}
                    onClick={() => setFilters((prev) => ({ ...prev, gluten_free: !prev.gluten_free }))}
                  />
                  <FilterChip
                    label="Vegan"
                    active={filters.vegan}
                    onClick={() => setFilters((prev) => ({ ...prev, vegan: !prev.vegan }))}
                  />
                  <FilterChip
                    label="Vegetarian"
                    active={filters.vegetarian}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, vegetarian: !prev.vegetarian }))
                    }
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div
            style={{
              marginTop: 26,
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: 14,
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            <div style={{ fontSize: 14, color: "#667085" }}>
              <Link to="/restaurant/signup" style={{ color: "#124ba3", fontWeight: 800 }}>
                Restaurant sign up
              </Link>{" "}
              to get discovered
            </div>

            <div />
          </div>
        </div>
      </div>
    </div>
  );
}
