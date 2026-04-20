import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { parseLocation, reverseGeocode } from "../lib/locationUtils.js";
import { forwardGeocode } from "../lib/geocodeUtils.js";
import { parseFiltersFromUrl, filtersToUrlParams, FILTER_KEYS, FILTER_LABELS } from "../lib/filterUtils.js";
import { buildDietaryQueryParams } from "../lib/dietaryParams.js";
import DiscoveryCard from "./discovery/DiscoveryCard.jsx";
import ActiveFilterChips from "./discovery/ActiveFilterChips.jsx";
import { PageShell } from "./grubbid/GrubbidPrimitives.jsx";
import { PageNav } from "./NavButton.jsx";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_GEO_KEY = "grubbid.discovery.geo";
const RECENT_LOCATIONS_KEY = "grubbid.recent.locations";
const MAX_RECENT = 3;

// ── Location helpers ─────────────────────────────────────────────────────────

function loadRecentLocations() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(RECENT_LOCATIONS_KEY) || "[]"); }
  catch { return []; }
}

function saveRecentLocation(label) {
  if (typeof window === "undefined" || !label) return;
  try {
    const existing = loadRecentLocations().filter((l) => l !== label);
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify([label, ...existing].slice(0, MAX_RECENT)));
  } catch {}
}

function removeRecentLocation(label) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(loadRecentLocations().filter((l) => l !== label)));
  } catch {}
}

// ── Auto-location hook ───────────────────────────────────────────────────────

function useAutoLocation() {
  const [loc, setLoc] = useState({
    status: "locating", label: "", city: "", state: "", lat: null, lng: null,
  });
  useEffect(() => {
    if (!navigator?.geolocation) {
      setLoc((s) => ({ ...s, status: "unavailable" }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos?.coords?.latitude);
        const lng = Number(pos?.coords?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setLoc((s) => ({ ...s, status: "unavailable" }));
          return;
        }
        try {
          const geo = await reverseGeocode(lat, lng);
          setLoc({ status: "ready", label: geo.label, city: geo.city, state: geo.state, lat, lng });
        } catch {
          setLoc({ status: "ready", label: "", city: "", state: "", lat, lng });
        }
      },
      () => setLoc((s) => ({ ...s, status: "denied" })),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);
  return loc;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function GrubbidHomeV1() {
  const navigate = useNavigate();
  const location = useLocation();
  const autoLocation = useAutoLocation();

  const [savedIds, setSavedIds] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);

  const [appliedLocation, setAppliedLocation] = useState(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  });
  const [locationInput, setLocationInput] = useState(() => {
    if (typeof window === "undefined") return "";
    return String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim();
  });
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [recentLocations, setRecentLocations] = useState(() => loadRecentLocations());

  // ── Filters from URL (URL is sole source of truth — no useState) ────────

  const filters = useMemo(
    () => parseFiltersFromUrl(new URLSearchParams(location.search || "")),
    [location.search]
  );

  function toggleFilter(key) {
    const next = { ...filters, [key]: !filters[key] };
    const nextParams = filtersToUrlParams(next, new URLSearchParams(location.search || ""));
    navigate({ search: nextParams.toString() ? `?${nextParams.toString()}` : "" }, { replace: true });
  }

  const resolvedLocationLabel = appliedLocation || autoLocation.label;
  const locationDisplayLabel = resolvedLocationLabel
    ? `Near ${resolvedLocationLabel}`
    : autoLocation.status === "locating"
    ? "Detecting location\u2026"
    : "Near You";

  const showSkeleton = loading || autoLocation.status === "locating";

  // ── Feed fetch ───────────────────────────────────────────────────────────

  useEffect(() => {
    const hasLocation =
      (autoLocation.status === "ready" && (autoLocation.city || autoLocation.lat)) ||
      appliedLocation;
    if (!hasLocation) return;

    const params = new URLSearchParams();

    // city/state (optional but useful)
    if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.city) params.set("city", loc.city);
      if (loc.state) params.set("state", loc.state);
    } else if (autoLocation.city) {
      params.set("city", autoLocation.city);
      if (autoLocation.state) params.set("state", autoLocation.state);
    }

    // ALWAYS resolve coordinates from one unified source
    let lat = null;
    let lng = null;

    try {
      const rawGeo = window.sessionStorage.getItem(SESSION_GEO_KEY);
      if (rawGeo) {
        const geo = JSON.parse(rawGeo);
        if (Number.isFinite(geo?.lat) && Number.isFinite(geo?.lng)) {
          lat = geo.lat;
          lng = geo.lng;
        }
      }
    } catch {}

    if (lat == null || lng == null) {
      if (Number.isFinite(autoLocation.lat) && Number.isFinite(autoLocation.lng)) {
        lat = autoLocation.lat;
        lng = autoLocation.lng;
      }
    }

    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }

    // Apply dietary filters from URL
    const dietaryParams = buildDietaryQueryParams(filters);
    for (const [key, value] of Object.entries(dietaryParams)) {
      if (value) params.set(key, String(value));
    }
    if (filters.deals) params.set("deals", "1");

    setLoading(true);
    fetch(`${API}/menus/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => setMenus(json.menus || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [autoLocation.status, autoLocation.city, autoLocation.lat, appliedLocation, location.search]);

  // Write lat/lng to session when autoLocation resolves (no manual override active)
  useEffect(() => {
    if (autoLocation.status !== "ready") return;
    if (autoLocation.lat == null || autoLocation.lng == null) return;
    if (appliedLocation) return;
    try {
      window.sessionStorage.setItem(
        SESSION_GEO_KEY,
        JSON.stringify({ lat: autoLocation.lat, lng: autoLocation.lng })
      );
    } catch {}
  }, [autoLocation.status, autoLocation.lat, autoLocation.lng, appliedLocation]);

  // ── Location editor ──────────────────────────────────────────────────────

  async function applyLocationChange(rawValue) {
    const next = (rawValue !== undefined ? rawValue : locationInput).trim();
    setAppliedLocation(next);
    setLocationInput(next);
    setShowLocationEditor(false);
    if (typeof window !== "undefined") {
      if (next) window.sessionStorage.setItem(SESSION_LOCATION_KEY, next);
      else window.sessionStorage.removeItem(SESSION_LOCATION_KEY);
      window.sessionStorage.removeItem(SESSION_GEO_KEY);
    }
    if (next) {
      saveRecentLocation(next);
      setRecentLocations(loadRecentLocations());
      const coords = await forwardGeocode(next);
      if (coords) {
        try {
          window.sessionStorage.setItem(
            SESSION_GEO_KEY,
            JSON.stringify({ lat: coords.lat, lng: coords.lng })
          );
        } catch {}
      }
    }
  }

  // ── Navigation ───────────────────────────────────────────────────────────

  function handleBrowseAll() {
    const params = new URLSearchParams();
    if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.city) params.set("city", loc.city);
      if (loc.state) params.set("state", loc.state);
    } else if (autoLocation.city) {
      params.set("city", autoLocation.city);
      if (autoLocation.state) params.set("state", autoLocation.state);
    }
    const qs = params.toString();
    navigate(qs ? `/browse-menus?${qs}` : "/browse-menus");
  }

  const toggleSave = (id) =>
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <PageShell>
      {/* GlobalHeader: search, Deals, Account, logo, hamburger */}
      <PageNav />

      {/* Location context — discovery-specific, below shared header */}
      <div style={{ marginBottom: 8 }}>
        <button
          type="button"
          onClick={() => setShowLocationEditor((v) => !v)}
          aria-expanded={showLocationEditor}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "1px solid rgba(22,101,62,0.18)",
            borderRadius: 999, padding: "4px 12px",
            cursor: "pointer", color: "#486257",
          }}
        >
          <span style={{ fontSize: 13 }}>📍</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{locationDisplayLabel}</span>
          <span style={{ fontSize: 11, color: "#6b7f76" }}>▾</span>
        </button>
      </div>

      {/* Location editor */}
      {showLocationEditor && (
        <div className="gb-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#344054", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Your location
          </div>

          {recentLocations.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
              {recentLocations.map((label) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 10px", borderRadius: 8,
                  background: locationInput === label ? "#f0faf4" : "#fafafa",
                  border: "1px solid #e4e7ec",
                }}>
                  <button
                    type="button"
                    onClick={() => { setLocationInput(label); applyLocationChange(label); }}
                    style={{
                      border: "none", background: "transparent", padding: 0,
                      fontSize: 14, fontWeight: 600, color: "#11211a",
                      cursor: "pointer", textAlign: "left", flex: 1,
                    }}
                  >{label}</button>
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
            placeholder="City, state or zip code"
            style={{
              width: "100%", height: 40, borderRadius: 10,
              border: "1px solid #d7dce5", padding: "0 12px",
              fontSize: 14, background: "#fff", boxSizing: "border-box",
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => applyLocationChange()}
              className="gb-pill-button gb-pill-button--primary"
            >Apply</button>
            {autoLocation.label && (
              <button
                type="button"
                onClick={() => { setLocationInput(autoLocation.label); applyLocationChange(autoLocation.label); }}
                className="gb-pill-button gb-pill-button--secondary"
              >Use Current Location</button>
            )}
            {appliedLocation && (
              <button
                type="button"
                onClick={() => applyLocationChange("")}
                className="gb-pill-button gb-pill-button--secondary"
              >Clear</button>
            )}
          </div>
        </div>
      )}

      {/* Section header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div className="gb-section-title">Near You</div>
        <button
          type="button"
          onClick={handleBrowseAll}
          style={{
            background: "none", border: "none", padding: 0,
            fontSize: 13, fontWeight: 700, color: "#1F4E3D",
            cursor: "pointer", textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >Browse all menus →</button>
      </div>

      {/* Filter toggles */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleFilter(key)}
            style={{
              display: "inline-flex", alignItems: "center",
              borderRadius: 999, padding: "5px 12px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              border: filters[key] ? "none" : "1px solid rgba(18,34,28,0.12)",
              background: filters[key] ? "#11211a" : "#fff",
              color: filters[key] ? "#fff" : "#11211a",
              whiteSpace: "nowrap",
            }}
          >
            {FILTER_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips filters={filters} onToggle={toggleFilter} />

      {/* Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {showSkeleton ? (
          [0, 1, 2].map((i) => (
            <div key={i} style={{
              height: 88, borderRadius: 16,
              background: "rgba(0,0,0,0.06)",
            }} />
          ))
        ) : menus.length === 0 ? (
          <div className="gb-status-message gb-status-message--muted">
            {autoLocation.status === "denied"
              ? "Enable location access to see nearby menus, or use the location control above."
              : "No menus found nearby. Try changing your location."}
          </div>
        ) : (
          menus.map((menu) => (
            <DiscoveryCard
              key={menu.menu_id || menu.restaurant_id}
              menu={menu}
              saved={savedIds.includes(menu.restaurant_id)}
              onSave={toggleSave}
            />
          ))
        )}
      </div>
    </PageShell>
  );
}
