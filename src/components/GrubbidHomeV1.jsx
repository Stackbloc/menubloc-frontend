import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseLocation, reverseGeocode } from "../lib/locationUtils.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const RECENT_LOCATIONS_KEY = "grubbid.recent.locations";
const MAX_RECENT = 3;

const CATEGORIES = [
  { label: "All",     icon: "✦" },
  { label: "Pizza",   icon: "🍕" },
  { label: "Tacos",   icon: "🌮" },
  { label: "Sushi",   icon: "🍣" },
  { label: "Healthy", icon: "🥗" },
  { label: "Dessert", icon: "🍦" },
];

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

export default function GrubbidHomeV1() {
  const navigate = useNavigate();
  const autoLocation = useAutoLocation();

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchFocused, setSearchFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("home");
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

  const resolvedLocationLabel = appliedLocation || autoLocation.label;
  const locationLabel = resolvedLocationLabel
    ? `Near ${resolvedLocationLabel}`
    : autoLocation.status === "locating"
    ? "Detecting location\u2026"
    : "Near You";

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
    } else if (autoLocation.city) {
      params.set("city", autoLocation.city);
      if (autoLocation.state) params.set("state", autoLocation.state);
    }
    if (!appliedLocation && autoLocation.lat != null && autoLocation.lng != null) {
      params.set("lat", String(autoLocation.lat));
      params.set("lng", String(autoLocation.lng));
    }
    setLoading(true);
    fetch(`${API}/menus/browse?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => setMenus(json.menus || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [autoLocation.status, autoLocation.city, autoLocation.lat, appliedLocation]);

  function applyLocationChange(rawValue) {
    const next = (rawValue !== undefined ? rawValue : locationInput).trim();
    setAppliedLocation(next);
    setLocationInput(next);
    if (typeof window !== "undefined") {
      if (next) window.sessionStorage.setItem(SESSION_LOCATION_KEY, next);
      else window.sessionStorage.removeItem(SESSION_LOCATION_KEY);
    }
    if (next) {
      saveRecentLocation(next);
      setRecentLocations(loadRecentLocations());
    }
    setShowLocationEditor(false);
  }

  function handleSearchKeyDown(e) {
    if (e.key !== "Enter") return;
    const q = query.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    if (appliedLocation) {
      const loc = parseLocation(appliedLocation);
      if (loc.city) params.set("city", loc.city);
      if (loc.state) params.set("state", loc.state);
    } else if (autoLocation.city) {
      params.set("city", autoLocation.city);
      if (autoLocation.state) params.set("state", autoLocation.state);
    }
    navigate(`/search?${params.toString()}`);
  }

  const toggleSave = (id) =>
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      background: "#f7f4ef",
      minHeight: "100vh",
      maxWidth: "390px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflowX: "hidden",
    }}>

      {/* Header */}
      <div style={{
        padding: "18px 20px 14px",
        background: "#f7f4ef",
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: "1px solid #e8e2d9",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px", color: "#1a1a1a" }}>
              Grubbid
            </div>
            <button
              type="button"
              onClick={() => setShowLocationEditor((v) => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: "none", border: "none", padding: 0,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
                📍 {locationLabel}
              </span>
              <span style={{ fontSize: "10px", color: "#aaa" }}>▾</span>
            </button>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => navigate("/deals")}
              style={{
                background: "#1a1a1a", color: "#f7f4ef",
                border: "none", borderRadius: "20px",
                padding: "7px 14px", fontSize: "12px",
                fontFamily: "Georgia, serif", cursor: "pointer",
                fontWeight: 600, letterSpacing: "0.3px",
              }}
            >Deals</button>
            <div
              onClick={() => navigate("/account")}
              style={{
                width: "34px", height: "34px",
                background: "#e8e2d9", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "15px", cursor: "pointer",
              }}
            >👤</div>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex", alignItems: "center",
          background: "#fff", borderRadius: "14px",
          border: searchFocused ? "2px solid #1a1a1a" : "2px solid #e8e2d9",
          padding: "11px 14px", gap: "10px",
          transition: "border 0.2s",
          boxShadow: searchFocused ? "0 4px 20px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <span style={{ fontSize: "16px", color: "#999" }}>🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search meals, ingredients..."
            style={{
              border: "none", outline: "none",
              flex: 1, minWidth: 0, width: "100%",
              fontSize: "14px", background: "transparent",
              color: "#1a1a1a", fontFamily: "Georgia, serif",
            }}
          />
          <div style={{
            background: "#f0ebe3", borderRadius: "8px",
            padding: "5px 8px", fontSize: "11px",
            color: "#666", cursor: "pointer",
            whiteSpace: "nowrap", fontFamily: "monospace", flexShrink: 0,
          }}>📷 Photo</div>
        </div>
      </div>

      {/* Category chips */}
      <div style={{
        display: "flex", gap: "8px",
        padding: "14px 20px",
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "7px 13px", borderRadius: "20px",
              border: activeCategory === cat.label ? "2px solid #1a1a1a" : "2px solid #e8e2d9",
              background: activeCategory === cat.label ? "#1a1a1a" : "#fff",
              color: activeCategory === cat.label ? "#f7f4ef" : "#555",
              fontSize: "12px", fontFamily: "Georgia, serif",
              cursor: "pointer", whiteSpace: "nowrap",
              fontWeight: activeCategory === cat.label ? 700 : 400,
              transition: "all 0.15s", flexShrink: 0,
            }}
          >
            <span>{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Location editor */}
      {showLocationEditor && (
        <div style={{
          margin: "0 20px 14px",
          background: "#fff", borderRadius: "14px",
          border: "1px solid #e8e2d9", padding: "14px 16px",
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#555", marginBottom: "10px", fontFamily: "monospace", letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Your location
          </div>

          {recentLocations.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "10px" }}>
              {recentLocations.map((label) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "7px 10px", borderRadius: "8px",
                  background: locationInput === label ? "#f0ebe3" : "#faf8f5",
                  border: "1px solid #ede8df",
                }}>
                  <button
                    type="button"
                    onClick={() => { setLocationInput(label); applyLocationChange(label); }}
                    style={{
                      border: "none", background: "transparent", padding: 0,
                      fontSize: "13px", fontWeight: 600, color: "#1a1a1a",
                      cursor: "pointer", textAlign: "left", flex: 1,
                      fontFamily: "Georgia, serif",
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
                      padding: "0 0 0 8px", color: "#bbb",
                      fontSize: "15px", lineHeight: 1, cursor: "pointer",
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
              width: "100%", height: "40px", borderRadius: "10px",
              border: "1.5px solid #e8e2d9", padding: "0 12px",
              fontSize: "13px", background: "#faf8f5",
              boxSizing: "border-box", fontFamily: "Georgia, serif",
              color: "#1a1a1a", outline: "none",
            }}
          />

          <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => applyLocationChange()}
              style={{
                height: "34px", padding: "0 16px", borderRadius: "20px",
                border: "2px solid #1a1a1a", background: "#1a1a1a",
                color: "#f7f4ef", fontWeight: 700, fontSize: "12px",
                cursor: "pointer", fontFamily: "Georgia, serif",
              }}
            >Apply</button>
            {autoLocation.label && (
              <button
                type="button"
                onClick={() => { setLocationInput(autoLocation.label); applyLocationChange(autoLocation.label); }}
                style={{
                  height: "34px", padding: "0 16px", borderRadius: "20px",
                  border: "2px solid #e8e2d9", background: "#fff",
                  color: "#555", fontWeight: 600, fontSize: "12px",
                  cursor: "pointer", fontFamily: "Georgia, serif",
                }}
              >Use Current</button>
            )}
            {appliedLocation && (
              <button
                type="button"
                onClick={() => applyLocationChange("")}
                style={{
                  height: "34px", padding: "0 14px", borderRadius: "20px",
                  border: "2px solid #e8e2d9", background: "#fff",
                  color: "#aaa", fontWeight: 600, fontSize: "12px",
                  cursor: "pointer", fontFamily: "Georgia, serif",
                }}
              >Clear</button>
            )}
          </div>
        </div>
      )}

      {/* Section label */}
      <div style={{ padding: "0 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
          Near You
        </div>
        <div style={{ fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
          {loading ? "Loading\u2026" : `${menus.length} results`}
        </div>
      </div>

      {/* Restaurant Cards */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "90px" }}>
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} style={{
              background: "#e8e2d9", borderRadius: "18px",
              height: "140px", opacity: 0.6,
            }} />
          ))
        ) : menus.length === 0 && autoLocation.status !== "locating" ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#aaa", fontSize: "14px" }}>
            {autoLocation.status === "denied"
              ? "Enable location to see nearby menus."
              : "No menus found nearby."}
          </div>
        ) : (
          menus.map((menu) => {
            const id = menu.restaurant_id;
            const name = menu.restaurant_name || "Restaurant";
            const cuisine = menu.cuisine || menu.category || "";
            const distance = menu.distance_miles != null
              ? `${Number(menu.distance_miles).toFixed(1)} mi`
              : null;
            const tags = (menu.preview_items || []).slice(0, 3);
            const href = `/public/restaurants/${id}/menu`;

            return (
              <div
                key={menu.menu_id || id}
                onClick={() => navigate(href)}
                style={{
                  background: "#fff", borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  border: "1px solid #ede8df",
                  cursor: "pointer",
                }}
              >
                <div style={{ height: "4px", background: "#1a1a1a" }} />
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "#1a1a1a", letterSpacing: "-0.2px" }}>
                        {name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#888", marginTop: "2px", fontFamily: "monospace" }}>
                        {[cuisine, distance].filter(Boolean).join(" \u00b7 ")}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave(id); }}
                      style={{
                        background: "none", border: "none",
                        fontSize: "18px", cursor: "pointer",
                        padding: "2px",
                        opacity: savedIds.includes(id) ? 1 : 0.35,
                        transition: "opacity 0.2s", flexShrink: 0,
                      }}
                    >🔖</button>
                  </div>

                  {tags.length > 0 && (
                    <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                      {tags.map((tag) => (
                        <span key={tag} style={{
                          background: "#f4f0ea", color: "#666",
                          fontSize: "11px", padding: "3px 9px",
                          borderRadius: "6px", fontFamily: "monospace",
                        }}>{tag}</span>
                      ))}
                    </div>
                  )}

                  <div style={{
                    marginTop: "12px", paddingTop: "10px",
                    borderTop: "1px solid #f0ebe3",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{
                      fontSize: "13px", fontWeight: 700, color: "#1a1a1a",
                      letterSpacing: "0.2px",
                      textDecoration: "underline", textUnderlineOffset: "3px",
                    }}>View menu →</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0,
        left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: "390px",
        background: "#fff", borderTop: "1px solid #e8e2d9",
        display: "flex", justifyContent: "space-around",
        padding: "10px 0 20px", zIndex: 20,
      }}>
        {[
          { id: "home",    icon: "⌂", label: "Home",    path: "/" },
          { id: "search",  icon: "⊕", label: "Explore", path: "/browse-menus" },
          { id: "saved",   icon: "◈", label: "Saved",   path: null },
          { id: "account", icon: "○", label: "Account", path: "/account" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (tab.path) navigate(tab.path); }}
            style={{
              background: "none", border: "none",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: "3px",
              cursor: "pointer", padding: "4px 12px",
            }}
          >
            <span style={{ fontSize: "20px", color: activeTab === tab.id ? "#1a1a1a" : "#bbb", transition: "color 0.15s" }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize: "10px",
              color: activeTab === tab.id ? "#1a1a1a" : "#bbb",
              fontFamily: "monospace",
              fontWeight: activeTab === tab.id ? 700 : 400,
              transition: "color 0.15s",
            }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
