/**
 * CK-backed restaurant + menu item selection — search to pick, never free-text IDs.
 * Uses public food-activity place search (commonknowledge menu items for dishes).
 */

import { useEffect, useState } from "react";
import {
  asDishPlace,
  asRestaurantPlace,
  dishLabel,
  restaurantLabel,
  resolveEatingPrefill,
  searchReportPlaces,
} from "../../lib/foodActivityApi.js";

const styles = {
  wrap: { display: "flex", flexDirection: "column", gap: 10 },
  label: { margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" },
  hint: { margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.4 },
  search: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "inherit",
  },
  selected: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  selectedName: { fontWeight: 700, fontSize: 14, color: "#0f172a" },
  selectedMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  change: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "#0ea5e9",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
  },
  hits: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    overflow: "hidden",
    maxHeight: 220,
    overflowY: "auto",
  },
  hitBtn: {
    appearance: "none",
    width: "100%",
    textAlign: "left",
    border: "none",
    borderBottom: "1px solid #f1f5f9",
    background: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};

export default function CkRestaurantMenuPicker({
  restaurant = null,
  onRestaurantChange,
  dish = null,
  onDishChange,
  allowMenuItem = true,
  disabled = false,
  restaurantRequired = false,
  testIdPrefix = "ck-place",
}) {
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurantHits, setRestaurantHits] = useState([]);
  const [restaurantSearching, setRestaurantSearching] = useState(false);
  const [dishQuery, setDishQuery] = useState("");
  const [dishHits, setDishHits] = useState([]);
  const [dishSearching, setDishSearching] = useState(false);

  useEffect(() => {
    const q = restaurantQuery.trim();
    if (restaurant || q.length < 2) {
      setRestaurantHits([]);
      setRestaurantSearching(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setRestaurantSearching(true);
      try {
        const data = await searchReportPlaces({ type: "restaurant", q, limit: 16 });
        setRestaurantHits(data.results || []);
      } catch {
        setRestaurantHits([]);
      } finally {
        setRestaurantSearching(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [restaurantQuery, restaurant]);

  useEffect(() => {
    if (!allowMenuItem || !restaurant?.restaurant_id || dish) {
      setDishHits([]);
      setDishSearching(false);
      return undefined;
    }
    const q = dishQuery.trim();
    const timer = setTimeout(async () => {
      setDishSearching(true);
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
        setDishSearching(false);
      }
    }, q ? 220 : 0);
    return () => clearTimeout(timer);
  }, [allowMenuItem, dishQuery, restaurant, dish]);

  function pickRestaurant(row) {
    const next = asRestaurantPlace(row);
    if (!next) return;
    onRestaurantChange?.(next);
    onDishChange?.(null);
    setRestaurantQuery("");
    setRestaurantHits([]);
    setDishQuery("");
    setDishHits([]);
  }

  function pickDish(row) {
    const next = asDishPlace(row);
    if (!next) return;
    onDishChange?.(next);
    if (next.restaurant_id && !restaurant?.restaurant_id) {
      onRestaurantChange?.(
        asRestaurantPlace({
          restaurant_id: next.restaurant_id,
          restaurant_name: row.restaurant_name || restaurant?.restaurant_name,
          city: row.city || restaurant?.city,
          state: row.state || restaurant?.state,
        })
      );
    }
    setDishQuery("");
    setDishHits([]);
  }

  return (
    <div style={styles.wrap} data-testid={`${testIdPrefix}-picker`}>
      <p style={styles.hint}>
        Pick from Common Knowledge search results — do not type restaurant or menu item names manually.
      </p>

      <div>
        <p style={styles.label} id={`${testIdPrefix}-restaurant-label`}>
          Restaurant{restaurantRequired ? " *" : ""}
        </p>
        {restaurant ? (
          <div style={styles.selected} data-testid={`${testIdPrefix}-restaurant-selected`}>
            <div>
              <div style={styles.selectedName}>{restaurantLabel(restaurant)}</div>
              <div style={styles.selectedMeta}>
                CK restaurant #{restaurant.restaurant_id}
                {restaurant.city
                  ? ` · ${[restaurant.city, restaurant.state].filter(Boolean).join(", ")}`
                  : ""}
              </div>
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
        ) : (
          <>
            <input
              type="search"
              value={restaurantQuery}
              onChange={(e) => setRestaurantQuery(e.target.value.slice(0, 120))}
              placeholder="Search CK restaurants…"
              disabled={disabled}
              autoComplete="off"
              style={styles.search}
              aria-labelledby={`${testIdPrefix}-restaurant-label`}
              data-testid={`${testIdPrefix}-restaurant-search`}
            />
            {restaurantSearching ? <p style={styles.hint}>Searching…</p> : null}
            {restaurantHits.length > 0 ? (
              <ul style={styles.hits} data-testid={`${testIdPrefix}-restaurant-hits`}>
                {restaurantHits.map((hit) => (
                  <li key={hit.restaurant_id || hit.id}>
                    <button type="button" style={styles.hitBtn} onClick={() => pickRestaurant(hit)}>
                      {restaurantLabel(hit)}
                      {hit.city ? ` · ${hit.city}${hit.state ? `, ${hit.state}` : ""}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      {allowMenuItem ? (
        <div>
          <p style={styles.label} id={`${testIdPrefix}-menu-item-label`}>
            Menu item (CK)
          </p>
          {dish ? (
            <div style={styles.selected} data-testid={`${testIdPrefix}-dish-selected`}>
              <div>
                <div style={styles.selectedName}>{dishLabel(dish)}</div>
                <div style={styles.selectedMeta}>CK menu item #{String(dish.menu_item_id)}</div>
              </div>
              <button
                type="button"
                style={styles.change}
                disabled={disabled}
                onClick={() => onDishChange?.(null)}
              >
                Change
              </button>
            </div>
          ) : restaurant ? (
            <>
              <input
                type="search"
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value.slice(0, 120))}
                placeholder="Search CK menu items at this restaurant…"
                disabled={disabled}
                autoComplete="off"
                style={styles.search}
                aria-labelledby={`${testIdPrefix}-menu-item-label`}
                data-testid={`${testIdPrefix}-dish-search`}
              />
              {dishSearching ? <p style={styles.hint}>Loading menu…</p> : null}
              {dishHits.length > 0 ? (
                <ul style={styles.hits} data-testid={`${testIdPrefix}-dish-hits`}>
                  {dishHits.map((hit) => (
                    <li key={String(hit.menu_item_id || hit.id)}>
                      <button type="button" style={styles.hitBtn} onClick={() => pickDish(hit)}>
                        {dishLabel(hit)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : !dishSearching ? (
                <p style={styles.hint} data-testid={`${testIdPrefix}-dish-empty`}>
                  No CK menu items match — pick another restaurant or refine search.
                </p>
              ) : null}
            </>
          ) : (
            <p style={styles.hint} data-testid={`${testIdPrefix}-dish-needs-restaurant`}>
              Pick a restaurant first, then choose a CK menu item.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/** Hydrate picker state from persisted restaurant_id / menu_item_id on a video row. */
export function useCkPlaceFromVideoIds({ restaurantId, menuItemId, videoKey }) {
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const rid = restaurantId != null ? Number(restaurantId) : null;
    const mid = menuItemId != null ? menuItemId : null;
    if (!rid && !mid) {
      setRestaurant(null);
      setDish(null);
      return undefined;
    }
    setLoading(true);
    resolveEatingPrefill({ restaurantId: rid, menuItemId: mid })
      .then(({ restaurant: r, menuItem: d }) => {
        if (cancelled) return;
        setRestaurant(r);
        setDish(d);
      })
      .catch(() => {
        if (!cancelled) {
          setRestaurant(null);
          setDish(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId, menuItemId, videoKey]);

  return { restaurant, setRestaurant, dish, setDish, loading };
}
