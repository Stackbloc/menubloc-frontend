/**
 * Optional restaurant + menu item, or homemade (no restaurant/dish).
 * Restaurant first, then that restaurant's menu items. Homemade is last.
 */

import { useEffect, useState } from "react";
import {
  asDishPlace,
  asRestaurantPlace,
  dishLabel,
  restaurantLabel,
  searchReportPlaces,
} from "../../../lib/foodActivityApi.js";
import { dishPhotoUrl } from "./eatingPlaceLink.js";
import * as s from "./myMenuplyStyles.js";

export default function EatingPlaceFields({
  homemade = false,
  onHomemadeChange,
  restaurant = null,
  onRestaurantChange,
  dish = null,
  onDishChange,
  followed = [],
  disabled = false,
  allowDishSearch = true,
  allowHomemade = true,
  locationCity = null,
  locationState = null,
  dishSearchPlaceholder = "Filter this restaurant's menu",
}) {
  const [query, setQuery] = useState("");
  const [dishQuery, setDishQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [dishHits, setDishHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingDishes, setLoadingDishes] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (homemade || restaurant || q.length < 2) {
      setHits([]);
      setSearching(false);
      return undefined;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchReportPlaces({
          type: "restaurant",
          q,
          limit: 16,
          city: locationCity,
          state: locationState,
        });
        setHits(data.results || []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query, restaurant, homemade, locationCity, locationState]);

  useEffect(() => {
    if (!allowDishSearch || homemade || !restaurant?.restaurant_id || dish) {
      setDishHits([]);
      setLoadingDishes(false);
      return undefined;
    }
    const q = dishQuery.trim();
    const t = setTimeout(async () => {
      setLoadingDishes(true);
      try {
        const data = await searchReportPlaces({
          type: "menu_item",
          q,
          restaurant_id: restaurant.restaurant_id,
          limit: 20,
        });
        setDishHits(data.results || []);
      } catch {
        setDishHits([]);
      } finally {
        setLoadingDishes(false);
      }
    }, q ? 220 : 0);
    return () => clearTimeout(t);
  }, [dishQuery, restaurant, dish, homemade, allowDishSearch]);

  function pickRestaurant(row) {
    const next = asRestaurantPlace(row);
    if (!next) return;
    onHomemadeChange?.(false);
    onRestaurantChange?.(next);
    onDishChange?.(null);
    setQuery("");
    setHits([]);
    setDishQuery("");
  }

  function pickDish(row) {
    const next = asDishPlace({
      ...row,
      item_photo_url: dishPhotoUrl(row) || row.item_photo_url,
    });
    if (!next) return;
    onDishChange?.(next);
    setDishQuery("");
    setDishHits([]);
  }

  function chooseRestaurant() {
    onHomemadeChange?.(false);
  }

  const followedPicks = (followed || []).filter((row) => row?.restaurant_id).slice(0, 8);

  return (
    <div data-testid="eating-place-fields" style={styles.wrap}>
      <div style={styles.originRow} role="group" aria-label="Where is this from">
        <button
          type="button"
          data-testid="eating-place-restaurant"
          style={!homemade && restaurant ? styles.originOn : styles.origin}
          disabled={disabled}
          onClick={chooseRestaurant}
        >
          Restaurant
        </button>
        {allowHomemade ? (
          <button
            type="button"
            data-testid="eating-place-homemade"
            style={homemade ? styles.originOn : styles.origin}
            disabled={disabled}
            onClick={() => {
              onHomemadeChange?.(true);
              onRestaurantChange?.(null);
              onDishChange?.(null);
              setQuery("");
              setHits([]);
            }}
          >
            Homemade
          </button>
        ) : null}
        {homemade || restaurant ? (
          <button
            type="button"
            style={styles.clear}
            disabled={disabled}
            onClick={() => {
              onHomemadeChange?.(false);
              onRestaurantChange?.(null);
              onDishChange?.(null);
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {homemade ? (
        <p style={s.muted} data-testid="eating-place-homemade-note">
          Homemade — no restaurant or menu item.
        </p>
      ) : restaurant ? (
        <>
          <div style={styles.selected} data-testid="eating-place-restaurant-selected">
            <div>
              <div style={styles.selectedName}>{restaurantLabel(restaurant) || "Restaurant"}</div>
              {restaurant.city ? (
                <div style={s.muted}>
                  {[restaurant.city, restaurant.state].filter(Boolean).join(", ")}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              style={styles.change}
              disabled={disabled}
              onClick={() => {
                onRestaurantChange?.(null);
                onDishChange?.(null);
              }}
            >
              Change
            </button>
          </div>
          {allowDishSearch && dish ? (
            <div style={styles.selected} data-testid="eating-place-dish-selected">
              <div style={styles.dishRow}>
                {dishPhotoUrl(dish) ? (
                  <img src={dishPhotoUrl(dish)} alt="" style={styles.dishThumb} />
                ) : null}
                <div>
                  <div style={styles.kind}>Menu item</div>
                  <div style={{ fontWeight: 800 }}>{dishLabel(dish)}</div>
                  {dishPhotoUrl(dish) ? (
                    <div style={{ ...s.muted, fontSize: 12 }}>Restaurant photo — take your own anytime</div>
                  ) : null}
                </div>
              </div>
              <button type="button" style={styles.change} disabled={disabled} onClick={() => onDishChange?.(null)}>
                Change
              </button>
            </div>
          ) : allowDishSearch ? (
            <>
              <input
                type="search"
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value.slice(0, 120))}
                placeholder={dishSearchPlaceholder}
                disabled={disabled}
                autoComplete="off"
                style={styles.place}
                aria-label="Select menu item"
                data-testid="eating-place-dish-search"
              />
              {loadingDishes ? <p style={s.muted}>Loading menu…</p> : null}
              {dishHits.length > 0 ? (
                <ul style={styles.hits} data-testid="eating-place-dish-hits">
                  {dishHits.map((hit) => (
                    <li key={hit.menu_item_id}>
                      <button type="button" style={styles.hitBtn} onClick={() => pickDish(hit)}>
                        <span style={styles.dishRow}>
                          {dishPhotoUrl(hit) ? (
                            <img src={dishPhotoUrl(hit)} alt="" style={styles.dishThumb} />
                          ) : null}
                          <span>{dishLabel(hit)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : !loadingDishes ? (
                <p style={s.muted}>No menu items yet for this location — you can still post the restaurant.</p>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              onHomemadeChange?.(false);
              setQuery(e.target.value.slice(0, 120));
            }}
            placeholder="Restaurant (optional)"
            disabled={disabled}
            autoComplete="off"
            style={styles.place}
            aria-label="Link restaurant"
            data-testid="eating-place-restaurant-search"
          />
          {searching ? <p style={s.muted}>Searching…</p> : null}
          {hits.length > 0 ? (
            <ul style={styles.hits} data-testid="eating-place-restaurant-hits">
              {hits.map((hit) => (
                <li key={hit.restaurant_id}>
                  <button type="button" style={styles.hitBtn} onClick={() => pickRestaurant(hit)}>
                    {restaurantLabel(hit)}
                    {hit.city ? ` · ${hit.city}` : ""}
                    {hit.state && !String(hit.city || "").includes(hit.state) ? `, ${hit.state}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {followedPicks.length > 0 ? (
            <div style={styles.followed}>
              {followedPicks.map((row) => (
                <button
                  key={row.restaurant_id}
                  type="button"
                  style={s.chipBtn}
                  disabled={disabled}
                  onClick={() => pickRestaurant(row)}
                >
                  {row.restaurant_name}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

const styles = {
  wrap: { display: "flex", flexDirection: "column", gap: 8 },
  originRow: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" },
  origin: {
    appearance: "none",
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#334155",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  originOn: {
    appearance: "none",
    border: "1px solid #86efac",
    background: "#ecfdf5",
    color: "#166534",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  clear: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  place: {
    width: "100%",
    minHeight: 44,
    border: "1.5px solid #d1d5db",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0B0F0C",
    background: "#fff",
    boxSizing: "border-box",
  },
  selected: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 12px",
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    background: "#f8fafc",
  },
  selectedName: { fontWeight: 700, fontSize: 15, lineHeight: 1.25, color: "#0f172a" },
  kind: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#64748b",
  },
  change: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#15803d",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  hits: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    border: "1px solid #e4e7ec",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
    maxHeight: 240,
    overflowY: "auto",
  },
  hitBtn: {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid #f2f4f7",
    background: "#fff",
    font: "inherit",
    cursor: "pointer",
  },
  followed: { display: "flex", flexWrap: "wrap", gap: 8 },
  dishRow: { display: "flex", alignItems: "center", gap: 10 },
  dishThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    objectFit: "cover",
    background: "#e5e7eb",
    flex: "0 0 auto",
  },
};
