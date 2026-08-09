import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { OWNER_COLORS, PageCard, SectionTitle } from "./OwnerLayout.jsx";
import OwnerRestaurantContextBar from "./OwnerRestaurantContextBar.jsx";
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

function formatLocationLine(restaurant) {
  const cityState = [restaurant.city, restaurant.state].filter(Boolean).join(", ");
  const zip = String(restaurant.postal_code || "").trim();
  if (cityState && zip) return `${cityState} ${zip}`;
  return cityState || zip || "";
}

export function saveRecentRestaurant(restaurant) {
  if (!restaurant?.id) return;
  const entry = {
    id: restaurant.id,
    name: restaurant.name || restaurant.restaurant_name,
    city: restaurant.city,
    state: restaurant.state,
    address_line1: restaurant.address_line1 || restaurant.address || "",
    postal_code: restaurant.postal_code || "",
    menu_count: restaurant.menu_count,
    item_count: restaurant.item_count,
  };
  const next = [entry, ...loadRecentRestaurants().filter((r) => r.id !== entry.id)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function ResultRow({ restaurant, onSelect }) {
  const name = restaurant.name || restaurant.restaurant_name || "Restaurant";
  const street = String(restaurant.address_line1 || restaurant.address || "").trim();
  const location = formatLocationLine(restaurant);
  const metaParts = [];
  metaParts.push(street || "No address on file");
  if (location) metaParts.push(location);
  metaParts.push(`#${restaurant.id}`);
  if (restaurant.menu_count != null) {
    metaParts.push(`${restaurant.menu_count} menu${restaurant.menu_count === 1 ? "" : "s"}`);
  }
  if (restaurant.item_count != null) {
    metaParts.push(`${restaurant.item_count} item${restaurant.item_count === 1 ? "" : "s"}`);
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(restaurant)}
      data-testid="owner-menu-restaurant-result"
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
      <div
        style={{
          fontSize: 12,
          color: street ? OWNER_COLORS.muted : "#b45309",
          marginTop: 4,
          fontWeight: street ? 400 : 600,
        }}
      >
        {metaParts.join(" · ")}
      </div>
    </button>
  );
}

export default function OwnerMenuRestaurantFinder({
  selectedRestaurant,
  loading,
  onSelect,
  onClear,
  onRequestAddRestaurant,
  title = "Find Restaurant",
  subtitle = "Search by name, address, city, state, or restaurant ID. Select a restaurant to load it for profile/address edits, menus, and Update OCR.",
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [recent, setRecent] = useState(loadRecentRestaurants);
  const searchTimeout = useRef(null);
  const searchSeqRef = useRef(0);

  useEffect(() => () => clearTimeout(searchTimeout.current), []);

  function runSearch(q) {
    const trimmed = String(q || "").trim();
    if (trimmed.length < 2) {
      searchSeqRef.current += 1;
      setResults(null);
      setSearching(false);
      return;
    }
    const seq = ++searchSeqRef.current;
    setSearching(true);
    setSearchErr("");
    searchMenuConsoleRestaurants({
      q: trimmed,
      page: 1,
      limit: SEARCH_LIMIT,
      filter: "all",
      scope: "restaurant",
    })
      .then((data) => {
        if (seq !== searchSeqRef.current) return;
        setResults(data.restaurants || []);
      })
      .catch(() => {
        if (seq !== searchSeqRef.current) return;
        setSearchErr("Search unavailable. Please try again.");
      })
      .finally(() => {
        if (seq === searchSeqRef.current) setSearching(false);
      });
  }

  function handleQueryChange(e) {
    const next = e.target.value;
    setQuery(next);
    clearTimeout(searchTimeout.current);
    if (!next.trim()) {
      searchSeqRef.current += 1;
      setResults(null);
      setSearching(false);
      return;
    }
    searchTimeout.current = setTimeout(() => runSearch(next), 350);
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
    searchSeqRef.current += 1;
    setQuery("");
    setResults(null);
    setSearchErr("");
    setSearching(false);
    onClear?.();
  }

  const selectedAddress =
    selectedRestaurant?.address_line1 ||
    selectedRestaurant?.address ||
    "";

  return (
    <PageCard style={{ padding: 20, marginBottom: 16 }}>
      <SectionTitle
        title={title}
        subtitle={subtitle}
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
        <OwnerRestaurantContextBar
          name={selectedRestaurant.restaurant_name || selectedRestaurant.name}
          id={selectedRestaurant.id}
          city={selectedRestaurant.city}
          state={selectedRestaurant.state}
          addressLine1={selectedAddress}
          postalCode={selectedRestaurant.postal_code || ""}
        >
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
        </OwnerRestaurantContextBar>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={handleQueryChange}
            placeholder="Restaurant name, address, city, state, or ID…"
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
            <div
              data-testid="owner-finder-empty-results"
              style={{
                marginTop: 14,
                padding: "14px 16px",
                borderRadius: 10,
                background: "#fffbeb",
                border: "1px solid #fde68a",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                No restaurants matched
              </div>
              <div style={{ fontSize: 13, color: OWNER_COLORS.ink, lineHeight: 1.45, marginBottom: 12 }}>
                Try another spelling, or add a new restaurant profile to continue.
              </div>
              {typeof onRequestAddRestaurant === "function" ? (
                <button
                  type="button"
                  data-testid="owner-finder-add-restaurant"
                  onClick={() => onRequestAddRestaurant({ query: query.trim() })}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 9,
                    border: "none",
                    background: OWNER_COLORS.accent,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Add restaurant
                </button>
              ) : null}
            </div>
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
          {typeof onRequestAddRestaurant === "function" && !(Array.isArray(results) && results.length === 0 && query.trim().length >= 2) ? (
            <div style={{ marginTop: 14, fontSize: 13, color: OWNER_COLORS.muted }}>
              Can&apos;t find it?{" "}
              <button
                type="button"
                data-testid="owner-finder-add-restaurant-link"
                onClick={() => onRequestAddRestaurant({ query: query.trim() })}
                style={{
                  border: "none",
                  background: "none",
                  padding: 0,
                  fontWeight: 700,
                  fontSize: 13,
                  color: OWNER_COLORS.accent,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Add restaurant
              </button>
            </div>
          ) : null}
        </>
      )}
    </PageCard>
  );
}
