/**
 * ============================================================
 * File: BrowseMenus.jsx
 * Path: menubloc-frontend/src/pages/BrowseMenus.jsx
 * Date: 2026-03-16
 * Purpose:
 *   Browse Menus / Netflix-style browser page.
 *
 *   Search mode priority (explicit beats implicit):
 *   1. If ?city= and ?state= are in the URL → city/state mode.
 *      Geolocation is NOT called. Backend receives city+state params.
 *      Subtitle: "Showing menus near Dothan, AL"
 *   2. Otherwise → browser geolocation mode.
 *      Backend receives lat/lng. Subtitle varies by result.
 *
 *   Fix 2026-03-16:
 *     - Previously, geolocation always ran even when city/state were
 *       in the URL. Geolocation result was non-deterministic (success
 *       → CA coords → 2 results; timeout → null → 5 results).
 *     - city/state params were parsed but never forwarded to the API.
 *     - Fix: city+state in URL → skip geolocation entirely, send
 *       city+state to backend. Backend now accepts these params and
 *       filters deterministically with ILIKE.
 *     - useEffect now depends on urlCity, urlState, and filters so
 *       URL-driven navigation correctly re-fetches.
 * ============================================================
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MenuPreviewCard from "../components/browse/MenuPreviewCard.jsx";
import { PageNav } from "../components/NavButton.jsx";
import { getBrowseMenus, toConsumerErrorMessage } from "../lib/api.js";
import { loadDietPrefs, saveDietPrefs, activePrefLabels, hasActiveDietPrefs } from "../hooks/useDietPreferences";


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
    "We couldn't load nearby menus right now. Please try again in a moment."
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
        background: active ? "#11211a" : "#fff",
        color: active ? "#f7f6f1" : "#667085",
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
          color: "#667085",
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
          background: "#fff",
          padding: "0 14px",
          color: "#667085",
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

  // True when the URL explicitly specifies the location — geolocation must not run.
  // City alone is sufficient; state is optional and used as an additional filter when present.
  const hasCityStateParams = Boolean(urlCity);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menus, setMenus] = useState([]);
  // Seed from URL so a shared/bookmarked link shows the label immediately
  const [locationLabel, setLocationLabel] = useState(() => {
    const parts = [urlCity, urlState].filter(Boolean);
    return parts.join(", ");
  });
  const [filters, setFilters] = useState(() => ({
    cuisine: "",
    category: "",
    deals: false,
    ...loadDietPrefs(),
  }));
  const [alphaGroup, setAlphaGroup] = useState(null);

  const hasDietaryFilter = filters.vegan || filters.vegetarian || filters.gluten_free ||
    filters.dairy_free || filters.diabetic_friendly || filters.keto || filters.low_sodium || filters.deals;

  // Persist diet prefs whenever they change
  useEffect(() => { saveDietPrefs(filters); }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");

      try {
        let apiParams;

        if (hasCityStateParams) {
          // ── Mode 1: explicit city/state from URL ─────────────────
          setLocationLabel([urlCity, urlState].filter(Boolean).join(", "));
          apiParams = {
            city: urlCity,
            state: urlState,
            cuisine: filters.cuisine,
            category: filters.category,
            deals: filters.deals ? 1 : "",
            vegan: filters.vegan ? 1 : "",
            vegetarian: filters.vegetarian ? 1 : "",
            gluten_free: filters.gluten_free ? 1 : "",
            keto: filters.keto ? 1 : "",
            low_sodium: filters.low_sodium ? 1 : "",
            dairy_free: filters.dairy_free ? 1 : "",
            diabetic_friendly: filters.diabetic_friendly ? 1 : "",
          };
        } else {
          // ── Mode 2: browser geolocation ───────────────────────────
          const coords = await getUserCoords();
          if (cancelled) return;
          apiParams = {
            lat: coords.lat,
            lng: coords.lng,
            radius: 6,
            cuisine: filters.cuisine,
            category: filters.category,
            deals: filters.deals ? 1 : "",
            vegan: filters.vegan ? 1 : "",
            vegetarian: filters.vegetarian ? 1 : "",
            gluten_free: filters.gluten_free ? 1 : "",
            keto: filters.keto ? 1 : "",
            low_sodium: filters.low_sodium ? 1 : "",
            dairy_free: filters.dairy_free ? 1 : "",
            diabetic_friendly: filters.diabetic_friendly ? 1 : "",
          };
        }

        // Always show restaurant cards — dietary filters apply within each restaurant's menu
        const response = await getBrowseMenus(apiParams);
        if (cancelled) return;

        const extractedMenus = extractMenus(response);
        const sorted = [...extractedMenus].sort((a, b) => {
          const nameA = (a.restaurant_name || a.name || "").toLowerCase();
          const nameB = (b.restaurant_name || b.name || "").toLowerCase();
          return nameA.localeCompare(nameB);
        });
        setMenus(sorted);

        // In city/state mode the URL is already authoritative.
        // In geo mode, derive city/state from first result and push to URL.
        if (!hasCityStateParams) {
          const first = extractedMenus[0];
          if (first?.city || first?.state) {
            const city = first.city || "";
            const state = first.state || "";
            const label = [city, state].filter(Boolean).join(", ");
            setLocationLabel(label);
            if (city !== urlCity || state !== urlState) {
              const next = new URLSearchParams(search);
              if (city) next.set("city", city); else next.delete("city");
              if (state) next.set("state", state); else next.delete("state");
              navigate("?" + next.toString(), { replace: true });
            }
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
  // Re-run when the URL location or filters change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCity, urlState, filters]);

  const showEmptyState = !loading && !error && menus.length === 0;

  // ── Alpha range computation ────────────────────────────────────
  // Derive the unique first letters present in loaded menus, then
  // split them into 3 equal-ish groups to form range chips.
  const alphaRanges = [
    { label: "A – I", letters: new Set("ABCDEFGHI".split("")) },
    { label: "J – R", letters: new Set("JKLMNOPQR".split("")) },
    { label: "S – Z", letters: new Set("STUVWXYZ".split("")) },
  ];

  const visibleMenus = alphaGroup
    ? menus.filter((m) => {
        const first = (m.restaurant_name || m.name || "").trim()[0]?.toUpperCase();
        return alphaGroup.letters.has(first);
      })
    : menus;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f6f1",
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
          <PageNav />

          <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, color: "#11211a" }}>
            Grubbid
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
                background: "#fff",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#11211a",
                  marginBottom: 14,
                }}
              >
                View By
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {alphaRanges.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        letterSpacing: 0.9,
                        textTransform: "uppercase",
                        color: "#667085",
                      }}
                    >
                      Alphabetically
                    </span>
                    <div style={{ display: "grid", gap: 8 }}>
                      <FilterChip
                        label="All"
                        isMobile={isMobile}
                        active={alphaGroup === null}
                        onClick={() => setAlphaGroup(null)}
                      />
                      {alphaRanges.map((range) => (
                        <FilterChip
                          key={range.label}
                          label={range.label}
                          isMobile={isMobile}
                          active={alphaGroup?.label === range.label}
                          onClick={() => setAlphaGroup(alphaGroup?.label === range.label ? null : range)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
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
                      color: "#667085",
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
                      color: "#667085",
                    }}
                  >
                    Dietary
                  </span>

                  <div style={{ display: "grid", gap: 10 }}>
                    <FilterChip
                      label="Dairy Free"
                      isMobile={isMobile}
                      active={filters.dairy_free}
                      onClick={() => setFilters((prev) => ({ ...prev, dairy_free: !prev.dairy_free }))}
                    />
                    <FilterChip
                      label="Diabetic Friendly"
                      isMobile={isMobile}
                      active={filters.diabetic_friendly}
                      onClick={() => setFilters((prev) => ({ ...prev, diabetic_friendly: !prev.diabetic_friendly }))}
                    />
                    <FilterChip
                      label="Gluten Free"
                      isMobile={isMobile}
                      active={filters.gluten_free}
                      onClick={() => setFilters((prev) => ({ ...prev, gluten_free: !prev.gluten_free }))}
                    />
                    <FilterChip
                      label="Keto"
                      isMobile={isMobile}
                      active={filters.keto}
                      onClick={() => setFilters((prev) => ({ ...prev, keto: !prev.keto }))}
                    />
                    <FilterChip
                      label="Low Sodium"
                      isMobile={isMobile}
                      active={filters.low_sodium}
                      onClick={() => setFilters((prev) => ({ ...prev, low_sodium: !prev.low_sodium }))}
                    />
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
                      onClick={() => setFilters((prev) => ({ ...prev, vegetarian: !prev.vegetarian }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main style={{ flex: "1 1 auto", minWidth: 0, width: "100%" }}>
            <h1
              style={{
                margin: isMobile ? "0 0 14px" : "0 0 18px",
                fontSize: isMobile ? 24 : 28,
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: -0.5,
                color: "#11211a",
              }}
            >
              {locationLabel ? `Browsing Menus Near ${locationLabel}` : "Browsing Menus"}
            </h1>
            <div
              style={{
                borderRadius: 24,
                padding: isMobile ? "14px 14px 18px" : "18px 18px 22px",
                background: "#fff",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
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
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#667085",
                    whiteSpace: "nowrap",
                  }}
                >
                  {`${visibleMenus.length} ${visibleMenus.length === 1 ? "menu" : "menus"}`}
                </div>
              </div>

              {/* Active dietary filter notice */}
              {hasActiveDietPrefs(filters) && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#166534",
                  marginBottom: 6,
                }}>
                  <span style={{ fontWeight: 800 }}>Dietary filters active:</span>
                  {activePrefLabels(filters).map((l) => (
                    <span key={l} style={{
                      padding: "1px 8px",
                      borderRadius: 999,
                      background: "#dcfce7",
                      border: "1px solid #bbf7d0",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#15803d",
                    }}>{l}</span>
                  ))}
                  <span style={{ color: "#475467", fontWeight: 500, fontSize: 11 }}>
                    — will filter items inside each restaurant's menu
                  </span>
                </div>
              )}

              {loading ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 14,
                    padding: "2px 4px 6px",
                  }}
                >
                  {[0, 1, 2, 3, 4, 5].map((card) => (
                    <div
                      key={card}
                      style={{ height: 148, borderRadius: 16, background: "rgba(0,0,0,0.06)" }}
                    />
                  ))}
                </div>
              ) : null}

              {(error || showEmptyState) ? (
                <section
                  style={{
                    padding: isMobile ? "28px 16px" : "44px 24px",
                    borderRadius: 24,
                    background: "#f7f6f1",
                    textAlign: "center",
                    color: "#667085",
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
                    No local menus available in this area
                  </div>

                  <div
                    style={{
                      fontSize: isMobile ? 14 : 15,
                      maxWidth: 520,
                      margin: "0 auto",
                      lineHeight: 1.45,
                    }}
                  >
                    We are constantly adding menus. Please check back soon.
                  </div>
                </section>
              ) : null}

              {/* ── Restaurant card view ── */}
              {!loading && !error && menus.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 14,
                    padding: "2px 4px 8px",
                  }}
                >
                  {visibleMenus.map((menu, index) => (
                    <MenuPreviewCard
                      key={String(menu?.menu_id ?? menu?.restaurant_id ?? index)}
                      menu={menu}
                      index={index}
                      isMobile={isMobile}
                      hideItemCount={hasDietaryFilter}
                    />
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
