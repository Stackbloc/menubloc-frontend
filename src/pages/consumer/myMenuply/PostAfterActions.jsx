/**
 * After a simple What I'm Eating post, or when a diner taps a posted item:
 * restaurant, dish, recipe note, meal category, optional join seats.
 */

import { useEffect, useState } from "react";
import {
  asDishPlace,
  asRestaurantPlace,
  dishLabel,
  restaurantLabel,
  searchReportPlaces,
} from "../../../lib/foodActivityApi.js";
import {
  suggestWhatIAteTodayMenuItems,
  updateWhatIAteToday,
  updateWhatWeDoingSession,
  updateWantToEat,
} from "../../../lib/consumerApi.js";
import { WHAT_I_ATE_MEAL_PERIODS } from "../../../lib/whatIAteTodayMealPeriod.js";
import * as s from "./myMenuplyStyles.js";

const HOMEMADE_PREFIX = "Homemade";

function splitHomemadeComment(comment) {
  const raw = String(comment || "").trim();
  if (!raw) return { homemade: false, recipe: "" };
  if (raw === HOMEMADE_PREFIX) return { homemade: true, recipe: "" };
  if (raw.startsWith(`${HOMEMADE_PREFIX}. `)) {
    return { homemade: true, recipe: raw.slice(HOMEMADE_PREFIX.length + 2).trim() };
  }
  if (raw.startsWith(`${HOMEMADE_PREFIX} `)) {
    return { homemade: true, recipe: raw.slice(HOMEMADE_PREFIX.length).trim() };
  }
  return { homemade: false, recipe: raw };
}

function joinHomemadeComment(homemade, recipe) {
  const note = String(recipe || "").trim();
  if (homemade && note) return `${HOMEMADE_PREFIX}. ${note}`;
  if (homemade) return HOMEMADE_PREFIX;
  return note;
}

export default function PostAfterActions({
  kind,
  record,
  busy = false,
  followed = [],
  onTagged,
  onSkip,
}) {
  const [query, setQuery] = useState("");
  const [dishQuery, setDishQuery] = useState("");
  const [globalDishQuery, setGlobalDishQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [dishHits, setDishHits] = useState([]);
  const [globalDishHits, setGlobalDishHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [globalDishSearching, setGlobalDishSearching] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [joinable, setJoinable] = useState(false);
  const [joinCapacity, setJoinCapacity] = useState("4");
  const [mealPeriod, setMealPeriod] = useState("");
  const [recipe, setRecipe] = useState("");
  const [homemade, setHomemade] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const split = splitHomemadeComment(record?.comment || record?.recipe);
    setMealPeriod(String(record?.meal_period || "").trim());
    setRecipe(split.recipe);
    setHomemade(split.homemade);
    setJoinable(Boolean(record?.joinable));
    setJoinCapacity(String(record?.join_capacity || "4"));
    setRestaurant(split.homemade ? null : record?.restaurant_id ? asRestaurantPlace(record) : null);
    setDish(split.homemade ? null : record?.menu_item_id ? asDishPlace(record) : null);
    setQuery("");
    setDishQuery("");
    setGlobalDishQuery("");
    setGlobalDishHits([]);
    setError("");
  }, [record?.id, record?.token, record?.kind]);

  useEffect(() => {
    const q = query.trim();
    if (restaurant || q.length < 2) {
      setHits([]);
      setSearching(false);
      return undefined;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchReportPlaces({ type: "restaurant", q, limit: 8 });
        setHits(data.results || []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query, restaurant]);

  useEffect(() => {
    const q = dishQuery.trim();
    if (!restaurant?.restaurant_id || dish || q.length < 2) {
      setDishHits([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      try {
        const data = await searchReportPlaces({
          type: "menu_item",
          q,
          restaurant_id: restaurant.restaurant_id,
          limit: 8,
        });
        setDishHits(data.results || []);
      } catch {
        setDishHits([]);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [dishQuery, restaurant, dish]);

  useEffect(() => {
    if (kind !== "want" || dish) {
      setGlobalDishHits([]);
      setGlobalDishSearching(false);
      return undefined;
    }
    const q = globalDishQuery.trim();
    if (q.length < 2) {
      setGlobalDishHits([]);
      setGlobalDishSearching(false);
      return undefined;
    }
    const t = setTimeout(async () => {
      setGlobalDishSearching(true);
      try {
        const data = await suggestWhatIAteTodayMenuItems(q);
        setGlobalDishHits(data?.suggestions || []);
      } catch {
        setGlobalDishHits([]);
      } finally {
        setGlobalDishSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [globalDishQuery, dish, kind]);

  function pickRestaurant(row) {
    const next = asRestaurantPlace(row);
    if (!next) return;
    setHomemade(false);
    setRestaurant(next);
    setDish(null);
    setQuery("");
    setHits([]);
  }

  function pickDish(row) {
    const next = asDishPlace(row);
    if (!next) return;
    setDish(next);
    setDishQuery("");
    setDishHits([]);
    setGlobalDishQuery("");
    setGlobalDishHits([]);
  }

  function pickWantMenuItem(row) {
    const nextDish = asDishPlace({
      menu_item_id: row.menu_item_id,
      item_name: row.item_name || row.label,
      restaurant_id: row.restaurant_id,
    });
    if (!nextDish) return;
    const nextRestaurant = asRestaurantPlace({
      restaurant_id: row.restaurant_id,
      restaurant_name: row.restaurant_name,
      restaurant_slug: row.restaurant_slug,
      city: row.restaurant_city || row.city,
      state: row.restaurant_state || row.state,
    });
    setDish(nextDish);
    if (nextRestaurant) setRestaurant(nextRestaurant);
    setGlobalDishQuery("");
    setGlobalDishHits([]);
    setQuery("");
    setHits([]);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!record) return;
    setSaving(true);
    setError("");
    try {
      const mealLabel = WHAT_I_ATE_MEAL_PERIODS.find((p) => p.id === mealPeriod)?.label || "";
      if (kind === "plan") {
        const token = record.token || record.id;
        const placeLabel =
          [mealLabel, restaurantLabel(restaurant), dishLabel(dish), recipe.trim()]
            .filter(Boolean)
            .join(" · ") || undefined;
        await updateWhatWeDoingSession(token, {
          restaurant_id: restaurant?.restaurant_id || undefined,
          place_label: placeLabel,
          joinable,
          join_capacity: joinable ? Number(joinCapacity) : undefined,
        });
      } else if (kind === "want") {
        const data = await updateWantToEat(record.id, {
          restaurant_id: restaurant?.restaurant_id || undefined,
          menu_item_id: dish?.menu_item_id || undefined,
          food_name: dishLabel(dish) || record.food_name || undefined,
          meal_period: mealPeriod || undefined,
          comment: recipe,
        });
        setRestaurant(null);
        setDish(null);
        setJoinable(false);
        setJoinCapacity("4");
        if (onTagged) await onTagged(data?.item || null);
        return;
      } else {
        await updateWhatIAteToday(record.id, {
          restaurant_id: homemade ? null : restaurant?.restaurant_id || undefined,
          menu_item_id: homemade ? null : dish?.menu_item_id || undefined,
          food_name: homemade ? record.food_name : dishLabel(dish) || record.food_name || undefined,
          meal_period: mealPeriod || undefined,
          comment: joinHomemadeComment(homemade, recipe),
        });
      }
      setRestaurant(null);
      setDish(null);
      setJoinable(false);
      setJoinCapacity("4");
      if (onTagged) await onTagged();
    } catch (err) {
      setError(err.message || "Unable to tag");
    } finally {
      setSaving(false);
    }
  }

  const followedPicks = (followed || []).filter((row) => row?.restaurant_id).slice(0, 8);
  const canSave = Boolean(
    homemade || restaurant || dish || recipe.trim() || mealPeriod || (kind === "plan" && joinable)
  );
  const disabled = busy || saving;
  const isWant = kind === "want";
  const isDiary = kind === "diary";

  return (
    <form onSubmit={handleSave} data-testid="post-after-actions" style={styles.form}>
      <div style={styles.kicker}>{isWant ? "Link menu item" : "Add optional details"}</div>
      <p style={s.muted}>
        {isWant
          ? "Search a dish to link it, or tag a restaurant. Saved to your want list below."
          : "Restaurant, menu item, homemade, and recipe are optional. Skip anytime."}
      </p>
      {isDiary ? (
        <div style={styles.originRow} role="group" aria-label="Where was this from">
          <button
            type="button"
            data-testid="post-after-homemade"
            style={homemade ? styles.originOn : styles.origin}
            disabled={disabled}
            onClick={() => {
              setHomemade(true);
              setRestaurant(null);
              setDish(null);
              setQuery("");
              setHits([]);
            }}
          >
            Homemade
          </button>
          <button
            type="button"
            data-testid="post-after-restaurant-origin"
            style={!homemade && restaurant ? styles.originOn : styles.origin}
            disabled={disabled}
            onClick={() => setHomemade(false)}
          >
            Restaurant
          </button>
        </div>
      ) : null}
      {isWant && !dish ? (
        <>
          <input
            type="search"
            value={globalDishQuery}
            onChange={(e) => setGlobalDishQuery(e.target.value.slice(0, 120))}
            placeholder="Search menu item (e.g. McMuffin, pepperoni pizza)"
            disabled={disabled}
            autoComplete="off"
            style={styles.place}
            aria-label="Search menu item"
            data-testid="want-link-menu-item"
          />
          {globalDishSearching ? <p style={s.muted}>Searching menus…</p> : null}
          {globalDishHits.length > 0 ? (
            <ul style={styles.hits} data-testid="want-menu-item-hits">
              {globalDishHits.map((hit) => (
                <li key={hit.menu_item_id}>
                  <button type="button" style={styles.hitBtn} onClick={() => pickWantMenuItem(hit)}>
                    {hit.item_name || hit.label}
                    {hit.restaurant_name || hit.subtitle ? ` · ${hit.restaurant_name || hit.subtitle}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
      <div style={styles.meals} role="group" aria-label="Meal category">
        {WHAT_I_ATE_MEAL_PERIODS.map((period) => (
          <button
            key={period.id}
            type="button"
            style={mealPeriod === period.id ? styles.mealOn : styles.meal}
            disabled={disabled}
            onClick={() => setMealPeriod((prev) => (prev === period.id ? "" : period.id))}
          >
            {period.label}
          </button>
        ))}
      </div>
      <textarea
        value={recipe}
        onChange={(e) => setRecipe(e.target.value.slice(0, 500))}
            placeholder="Recipe or notes (optional)"
        disabled={disabled}
        rows={3}
        style={styles.recipe}
        aria-label="Recipe"
      />
      {error ? <p style={s.error}>{error}</p> : null}

      {homemade ? (
        <p style={s.muted} data-testid="post-after-homemade-note">
          Homemade — no restaurant or menu item needed.
        </p>
      ) : restaurant ? (
        <div style={styles.selected} data-testid="post-after-restaurant">
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
              setRestaurant(null);
              setDish(null);
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 120))}
            placeholder="Restaurant (optional)"
            disabled={disabled}
            autoComplete="off"
            style={styles.place}
            aria-label="Tag restaurant"
          />
          {searching ? <p style={s.muted}>Searching…</p> : null}
          {hits.length > 0 ? (
            <ul style={styles.hits}>
              {hits.map((hit) => (
                <li key={hit.restaurant_id}>
                  <button type="button" style={styles.hitBtn} onClick={() => pickRestaurant(hit)}>
                    {restaurantLabel(hit)}
                    {hit.city ? ` · ${hit.city}` : ""}
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

      {restaurant && dish ? (
        <div style={styles.selected} data-testid="post-after-dish">
          <div>
            <div style={styles.kind}>Dish</div>
            <div style={{ fontWeight: 800 }}>{dishLabel(dish)}</div>
          </div>
          <button type="button" style={styles.change} disabled={disabled} onClick={() => setDish(null)}>
            Change
          </button>
        </div>
      ) : restaurant ? (
        <>
          <input
            type="search"
            value={dishQuery}
            onChange={(e) => setDishQuery(e.target.value.slice(0, 120))}
            placeholder="Menu item (optional)"
            disabled={disabled}
            autoComplete="off"
            style={styles.place}
            aria-label="Tag a dish"
          />
          {dishHits.length > 0 ? (
            <ul style={styles.hits}>
              {dishHits.map((hit) => (
                <li key={hit.menu_item_id}>
                  <button type="button" style={styles.hitBtn} onClick={() => pickDish(hit)}>
                    {dishLabel(hit)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}

      {kind === "plan" ? (
        <>
          <label style={styles.check}>
            <input
              type="checkbox"
              checked={joinable}
              disabled={disabled}
              onChange={(e) => setJoinable(e.target.checked)}
            />
            People can join
          </label>
          {joinable ? (
            <label style={styles.seats}>
              How many can join
              <input
                type="number"
                min={1}
                max={99}
                value={joinCapacity}
                disabled={disabled}
                onChange={(e) => setJoinCapacity(e.target.value)}
                style={styles.num}
                aria-label="How many can join"
              />
            </label>
          ) : null}
        </>
      ) : null}

      <div style={styles.actionRow}>
        {onSkip ? (
          <button
            type="button"
            data-testid="post-after-skip"
            disabled={disabled}
            style={s.chipBtn}
            onClick={() => onSkip()}
          >
            Skip for now
          </button>
        ) : null}
        <button type="submit" disabled={disabled || !canSave} style={s.primaryBtn}>
          {saving ? "…" : "Save details"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    margin: "10px 0 12px",
    padding: "14px 14px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
  },
  kicker: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#667085",
  },
  originRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
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
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  kind: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#64748b",
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
    color: "#0f172a",
  },
  selectedName: {
    fontWeight: 700,
    fontSize: 15,
    lineHeight: 1.25,
    color: "#0f172a",
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
  followed: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  check: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#0B0F0C",
  },
  seats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#0B0F0C",
  },
  meals: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  meal: {
    appearance: "none",
    border: "1.5px solid #d1d5db",
    background: "#fff",
    color: "#334155",
    borderRadius: 999,
    minHeight: 36,
    padding: "0 12px",
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  },
  mealOn: {
    appearance: "none",
    border: "1.5px solid #16A34A",
    background: "#ecfdf5",
    color: "#0f172a",
    borderRadius: 999,
    minHeight: 36,
    padding: "0 12px",
    font: "inherit",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
  },
  recipe: {
    width: "100%",
    border: "1.5px solid #d1d5db",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#0B0F0C",
    background: "#fff",
    boxSizing: "border-box",
    resize: "vertical",
  },
};
