/**
 * I'm Eating composer — pick restaurant + CK menu item, share food activity.
 * Reuses Dining Crew entity-search (scoped lookup), not public dish search.
 */

import React, { useEffect, useState } from "react";
import { searchReportPlaces, restaurantLabel, dishLabel, asRestaurantPlace, asDishPlace } from "../../lib/foodActivityApi.js";
import * as cs from "./foodActivityComposeStyles.js";

function isDiningHallRestaurant(restaurant) {
  const type = String(restaurant?.restaurant_type || restaurant?.entity_type || "")
    .trim()
    .toLowerCase();
  return type === "dining_hall" || type === "dininghall";
}

export default function ImEatingComposer({
  restaurant,
  menuItem,
  onRestaurantChange,
  onMenuItemChange,
  comment,
  onCommentChange,
  visibility,
  onVisibilityChange,
  disabled = false,
  isAuthenticated = false,
  lockRestaurant = false,
  skipMenuItem = false,
}) {
  const [step, setStep] = useState(
    restaurant && !(skipMenuItem || isDiningHallRestaurant(restaurant)) ? "item" : "restaurant"
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const placeOnly = skipMenuItem || isDiningHallRestaurant(restaurant);
  const showPlaceSearch = !restaurant;
  const showItemSearch = Boolean(restaurant) && !menuItem && !placeOnly;

  useEffect(() => {
    if (placeOnly) setStep("restaurant");
  }, [placeOnly]);

  useEffect(() => {
    if (!restaurant) {
      setStep("restaurant");
      return;
    }
    if (!placeOnly && !menuItem) setStep("item");
  }, [restaurant, menuItem, placeOnly]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (step === "item" && (placeOnly || !restaurant?.restaurant_id)) {
      setResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await searchReportPlaces({
          type: step === "restaurant" ? "restaurant" : "menu_item",
          q,
          restaurant_id: step === "item" ? restaurant.restaurant_id : null,
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
  }, [query, step, restaurant?.restaurant_id, placeOnly]);

  function pick(result) {
    if (step === "restaurant") {
      onRestaurantChange(asRestaurantPlace(result));
      onMenuItemChange(null);
      const hall = skipMenuItem || isDiningHallRestaurant(result);
      setStep(hall ? "restaurant" : "item");
      setQuery("");
      setResults([]);
      return;
    }
    onMenuItemChange(asDishPlace(result));
    setQuery("");
    setResults([]);
  }

  function resetRestaurant() {
    onRestaurantChange(null);
    onMenuItemChange(null);
    setStep("restaurant");
    setQuery("");
    setResults([]);
  }

  function clearItem() {
    onMenuItemChange(null);
    setQuery("");
    setResults([]);
  }

  return (
    <div style={cs.fieldStack}>
      {restaurant ? (
        <div style={styles.selected} data-testid="im-eating-selected-restaurant">
          <div style={styles.kind}>Restaurant</div>
          <strong>{restaurantLabel(restaurant) || "Selected restaurant"}</strong>
          {restaurant.address_line1 || restaurant.city ? (
            <span style={styles.muted}>
              {[restaurant.address_line1, restaurant.city, restaurant.state].filter(Boolean).join(", ")}
            </span>
          ) : null}
          <button type="button" style={styles.clear} disabled={disabled || lockRestaurant} onClick={resetRestaurant}>
            Change
          </button>
        </div>
      ) : null}

      {menuItem && !placeOnly ? (
        <div style={styles.selected} data-testid="im-eating-selected-dish">
          <div style={styles.kind}>Dish</div>
          <strong>{dishLabel(menuItem) || "Selected dish"}</strong>
          <button type="button" style={styles.clear} disabled={disabled} onClick={clearItem}>
            Change
          </button>
        </div>
      ) : null}

      {showPlaceSearch || showItemSearch ? (
        <>
          <label style={cs.label}>
            {showPlaceSearch ? "Find restaurant" : "Find a dish here"}
          </label>
          <input
            type="search"
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={showPlaceSearch ? "Restaurant name" : "Dish name"}
            style={cs.input}
          />
          {loading ? <p style={styles.muted}>Searching…</p> : null}
          {error ? <p style={styles.error}>{error}</p> : null}
          {results.length > 0 ? (
            <ul style={styles.list}>
              {results.map((r) => (
                <li key={`${r.type}-${r.restaurant_id || ""}-${r.menu_item_id || ""}`}>
                  <button type="button" style={styles.resultBtn} disabled={disabled} onClick={() => pick(r)}>
                    <strong>
                      {r.type === "restaurant" ? restaurantLabel(r) || "Restaurant" : dishLabel(r) || "Dish"}
                    </strong>
                    <span style={styles.muted}>
                      {r.type === "restaurant"
                        ? r.subtitle || [r.address_line1, r.city, r.state].filter(Boolean).join(", ")
                        : r.restaurant_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      <label style={cs.label}>
        {placeOnly
          ? "What's good today?"
          : restaurant && !menuItem
            ? "Note (required without a menu item)"
            : "Note (optional)"}
      </label>
      <textarea
        value={comment}
        disabled={disabled}
        onChange={(e) => onCommentChange(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={
          placeOnly
            ? "Post what's good today."
            : restaurant && !menuItem
              ? 'e.g. "Lunch today." or "Long line around noon."'
              : 'e.g. "Really good."'
        }
        style={cs.textarea}
      />

      {isAuthenticated ? (
        <>
          <label style={cs.label}>Visibility</label>
          <select
            value={visibility}
            disabled={disabled}
            onChange={(e) => onVisibilityChange(e.target.value)}
            style={cs.input}
          >
            <option value="public">Public — may appear on restaurant & cluster surfaces</option>
            <option value="connections">Connections only</option>
            <option value="private">Private (only you)</option>
          </select>
        </>
      ) : (
        <p style={styles.muted}>This post is public.</p>
      )}
    </div>
  );
}

const styles = {
  selected: {
    display: "grid",
    gap: 4,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#fff",
    border: `1px solid ${cs.DIVIDER}`,
    position: "relative",
  },
  kind: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: cs.MUTED },
  clear: {
    position: "absolute",
    top: 8,
    right: 8,
    border: "none",
    background: "transparent",
    color: "#166534",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  list: { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 },
  resultBtn: {
    width: "100%",
    textAlign: "left",
    display: "grid",
    gap: 2,
    padding: "10px 12px",
    borderRadius: 10,
    border: `1px solid ${cs.DIVIDER}`,
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  muted: { fontSize: 13, color: cs.MUTED, margin: 0 },
  error: { fontSize: 13, color: "#b91c1c", margin: 0 },
};
