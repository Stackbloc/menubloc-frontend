/**
 * ============================================================
 * File: BrowseMenus.jsx
 * Path: menubloc-frontend/src/pages/BrowseMenus.jsx
 * Date: 2026-03-14
 * Purpose:
 *   Restore the Browse Menus / Netflix-style browser page so it
 *   works against the current backend requirement for lat/lng.
 *
 *   This revision:
 *   - Requests browser geolocation on load
 *   - Sends lat/lng to GET /menus/browse
 *   - Falls back to a local dev coordinate when location is unavailable
 *   - Keeps the Netflix-style horizontal browse rail
 *   - Keeps filter UI visible but disabled
 *   - Improves the empty-state message when no nearby menus are found
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MenuPreviewCard from "../components/browse/MenuPreviewCard.jsx";
import { HomeButton } from "../components/NavButton.jsx";
import { getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";


function useIsMobile(breakpoint = 900) {
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

function readErrorMessage(error) {
  return toConsumerErrorMessage(
    error,
    "We couldn’t load nearby menus right now. Please try again in a moment."
  );
}

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

function FilterChip({ label, isMobile, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        width: isMobile ? "100%" : "auto",
        padding: "0 16px",
        borderRadius: 999,
        border: active ? "1px solid #11211a" : "1px solid rgba(18,34,28,0.12)",
        background: active ? "#11211a" : "rgba(255,255,255,0.70)",
        color: active ? "#f7f6f1" : "#5a7064",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        textAlign: "left",
        boxSizing: "border-box",
      }}
    >
      {label}
    </button>
  );
}

function FilterSelect({ label, options, value, onChange }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 0.9,
          textTransform: "uppercase",
          color: "#5a7064",
        }}
      >
        {label}
      </span>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          height: 44,
          width: "100%",
          borderRadius: 14,
          border: "1px solid rgba(18,34,28,0.10)",
          background: "rgba(255,255,255,0.70)",
          padding: "0 14px",
          color: "#5a7064",
          fontSize: 14,
          fontWeight: 700,
          outline: "none",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

const RESTAURANT_TYPE_OPTIONS = [
  "Bar / Pub",
  "Buffet",
  "Cafe",
  "Casual Dining",
  "Fast Casual",
  "Fast Food",
  "Fine Dining",
  "Food Truck",
  "QSR",
];

const CUISINE_OPTIONS = [
  "American",
  "Chinese",
  "Indian",
  "Italian",
  "Japanese",
  "Korean",
  "Mexican",
  "Thai",
  "Vietnamese",
];

function getUserCoords() {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      resolve({ lat: null, lng: null, source: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position?.coords?.latitude);
        const lng = Number(position?.coords?.longitude);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          resolve({ lat, lng, source: "browser" });
          return;
        }

        resolve({ lat: null, lng: null, source: "unavailable" });
      },
      () => {
        resolve({ lat: null, lng: null, source: "unavailable" });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 300000,
      }
    );
  });
}

export default function BrowseMenus() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { search } = useLocation();
  const urlParams = new URLSearchParams(search);
  const urlCity = urlParams.get("city") || "";
  const urlState = urlParams.get("state") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menus, setMenus] = useState([]);
  const [locationSource, setLocationSource] = useState("loading");
  // Seed from URL so a shared/bookmarked link shows the label immediately
  const [locationLabel, setLocationLabel] = useState(() => {
    const parts = [urlCity, urlState].filter(Boolean);
    return parts.join(", ");
  });
  const [filters, setFilters] = useState({
    cuisine: "",
    category: "",
    deals: false,
    vegan: false,
    vegetarian: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const coords = await getUserCoords();
        if (cancelled) return;

        setLocationSource(coords.source);

        const response = await getBrowseMenus({
          lat: coords.lat,
          lng: coords.lng,
          radius: 6,
          cuisine: filters.cuisine,
          category: filters.category,
          deals: filters.deals ? 1 : "",
          vegan: filters.vegan ? 1 : "",
          vegetarian: filters.vegetarian ? 1 : "",
        });

        if (cancelled) return;
        const extractedMenus = extractMenus(response);
        setMenus(extractedMenus);

        // Derive city/state from first returned menu and push to URL
        const first = extractedMenus[0];
        if (first?.city || first?.state) {
          const city = first.city || "";
          const state = first.state || "";
          const label = [city, state].filter(Boolean).join(", ");
          setLocationLabel(label);

          // Update URL if city/state aren't already there
          if (city !== urlCity || state !== urlState) {
            const next = new URLSearchParams(search);
            if (city) next.set("city", city); else next.delete("city");
            if (state) next.set("state", state); else next.delete("state");
            navigate("?" + next.toString(), { replace: true });
          }
        }
      } catch (fetchError) {
        if (cancelled) return;
        setError(readErrorMessage(fetchError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const showEmptyState = !loading && !error && menus.length === 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#11211a",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1450,
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          padding: isMobile ? "16px 12px 32px" : "28px 20px 56px",
        }}
      >
        <div style={{ marginBottom: isMobile ? 18 : 26 }}>
          <div style={{ marginBottom: 14 }}>
            <HomeButton />
          </div>

          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#11211a" }}>
            Grubbid
          </div>

          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: isMobile ? 24 : 28,
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            Browse All Menus
          </h1>

          <div
            style={{
              fontSize: isMobile ? 13 : 14,
              color: "#5a7064",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {locationSource === "browser"
              ? "Showing menus near your current location"
              : locationSource === "unavailable"
              ? "Showing all available menus"
              : "Loading nearby menus"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "nowrap",
            alignItems: "flex-start",
            gap: isMobile ? 16 : 24,
          }}
        >
          <aside
            style={{
              flex: isMobile ? "1 1 auto" : "0 0 260px",
              width: isMobile ? "100%" : 260,
              position: isMobile ? "static" : "sticky",
              top: isMobile ? "auto" : 18,
              alignSelf: "flex-start",
              minWidth: 0,
            }}
          >
            <div
              style={{
                borderRadius: 24,
                padding: isMobile ? 14 : 18,
                background: "rgba(255,255,255,0.68)",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 18px 40px rgba(30,41,59,0.08)",
                backdropFilter: "blur(10px)",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 0.9,
                  textTransform: "uppercase",
                  color: "#5a7064",
                  marginBottom: 14,
                }}
              >
                Filters
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <FilterSelect
                  label="Cuisine"
                  options={CUISINE_OPTIONS}
                  value={filters.cuisine}
                  onChange={(value) => setFilters((prev) => ({ ...prev, cuisine: value }))}
                />
                <FilterSelect
                  label="Category"
                  options={RESTAURANT_TYPE_OPTIONS}
                  value={filters.category}
                  onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: "#5a7064",
                    }}
                  >
                    Offers
                  </span>

                  <div style={{ display: "grid", gap: 10 }}>
                    <FilterChip
                      label="Deals"
                      isMobile={isMobile}
                      active={filters.deals}
                      onClick={() => setFilters((prev) => ({ ...prev, deals: !prev.deals }))}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: "#5a7064",
                    }}
                  >
                    Dietary
                  </span>

                  <div style={{ display: "grid", gap: 10 }}>
                    <FilterChip
                      label="Vegan"
                      isMobile={isMobile}
                      active={filters.vegan}
                      onClick={() => setFilters((prev) => ({ ...prev, vegan: !prev.vegan }))}
                    />
                    <FilterChip
                      label="Vegetarian"
                      isMobile={isMobile}
                      active={filters.vegetarian}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, vegetarian: !prev.vegetarian }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
            <div
              style={{
                borderRadius: 28,
                padding: isMobile ? "14px 14px 18px" : "18px 18px 22px",
                background: "rgba(255,255,255,0.50)",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 18px 40px rgba(30,41,59,0.07)",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "4px 4px 18px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: 0.9,
                      textTransform: "uppercase",
                      color: "#5a7064",
                    }}
                  >
                    Menus
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 15 : 16,
                      fontWeight: 800,
                      color: "#11211a",
                      marginTop: 4,
                      lineHeight: 1.35,
                    }}
                  >
                    {locationLabel
                      ? `Menus Near ${locationLabel}`
                      : locationSource === "browser"
                      ? "Menus Near You"
                      : "All Available Menus"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#5a7064",
                    whiteSpace: "nowrap",
                  }}
                >
                  {menus.length} menus
                </div>
              </div>

              {loading ? (
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    overflowX: "auto",
                    padding: "2px 4px 6px",
                    scrollSnapType: "x proximity",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((card) => (
                    <div
                      key={card}
                      style={{
                        flex: "0 0 auto",
                        width: isMobile ? "100%" : 260,
                        minWidth: isMobile ? "100%" : 260,
                        height: 148,
                        borderRadius: 16,
                        background: "rgba(0,0,0,0.06)",
                        scrollSnapAlign: "start",
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {error ? (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 18,
                    background: "#fff1f2",
                    color: "#9f1239",
                    border: "1px solid rgba(225,29,72,0.18)",
                    fontWeight: 700,
                    wordBreak: "break-word",
                  }}
                >
                  {error}
                </div>
              ) : null}

              {showEmptyState ? (
                <section
                  style={{
                    padding: isMobile ? "28px 16px" : "44px 24px",
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.64)",
                    textAlign: "center",
                    color: "#5a7064",
                  }}
                >
                  <div
                    style={{
                      fontSize: isMobile ? 20 : 24,
                      fontWeight: 900,
                      color: "#11211a",
                      marginBottom: 10,
                    }}
                  >
                    No nearby menus found yet
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 14 : 15,
                      maxWidth: 520,
                      margin: "0 auto",
                      lineHeight: 1.45,
                    }}
                  >
                    Grubbid is still building its menu database in this area. Check back soon or
                    try another search.
                  </div>
                </section>
              ) : null}

              {!loading && !error && menus.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    overflowX: "auto",
                    padding: "2px 4px 8px",
                    scrollSnapType: "x proximity",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {menus.map((menu, index) => (
                    <div
                      key={String(menu?.menu_id ?? menu?.restaurant_id ?? index)}
                      style={{
                        flex: "0 0 auto",
                        width: isMobile ? "100%" : 260,
                        minWidth: isMobile ? "100%" : 260,
                        scrollSnapAlign: "start",
                      }}
                    >
                      <MenuPreviewCard menu={menu} index={index} isMobile={isMobile} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
