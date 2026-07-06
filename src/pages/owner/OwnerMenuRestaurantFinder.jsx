import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import { searchMenuConsoleRestaurants } from "../../lib/ownerApi.js";

const RECENT_KEY = "owner_menu_manager_recent_restaurants";
const SEARCH_LIMIT = 12;

function loadRecentRestaurants() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

export function saveRecentRestaurant(restaurant) {
  if (!restaurant?.id) return;
  const entry = {
    id: restaurant.id,
    name: restaurant.name || restaurant.restaurant_name,
    city: restaurant.city,
    state: restaurant.state,
    menu_count: restaurant.menu_count,
    item_count: restaurant.item_count,
  };
  const next = [entry, ...loadRecentRestaurants().filter((r) => r.id !== entry.id)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function ResultRow({ restaurant, onSelect }) {
  const name = restaurant.name || restaurant.restaurant_name || "Restaurant";
  return (
    <button
      type="button"
      onClick={() => onSelect(restaurant)}
      style={{
        display: "block",
        width: "100%",
        padding: "12px 14px",
        border: `1px solid ${OWNER_COLORS.line}`,
        borderRadius: 10,
        background: "#fff",
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, color: OWNER_COLORS.ink }}>{name}</div>
      <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
        #{restaurant.id}
        {restaurant.city || restaurant.state ? ` · ${[restaurant.city, restaurant.state].filter(Boolean).join(", ")}` : ""}
        {restaurant.menu_count != null ? ` · ${restaurant.menu_count} menu${restaurant.menu_count === 1 ? "" : "s"}` : ""}
        {restaurant.item_count != null ? ` · ${restaurant.item_count} items` : ""}
      </div>
    </button>
  );
}

export default function OwnerMenuRestaurantFinder({
  selectedRestaurant,
  loading,
  onSelect,
  onClear,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [recent, setRecent] = useState(loadRecentRestaurants);
  const searchTimeout = useRef(null);

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  function runSearch(q) {
    const trimmed = String(q || "").trim();
    if (trimmed.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    setSearchErr("");
    searchMenuConsoleRestaurants({ q: trimmed, page: 1, limit: SEARCH_LIMIT, filter: "all" })
      .then((data) => setResults(data.restaurants || []))
      .catch(() => setSearchErr("Search unavailable. Please try again."))
      .finally(() => setSearching(false));
  }

  function handleQueryChange(e) {
    const next = e.target.value;
    setQuery(next);
    clearTimeout(searchTimeout.current);
    if (!next.trim()) {
      setResults(null);
      return;
    }
    searchTimeout.current = setTimeout(() => runSearch(next), 300);
  }

  function handleSelect(restaurant) {
    saveRecentRestaurant(restaurant);
    setRecent(loadRecentRestaurants());
    setQuery("");
    setResults(null);
    setSearchErr("");
    onSelect?.(restaurant);
  }

  function handleClear() {
    setQuery("");
    setResults(null);
    setSearchErr("");
    onClear?.();
  }

  const selectedName = selectedRestaurant?.restaurant_name || selectedRestaurant?.name;

  return (
    <PageCard style={{ padding: 20, marginBottom: 16 }}>
      <SectionTitle
        title="Find Restaurant"
        subtitle="Search by name, city, state, or restaurant ID. Selecting a restaurant loads it into the workspace below."
        action={(
          <Link
            to="/owner/restaurants"
            style={{ fontSize: 12, fontWeight: 700, color: OWNER_COLORS.accent, textDecoration: "none" }}
          >
            Advanced search →
          </Link>
        )}
      />

      {selectedRestaurant ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", padding: "12px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>{selectedName}</div>
            <div style={{ fontSize: 12, color: OWNER_COLORS.muted, marginTop: 4 }}>
              #{selectedRestaurant.id}
              {selectedRestaurant.city || selectedRestaurant.state
                ? ` · ${[selectedRestaurant.city, selectedRestaurant.state].filter(Boolean).join(", ")}`
                : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${OWNER_COLORS.line}`,
              background: "#fff",
              fontWeight: 600,
              fontSize: 12,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Change restaurant
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Restaurant name, city, state, or ID…"
            autoComplete="off"
            spellCheck={false}
            style={{ ...inputStyle, marginTop: 4 }}
          />
          {searching ? <div style={{ marginTop: 10, fontSize: 12, color: OWNER_COLORS.muted }}>Searching…</div> : null}
          {searchErr ? <div style={{ marginTop: 10, fontSize: 12, color: "#991b1b" }}>{searchErr}</div> : null}
          {Array.isArray(results) && results.length > 0 ? (
            <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {results.map((row) => (
                <ResultRow key={row.id} restaurant={row} onSelect={handleSelect} />
              ))}
            </div>
          ) : null}
          {Array.isArray(results) && results.length === 0 && query.trim().length >= 2 && !searching ? (
            <div style={{ marginTop: 12, fontSize: 13, color: OWNER_COLORS.muted }}>No restaurants matched.</div>
          ) : null}
          {!results && recent.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: OWNER_COLORS.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Recent
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {recent.map((row) => (
                  <ResultRow key={row.id} restaurant={row} onSelect={handleSelect} />
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </PageCard>
  );
}
