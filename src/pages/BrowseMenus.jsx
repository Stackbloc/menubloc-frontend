import React, { useEffect, useMemo, useState } from "react";
import MenuPreviewCard from "../components/browse/MenuPreviewCard.jsx";
import { HomeButton } from "../components/NavButton.jsx";
import { getBrowseMenus } from "../lib/api.js";

const FIXED_RADIUS_MILES = 10;
const TEST_LOCATION = {
  label: "Dothan, Alabama",
  lat: 31.2232,
  lng: -85.3905,
};

function uniqueStrings(values) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function readErrorMessage(error) {
  return String(error?.message || error || "Unable to load menus.");
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 40,
        padding: "0 16px",
        borderRadius: 999,
        border: active ? "1px solid rgba(18,34,28,0.9)" : "1px solid rgba(18,34,28,0.12)",
        background: active ? "#11211a" : "rgba(255,255,255,0.84)",
        color: active ? "#f8f4ea" : "#11211a",
        fontSize: 13,
        fontWeight: 800,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {label}
    </button>
  );
}

function SelectFilter({ label, value, options, onChange }) {
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
        onChange={(event) => onChange(event.target.value)}
        style={{
          height: 44,
          borderRadius: 14,
          border: "1px solid rgba(18,34,28,0.10)",
          background: "rgba(255,255,255,0.84)",
          padding: "0 14px",
          color: "#11211a",
          fontSize: 14,
          fontWeight: 700,
          outline: "none",
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

function extractMenus(response) {
  if (Array.isArray(response?.menus)) return response.menus;
  const firstRow = Array.isArray(response?.rows) ? response.rows[0] : null;
  return Array.isArray(firstRow?.menus) ? firstRow.menus : [];
}

export default function BrowseMenus() {
  const [geoState] = useState({
    status: "ready",
    lat: TEST_LOCATION.lat,
    lng: TEST_LOCATION.lng,
    message: "Browsing is pinned to Dothan, Alabama for testing.",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [menus, setMenus] = useState([]);
  // Unfiltered result — used only to populate cuisine/category options so they don't collapse when a filter is active.
  // TODO: remove TEST_LOCATION and this pin once real geo is wired.
  const [baseMenus, setBaseMenus] = useState([]);
  const [filters, setFilters] = useState({
    cuisine: "",
    category: "",
    vegan: false,
    vegetarian: false,
    deals: false,
  });

  // One-time unfiltered fetch to seed filter option lists.
  useEffect(() => {
    if (geoState.status !== "ready" || geoState.lat == null || geoState.lng == null) return;
    getBrowseMenus({ lat: geoState.lat, lng: geoState.lng, radius: FIXED_RADIUS_MILES })
      .then((response) => setBaseMenus(extractMenus(response)))
      .catch(() => {});
  }, [geoState.status, geoState.lat, geoState.lng]);

  // Filtered fetch — re-runs whenever filters change.
  useEffect(() => {
    if (geoState.status !== "ready" || geoState.lat == null || geoState.lng == null) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getBrowseMenus({
      lat: geoState.lat,
      lng: geoState.lng,
      radius: FIXED_RADIUS_MILES,
      cuisine: filters.cuisine,
      category: filters.category,
      vegan: filters.vegan ? 1 : "",
      vegetarian: filters.vegetarian ? 1 : "",
      deals: filters.deals ? 1 : "",
    })
      .then((response) => {
        if (!cancelled) setMenus(extractMenus(response));
      })
      .catch((fetchError) => {
        if (!cancelled) setError(readErrorMessage(fetchError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [geoState.status, geoState.lat, geoState.lng, filters]);

  // Options always derived from the unfiltered base so they never collapse when a filter is active.
  const cuisineOptions = useMemo(() => uniqueStrings(baseMenus.map((menu) => menu.cuisine)), [baseMenus]);
  const categoryOptions = useMemo(() => uniqueStrings(baseMenus.map((menu) => menu.category)), [baseMenus]);
  const showEmptyState = !loading && !error && menus.length === 0 && baseMenus.length > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#11211a",
      }}
    >
      <div style={{ maxWidth: 1450, margin: "0 auto", padding: "28px 20px 56px" }}>
        <div style={{ marginBottom: 26 }}>
          <div style={{ marginBottom: 14 }}>
            <HomeButton />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#11211a" }}>
            Grubbid
          </div>
          <h1 style={{ margin: "6px 0 4px", fontSize: 28, lineHeight: 1.1, fontWeight: 800, letterSpacing: -0.5 }}>
            Browse Menus Near You
          </h1>
          <div style={{ fontSize: 14, color: "#5a7064", fontWeight: 600 }}>
            Within 10 Miles of {TEST_LOCATION.label}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 24 }}>
          <aside
            style={{
              flex: "0 0 260px",
              width: 260,
              position: "sticky",
              top: 18,
              alignSelf: "flex-start",
            }}
          >
            <div
              style={{
                borderRadius: 24,
                padding: 18,
                background: "rgba(255,255,255,0.68)",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 18px 40px rgba(30,41,59,0.08)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", color: "#5a7064", marginBottom: 14 }}>
                Filters
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <SelectFilter
                  label="Cuisine"
                  value={filters.cuisine}
                  options={cuisineOptions}
                  onChange={(value) => setFilters((current) => ({ ...current, cuisine: value }))}
                />

                <SelectFilter
                  label="Category"
                  value={filters.category}
                  options={categoryOptions}
                  onChange={(value) => setFilters((current) => ({ ...current, category: value }))}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", color: "#5a7064" }}>
                    Category
                  </span>
                  <div style={{ display: "grid", gap: 10 }}>
                    <FilterChip
                      label="Deals"
                      active={filters.deals}
                      onClick={() => setFilters((current) => ({ ...current, deals: !current.deals }))}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", color: "#5a7064" }}>
                    Dietary
                  </span>
                  <div style={{ display: "grid", gap: 10 }}>
                    <FilterChip
                      label="Vegan"
                      active={filters.vegan}
                      onClick={() => setFilters((current) => ({ ...current, vegan: !current.vegan }))}
                    />
                    <FilterChip
                      label="Vegetarian"
                      active={filters.vegetarian}
                      onClick={() => setFilters((current) => ({ ...current, vegetarian: !current.vegetarian }))}
                    />
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
                {geoState.message}
              </div>
            </div>
          </aside>

          <main style={{ flex: "1 1 780px", minWidth: 0 }}>
            <div
              style={{
                borderRadius: 28,
                padding: "18px 18px 22px",
                background: "rgba(255,255,255,0.50)",
                border: "1px solid rgba(18,34,28,0.08)",
                boxShadow: "0 18px 40px rgba(30,41,59,0.07)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "4px 4px 18px",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.9, textTransform: "uppercase", color: "#5a7064" }}>
                    Menus Nearby
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#11211a", marginTop: 4 }}>
                    Real menus nearby, ready to browse
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 800, color: "#5a7064", whiteSpace: "nowrap" }}>
                  {menus.length} menus
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                  {[0, 1, 2, 3, 4, 5].map((card) => (
                    <div
                      key={card}
                      style={{
                        width: 240,
                        height: 112,
                        borderRadius: 14,
                        background: "rgba(0,0,0,0.06)",
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
                  }}
                >
                  {error}
                </div>
              ) : null}

              {showEmptyState ? (
                <section
                  style={{
                    padding: "44px 24px",
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.64)",
                    textAlign: "center",
                    color: "#5a7064",
                  }}
                >
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#11211a", marginBottom: 10 }}>
                    No menus matched this view
                  </div>
                  <div style={{ fontSize: 15, maxWidth: 520, margin: "0 auto" }}>
                    Try clearing a filter. The browse surface stays pinned to {TEST_LOCATION.label} for testing.
                  </div>
                </section>
              ) : null}

              {!loading && !error && menus.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                  {menus.map((menu, index) => (
                    <MenuPreviewCard key={
                      String(menu?.restaurant_id ?? index)
                    } menu={menu} index={index} />
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
