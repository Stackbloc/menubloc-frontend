/**
 * Food-aware conversation entity picker for Dining Crews.
 * Shares canonical Menuply restaurant / menu / menu item objects.
 */

import React, { useEffect, useState } from "react";
import { searchDiningCrewEntities } from "../../lib/consumerApi.js";

const TYPE_OPTIONS = [
  { value: "text", label: "Text only" },
  { value: "restaurant", label: "Restaurant" },
  { value: "menu", label: "Menu" },
  { value: "menu_item", label: "Menu item" },
];

export default function DiningCrewFoodEntityPicker({
  messageType,
  onMessageTypeChange,
  selected,
  onSelectedChange,
  note,
  onNoteChange,
  disabled = false,
  hideNote = false,
  forceRestaurantOnly = false,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [anchorRestaurant, setAnchorRestaurant] = useState(null);

  useEffect(() => {
    if (messageType === "text") {
      setResults([]);
      setQuery("");
      setError("");
      return;
    }

    if (messageType === "menu" && !anchorRestaurant?.restaurant_id && !selected?.restaurant_id) {
      setResults([]);
      return;
    }

    const q = query.trim();
    if (messageType !== "menu" && q.length < 2) {
      setResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const restaurantId =
          selected?.restaurant_id ||
          anchorRestaurant?.restaurant_id ||
          null;
        const data = await searchDiningCrewEntities({
          type: messageType,
          q: messageType === "menu" ? q : q,
          restaurant_id: messageType === "menu" || messageType === "menu_item" ? restaurantId : null,
        });
        setResults(data.results || []);
      } catch (err) {
        setError(err.message || "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [messageType, query, selected?.restaurant_id, anchorRestaurant?.restaurant_id]);

  function pick(result) {
    onSelectedChange(result);
    if (result.type === "restaurant") {
      setAnchorRestaurant(result);
    }
    setQuery("");
    setResults([]);
  }

  function clearSelection() {
    onSelectedChange(null);
    if (messageType === "menu") {
      // keep restaurant anchor so menu search still works
    } else if (messageType === "restaurant") {
      setAnchorRestaurant(null);
    }
  }

  return (
    <div style={styles.wrap}>
      {!forceRestaurantOnly ? (
        <div style={styles.typeRow}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => {
                onMessageTypeChange(opt.value);
                onSelectedChange(null);
                setQuery("");
                setResults([]);
                setError("");
                if (opt.value === "text" || opt.value === "restaurant") {
                  setAnchorRestaurant(null);
                }
              }}
              style={messageType === opt.value ? styles.typeActive : styles.typeBtn}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : (
        <p style={styles.hint}>Search for a restaurant for this crew outing.</p>
      )}

      {messageType === "menu" && !anchorRestaurant && !selected ? (
        <p style={styles.hint}>
          First search and select a restaurant, then choose a menu. Or switch to Restaurant
          and share the place itself.
        </p>
      ) : null}

      {messageType === "menu" && !anchorRestaurant ? (
        <div style={{ marginBottom: 8 }}>
          <input
            style={styles.input}
            value={query}
            disabled={disabled}
            onChange={async (e) => {
              const value = e.target.value;
              setQuery(value);
              // temporarily search restaurants to set anchor
              if (value.trim().length < 2) {
                setResults([]);
                return;
              }
              setLoading(true);
              try {
                const data = await searchDiningCrewEntities({
                  type: "restaurant",
                  q: value.trim(),
                });
                setResults(
                  (data.results || []).map((r) => ({ ...r, _anchorPick: true }))
                );
              } catch (err) {
                setError(err.message || "Search failed");
              } finally {
                setLoading(false);
              }
            }}
            placeholder="Find restaurant for menu…"
          />
        </div>
      ) : null}

      {messageType !== "text" && !(messageType === "menu" && !anchorRestaurant) ? (
        <input
          style={styles.input}
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            messageType === "restaurant"
              ? "Search restaurants…"
              : messageType === "menu"
                ? `Menus at ${anchorRestaurant?.restaurant_name || "restaurant"}…`
                : "Search dishes…"
          }
        />
      ) : null}

      {messageType === "menu" && anchorRestaurant && !selected ? (
        <p style={styles.hint}>
          Restaurant: <strong>{anchorRestaurant.restaurant_name}</strong>{" "}
          <button
            type="button"
            style={styles.linkBtn}
            onClick={() => {
              setAnchorRestaurant(null);
              setResults([]);
              setQuery("");
            }}
          >
            Change
          </button>
        </p>
      ) : null}

      {loading ? <p style={styles.hint}>Searching…</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}

      {results.length > 0 ? (
        <ul style={styles.results}>
          {results.map((r) => {
            const key =
              r.menu_item_id ||
              r.menu_id ||
              r.restaurant_id ||
              `${r.label}-${r.subtitle}`;
            return (
              <li key={key}>
                <button
                  type="button"
                  style={styles.resultBtn}
                  onClick={() => {
                    if (r._anchorPick || (messageType === "menu" && r.type === "restaurant")) {
                      setAnchorRestaurant(r);
                      setQuery("");
                      setResults([]);
                      return;
                    }
                    pick(r);
                  }}
                >
                  <strong>{r.label}</strong>
                  {r.subtitle ? <span style={styles.subtitle}>{r.subtitle}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected ? (
        <div style={styles.selected}>
          <div>
            <div style={styles.selectedLabel}>Sharing</div>
            <strong>{selected.label || selected.item_name || selected.menu_name || selected.restaurant_name}</strong>
            {selected.subtitle || selected.restaurant_name ? (
              <div style={styles.subtitle}>{selected.subtitle || selected.restaurant_name}</div>
            ) : null}
          </div>
          <button type="button" style={styles.linkBtn} onClick={clearSelection}>
            Clear
          </button>
        </div>
      ) : null}

      {!hideNote ? (
        <input
          style={{ ...styles.input, marginTop: 8 }}
          value={note}
          disabled={disabled}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={messageType === "text" ? "Message…" : "Optional note"}
        />
      ) : null}
    </div>
  );
}

const styles = {
  wrap: { display: "grid", gap: 8 },
  typeRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  typeBtn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    color: "#334155",
  },
  typeActive: {
    border: "1px solid #15803d",
    background: "#dcfce7",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    color: "#14532d",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
  },
  hint: { margin: 0, fontSize: 12, color: "#64748b" },
  error: { margin: 0, fontSize: 12, color: "#b91c1c", fontWeight: 700 },
  results: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    background: "#fff",
    maxHeight: 220,
    overflowY: "auto",
  },
  resultBtn: {
    width: "100%",
    textAlign: "left",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff",
    padding: "10px 12px",
    cursor: "pointer",
    display: "grid",
    gap: 2,
  },
  subtitle: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  selected: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "10px 12px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 10,
  },
  selectedLabel: { fontSize: 11, color: "#166534", fontWeight: 700, textTransform: "uppercase" },
  linkBtn: {
    border: "none",
    background: "transparent",
    color: "#0f766e",
    fontWeight: 700,
    cursor: "pointer",
    padding: 0,
  },
};
