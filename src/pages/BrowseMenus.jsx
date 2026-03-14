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
import MenuPreviewCard from "../components/browse/MenuPreviewCard.jsx";
import { HomeButton } from "../components/NavButton.jsx";
import { getBrowseMenus } from "../lib/api.js";

const DEV_FALLBACK_COORDS = {
  lat: 31.2232,
  lng: -85.3905,
};

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
  return String(error?.message || error || "Unable to load menus.");
}

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

function DisabledChip({ label, isMobile }) {
  return (
    <button
      type="button"
      disabled
      title="Temporarily disabled in debug mode"
      style={{
        height: 40,
        width: isMobile ? "100%" : "auto",
        padding: "0 16px",
        borderRadius: 999,
        border: "1px solid rgba(18,34,28,0.12)",
        background: "rgba(255,255,255,0.70)",
        color: "#5a7064",
        fontSize: 13,
        fontWeight: 800,
        cursor: "not-allowed",
        textAlign: "left",
        opacity: 0.7,
        boxSizing: "border-box",
      }}
    >
      {label}
    </button>
  );
}

function DisabledSelect({ label, options }) {
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
        disabled
        title="Temporarily disabled in debug mode"
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
          cursor: "not-allowed",
          opacity: 0.7,
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
      resolve({
        ...DEV_FALLBACK_COORDS,
        source: "fallback",
      });
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

        resolve({
          ...DEV_FALLBACK_COORDS,
          source: "fallback",
        });
      },
      () => {
        resolve({
          ...DEV_FALLBACK_COORDS,
          source: "fallback",
        });
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menus, setMenus] = useState([]);
  const [locationSource, setLocationSource] = useState("loading");

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
        });

        if (cancelled) return;
        setMenus(extractMenus(response));
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
  }, []);

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
              : locationSource === "fallback"
              ? "Using local fallback location for browse results"
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
                <DisabledSelect label="Cuisine" options={CUISINE_OPTIONS} />
                <DisabledSelect label="Category" options={RESTAURANT_TYPE_OPTIONS} />

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
                    <DisabledChip label="Deals" isMobile={isMobile} />
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
                    <DisabledChip label="Vegan" isMobile={isMobile} />
                    <DisabledChip label="Vegetarian" isMobile={isMobile} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 18,
                  borderTop: "1px solid rgba(18,34,28,0.08)",
                  color: "#5a7064",
                  fontSize: 13,
                  lineHeight: 1.5,
                  fontWeight: 700,
                }}
              >
                Filters are temporarily disabled so all menu data can be inspected.
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
                    Nearby menus returned by the backend
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
