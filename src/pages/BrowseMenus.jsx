/**
 * ============================================================
 * File: BrowseMenus.jsx
 * Path: menubloc-frontend/src/pages/BrowseMenus.jsx
 * Date: 2026-03-25
 * Purpose:
 *   Browse Menus / Netflix-style browser page.
 *
 *   Search mode priority (explicit beats implicit):
 *   1. If ?city= and ?state= are in the URL → city/state mode.
 *      Geolocation is NOT called. Backend receives city+state params.
 *      Subtitle: "Showing menus near Dothan, AL"
 *      Distance filter is hidden — no lat/lng to compute from.
 *   2. Otherwise → browser geolocation mode.
 *      Backend receives lat/lng + radius. Results sorted nearest-first.
 *      Distance filter is visible; user can change radius.
 *
 *   Fix 2026-03-16:
 *     city+state in URL → skip geolocation, send city+state to backend.
 *
 *   Fix 2026-03-25 (Distance filter):
 *     Added Distance filter UI to sidebar (geo mode only). User can
 *     select a radius: 1, 3, 5, 10, 25 miles. Default 10 miles.
 *     radiusMiles state is added to useEffect dependency array so a
 *     change triggers a re-fetch. In city/state mode the distance
 *     section is hidden because the backend has no user coordinates to
 *     compute from.
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

// Distance radius options. "Any Distance" (null) = no radius cap.
// In city/state mode, selecting a specific radius triggers geolocation so the
// backend can apply a haversine WHERE clause from the user's actual position.
// Backend clamps radius to 4000 miles maximum via clampBrowseRadiusMiles().
const DISTANCE_RADIUS_OPTIONS = [
  { label: "Any Distance",    value: null },
  { label: "Within 1 mile",   value: 1    },
  { label: "Within 3 miles",  value: 3    },
  { label: "Within 5 miles",  value: 5    },
  { label: "Within 10 miles", value: 10   },
  { label: "Within 25 miles", value: 25   },
];

const RESTAURANT_TYPE_OPTIONS = [
  "Bar / Pub",
  "Buffet",
  "Cafe",
  "Casual Dining",
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
    deals: false,
    ...loadDietPrefs(),
  }));
  // localFilters are applied client-side to the already-fetched restaurant list.
  // Changing them does NOT trigger a re-fetch — filtering is instant.
  const [localFilters, setLocalFilters] = useState({ cuisine: "", category: "" });
  // radiusMiles: null = any distance (no radius cap).
  // In geo mode default to 10 miles. In city/state mode default to null (any).
  // When a non-null radius is selected in city/state mode, geolocation is requested
  // so the backend can filter by actual distance from the user's position.
  const [radiusMiles, setRadiusMiles] = useState(() => hasCityStateParams ? null : 10);
  const [alphaGroup, setAlphaGroup] = useState(null);

  const hasDietaryFilter = filters.vegan || filters.vegetarian || filters.gluten_free ||
    filters.dairy_free || filters.diabetic_friendly || filters.keto || filters.low_sodium || filters.deals;

  const activeFilterLabel = (() => {
    if (filters.vegan) return "vegan";
    if (filters.vegetarian) return "vegetarian";
    if (filters.diabetic_friendly) return "diabetic-friendly";
    if (filters.dairy_free) return "dairy-free";
    if (filters.gluten_free) return "gluten-free";
    if (filters.keto) return "keto";
    if (filters.low_sodium) return "low-sodium";
    if (filters.deals) return "deal";
    return null;
  })();

  const activeFilterParams = (() => {
    const p = new URLSearchParams();
    if (filters.vegan)             p.set("vegan", "1");
    if (filters.vegetarian)        p.set("vegetarian", "1");
    if (filters.gluten_free)       p.set("gluten_free", "1");
    if (filters.dairy_free)        p.set("dairy_free", "1");
    if (filters.diabetic_friendly) p.set("diabetic_friendly", "1");
    if (filters.keto)              p.set("keto", "1");
    if (filters.low_sodium)        p.set("low_sodium", "1");
    if (filters.deals)             p.set("deals", "1");
    return p.toString();
  })();

  // Persist diet prefs whenever they change
  useEffect(() => { saveDietPrefs(filters); }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");

      try {
        let apiParams;

        const dietaryParams = {
          deals: filters.deals ? 1 : "",
          vegan: filters.vegan ? 1 : "",
          vegetarian: filters.vegetarian ? 1 : "",
          gluten_free: filters.gluten_free ? 1 : "",
          keto: filters.keto ? 1 : "",
          low_sodium: filters.low_sodium ? 1 : "",
          dairy_free: filters.dairy_free ? 1 : "",
          diabetic_friendly: filters.diabetic_friendly ? 1 : "",
        };

        if (hasCityStateParams) {
          // ── Mode 1: explicit city/state from URL ─────────────────
          // Always get geolocation so the backend can compute distance_miles
          // for display on each card. If a radius was selected, also send it
          // so the backend adds a haversine WHERE clause.
          setLocationLabel([urlCity, urlState].filter(Boolean).join(", "));
          const coords = await getUserCoords();
          if (cancelled) return;
          const hasCoords = coords.lat !== null && coords.lng !== null;
          apiParams = {
            city: urlCity,
            state: urlState,
            ...(hasCoords ? { lat: coords.lat, lng: coords.lng } : {}),
            ...(hasCoords && radiusMiles !== null ? { radius: radiusMiles } : {}),
            ...dietaryParams,
          };
        } else {
          // ── Mode 2: browser geolocation ───────────────────────────
          const coords = await getUserCoords();
          if (cancelled) return;
          apiParams = {
            lat: coords.lat,
            lng: coords.lng,
            // Only send radius when user has selected a specific limit.
            // null = any distance; omit so backend skips haversine WHERE clause.
            ...(radiusMiles !== null ? { radius: radiusMiles } : {}),
            ...dietaryParams,
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
  // Re-run when the URL location, filters, or radius changes.
  // radiusMiles only affects geo mode — city/state mode ignores it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCity, urlState, filters, radiusMiles]);

  const showEmptyState = !loading && !error && menus.length === 0;

  // ── Alpha range computation ────────────────────────────────────
  // Derive the unique first letters present in loaded menus, then
  // split them into 3 equal-ish groups to form range chips.
  const alphaRanges = [
    { label: "A – I", letters: new Set("ABCDEFGHI".split("")) },
    { label: "J – R", letters: new Set("JKLMNOPQR".split("")) },
    { label: "S – Z", letters: new Set("STUVWXYZ".split("")) },
  ];

  const visibleMenus = menus.filter((m) => {
    if (alphaGroup) {
      const first = (m.restaurant_name || m.name || "").trim()[0]?.toUpperCase();
      if (!alphaGroup.letters.has(first)) return false;
    }
    if (localFilters.cuisine) {
      if ((m.cuisine || "").toLowerCase() !== localFilters.cuisine.toLowerCase()) return false;
    }
    if (localFilters.category) {
      if ((m.category || "").toLowerCase() !== localFilters.category.toLowerCase()) return false;
    }
    return true;
  });

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
        <PageNav />

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
                  value={localFilters.cuisine}
                  onChange={(value) => setLocalFilters((prev) => ({ ...prev, cuisine: value }))}
                />
                <FilterSelect
                  label="Category"
                  options={RESTAURANT_TYPE_OPTIONS}
                  value={localFilters.category}
                  onChange={(value) => setLocalFilters((prev) => ({ ...prev, category: value }))}
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
                    Distance
                  </span>
                  <div style={{ display: "grid", gap: 8 }}>
                    {DISTANCE_RADIUS_OPTIONS.map((opt) => (
                      <FilterChip
                        key={String(opt.value)}
                        label={opt.label}
                        isMobile={isMobile}
                        active={radiusMiles === opt.value}
                        onClick={() => setRadiusMiles(opt.value)}
                      />
                    ))}
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
                      activeFilterLabel={activeFilterLabel}
                      activeFilterParams={activeFilterParams}
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
