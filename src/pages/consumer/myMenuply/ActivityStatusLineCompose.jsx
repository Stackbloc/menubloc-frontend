/**
 * Category-scoped status-line compose (not chip walls).
 * Eating: "Eating at [restaurant] — [menu item]" | "Cooking [food] @ home"
 * Wanna:  "Wanna eat [Chinese] at [place] — [item]" — stop anytime after cuisine.
 * Video stays on Multiplier/Post. Meal time is not the lead (optional after).
 */

import { useEffect, useState } from "react";
import {
  FAVORITE_CUISINE_OPTIONS,
  FAVORITE_FOOD_TYPE_OPTIONS,
} from "../../../lib/dinerFavoriteFoods.js";
import {
  asDishPlace,
  asRestaurantPlace,
  searchReportPlaces,
} from "../../../lib/foodActivityApi.js";
import { socialBtn } from "../../../lib/socialDesignTokens.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

const COOKING_FOODS = [
  ...FAVORITE_FOOD_TYPE_OPTIONS.slice(0, 8).map((o) => o.label),
  "leftovers",
  "eggs",
  "pasta",
];

const WANNA_STARTERS = [
  ...FAVORITE_CUISINE_OPTIONS.slice(0, 8),
  ...FAVORITE_FOOD_TYPE_OPTIONS.slice(0, 6),
];

function SoftPick({ label, onClick }) {
  return (
    <button type="button" style={styles.softPick} onClick={onClick}>
      {label}
    </button>
  );
}

function Blank({
  value,
  placeholder,
  active,
  onActivate,
  mutedPrefix,
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      style={{
        ...styles.blank,
        ...(active ? styles.blankActive : null),
        ...(value ? styles.blankFilled : null),
      }}
      aria-label={placeholder}
    >
      {mutedPrefix ? <span style={styles.mutedInline}>{mutedPrefix}</span> : null}
      {value || placeholder}
    </button>
  );
}

export default function ActivityStatusLineCompose({
  category = "ate",
  busy = false,
  locationCity = null,
  locationState = null,
  onSubmit,
}) {
  const isWant = category === "want";
  const [mode, setMode] = useState("out"); // out | cooking (ate only)
  const [focus, setFocus] = useState(isWant ? "starter" : "place");
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [homeFood, setHomeFood] = useState("");
  const [starter, setStarter] = useState(null); // cuisine/food for want
  const [placeQuery, setPlaceQuery] = useState("");
  const [dishQuery, setDishQuery] = useState("");
  const [placeHits, setPlaceHits] = useState([]);
  const [dishHits, setDishHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode("out");
    setFocus(isWant ? "starter" : "place");
    setRestaurant(null);
    setDish(null);
    setHomeFood("");
    setStarter(null);
    setPlaceQuery("");
    setDishQuery("");
    setError("");
  }, [isWant]);

  useEffect(() => {
    if (focus !== "place" || restaurant) {
      setPlaceHits([]);
      return undefined;
    }
    const q = placeQuery.trim();
    if (q.length < 2) {
      setPlaceHits([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchReportPlaces({
          type: "restaurant",
          q,
          limit: 12,
          city: locationCity,
          state: locationState,
        });
        setPlaceHits(data.results || []);
      } catch {
        setPlaceHits([]);
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [placeQuery, focus, restaurant, locationCity, locationState]);

  useEffect(() => {
    if (focus !== "item" || !restaurant?.restaurant_id || dish) {
      setDishHits([]);
      return undefined;
    }
    const q = dishQuery.trim();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchReportPlaces({
          type: "menu_item",
          q,
          restaurant_id: restaurant.restaurant_id,
          limit: 16,
        });
        setDishHits(data.results || []);
      } catch {
        setDishHits([]);
      } finally {
        setSearching(false);
      }
    }, q ? 220 : 0);
    return () => clearTimeout(t);
  }, [dishQuery, focus, restaurant, dish]);

  const canPost = isWant
    ? Boolean(starter)
    : mode === "cooking"
      ? Boolean(String(homeFood || "").trim())
      : Boolean(restaurant && dish);

  async function handlePost(e) {
    e.preventDefault();
    setError("");
    if (!canPost || busy) return;
    try {
      if (isWant) {
        const cuisineOrFood = starter;
        const wantKind =
          dish && restaurant
            ? null
            : restaurant && !dish
              ? "restaurant"
              : cuisineOrFood?.kind === "cuisine"
                ? "cuisine"
                : "food_item";
        await onSubmit?.({
          category: "want",
          text: dish?.item_name || restaurant?.restaurant_name || cuisineOrFood?.label || "",
          wantKind,
          foodInterestKey: dish || restaurant ? null : cuisineOrFood?.key || null,
          homemade: false,
          restaurant: restaurant || null,
          dish: dish || null,
          file: null,
          marketDiscoverable: true,
        });
      } else if (mode === "cooking") {
        await onSubmit?.({
          category: "ate",
          text: String(homeFood).trim(),
          homemade: true,
          restaurant: null,
          dish: null,
          ateKind: "food_item",
          foodInterestKey: null,
          mealPeriod: null,
          file: null,
          marketDiscoverable: true,
        });
      } else {
        await onSubmit?.({
          category: "ate",
          text: dish?.item_name || "",
          homemade: false,
          restaurant,
          dish,
          ateKind: "menu_item",
          foodInterestKey: null,
          mealPeriod: null,
          file: null,
          marketDiscoverable: true,
        });
      }
      setRestaurant(null);
      setDish(null);
      setHomeFood("");
      setStarter(null);
      setPlaceQuery("");
      setDishQuery("");
      setFocus(isWant ? "starter" : mode === "cooking" ? "home" : "place");
    } catch (err) {
      setError(err?.message || "Unable to post");
    }
  }

  function pickRestaurant(row) {
    const next = asRestaurantPlace(row);
    if (!next) return;
    setRestaurant(next);
    setDish(null);
    setPlaceQuery("");
    setPlaceHits([]);
    setFocus("item");
  }

  function pickDish(row) {
    const next = asDishPlace(row);
    if (!next) return;
    setDish(next);
    if (next.restaurant_id && !restaurant?.restaurant_id) {
      setRestaurant(
        asRestaurantPlace({
          restaurant_id: next.restaurant_id,
          restaurant_name: row.restaurant_name,
          restaurant_slug: row.restaurant_slug,
          city: row.city,
          state: row.state,
        })
      );
    }
    setDishQuery("");
    setDishHits([]);
    setFocus("");
  }

  return (
    <form
      onSubmit={handlePost}
      style={styles.wrap}
      data-testid={isWant ? "wanna-status-line-compose" : "eating-status-line-compose"}
    >
      {!isWant ? (
        <div style={styles.modeRow} data-testid="eating-status-mode">
          <button
            type="button"
            style={{ ...styles.modeLink, ...(mode === "out" ? styles.modeLinkOn : null) }}
            onClick={() => {
              setMode("out");
              setHomeFood("");
              setFocus("place");
            }}
            disabled={busy}
          >
            out
          </button>
          <button
            type="button"
            style={{
              ...styles.modeLink,
              ...(mode === "cooking" ? styles.modeLinkOn : null),
            }}
            onClick={() => {
              setMode("cooking");
              setRestaurant(null);
              setDish(null);
              setFocus("home");
            }}
            disabled={busy}
          >
            cooking
          </button>
        </div>
      ) : null}

      <div style={styles.sentence} data-testid="status-line-sentence">
        {isWant ? (
          <>
            <span style={styles.lead}>Wanna eat </span>
            <Blank
              value={starter?.label || null}
              placeholder="Chinese"
              active={focus === "starter"}
              onActivate={() => setFocus("starter")}
            />
            {starter ? (
              <>
                <span style={styles.lead}> at </span>
                <Blank
                  value={restaurant?.restaurant_name || null}
                  placeholder="Chinatown"
                  active={focus === "place"}
                  onActivate={() => setFocus("place")}
                />
              </>
            ) : null}
            {restaurant ? (
              <>
                <span style={styles.lead}> — </span>
                <Blank
                  value={dish?.item_name || null}
                  placeholder="menu item"
                  active={focus === "item"}
                  onActivate={() => setFocus("item")}
                />
              </>
            ) : null}
          </>
        ) : mode === "cooking" ? (
          <>
            <span style={styles.lead}>Cooking </span>
            <Blank
              value={homeFood || null}
              placeholder="what"
              active={focus === "home"}
              onActivate={() => setFocus("home")}
            />
            <span style={styles.lead}> @ home</span>
          </>
        ) : (
          <>
            <span style={styles.lead}>Eating at </span>
            <Blank
              value={restaurant?.restaurant_name || null}
              placeholder="restaurant"
              active={focus === "place"}
              onActivate={() => setFocus("place")}
            />
            <span style={styles.lead}> — </span>
            <Blank
              value={dish?.item_name || null}
              placeholder="menu item"
              active={focus === "item"}
              onActivate={() => {
                if (restaurant) setFocus("item");
              }}
            />
          </>
        )}
      </div>

      {isWant && focus === "starter" ? (
        <div style={styles.softRow} data-testid="status-line-starters">
          {WANNA_STARTERS.map((opt) => (
            <SoftPick
              key={opt.key}
              label={opt.label}
              onClick={() => {
                setStarter(opt);
                setRestaurant(null);
                setDish(null);
                setFocus("place");
              }}
            />
          ))}
        </div>
      ) : null}

      {!isWant && mode === "cooking" && focus === "home" ? (
        <div style={styles.softRow} data-testid="status-line-cooking-foods">
          {COOKING_FOODS.map((label) => (
            <SoftPick
              key={label}
              label={label}
              onClick={() => {
                setHomeFood(label);
                setFocus("");
              }}
            />
          ))}
        </div>
      ) : null}

      {focus === "place" && (isWant ? Boolean(starter) : mode === "out") ? (
        <div style={styles.searchBlock} data-testid="status-line-place-search">
          <input
            type="search"
            value={placeQuery}
            onChange={(ev) => setPlaceQuery(ev.target.value)}
            placeholder="Type a place…"
            style={styles.input}
            disabled={busy}
            autoFocus
          />
          {searching ? <div style={styles.hint}>Searching…</div> : null}
          <div style={styles.softRow}>
            {placeHits.map((row) => (
              <SoftPick
                key={`${row.restaurant_id || row.id}-${row.restaurant_name}`}
                label={row.restaurant_name || row.name}
                onClick={() => pickRestaurant(row)}
              />
            ))}
          </div>
          {isWant ? (
            <div style={styles.hint}>Or Post now — place is optional.</div>
          ) : null}
        </div>
      ) : null}

      {focus === "item" && restaurant ? (
        <div style={styles.searchBlock} data-testid="status-line-item-search">
          <input
            type="search"
            value={dishQuery}
            onChange={(ev) => setDishQuery(ev.target.value)}
            placeholder="Menu item…"
            style={styles.input}
            disabled={busy}
            autoFocus
          />
          {searching ? <div style={styles.hint}>Loading…</div> : null}
          <div style={styles.softRow}>
            {dishHits.map((row) => (
              <SoftPick
                key={`${row.menu_item_id || row.id}-${row.item_name}`}
                label={row.item_name || row.name}
                onClick={() => pickDish(row)}
              />
            ))}
          </div>
          {isWant ? (
            <div style={styles.hint}>Or Post now — dish is optional.</div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p style={styles.error} data-testid="status-line-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canPost || busy}
        style={{
          ...socialBtn.primary,
          ...styles.post,
          opacity: canPost && !busy ? 1 : 0.45,
        }}
        data-testid="status-line-post"
      >
        Post
      </button>
      <p style={styles.hint}>
        {isWant
          ? "Stop whenever — cuisine alone is enough. Multiplier/Post adds video."
          : mode === "cooking"
            ? "Say what you’re cooking. Multiplier/Post adds video."
            : "Restaurant then menu item. Multiplier/Post adds video."}
      </p>
    </form>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: 10,
    marginBottom: 12,
    padding: "12px 0",
  },
  modeRow: {
    display: "flex",
    gap: 14,
  },
  modeLink: {
    appearance: "none",
    border: "none",
    background: "transparent",
    padding: 0,
    font: "inherit",
    fontSize: 14,
    fontWeight: 600,
    color: "#94a3b8",
    cursor: "pointer",
  },
  modeLinkOn: {
    color: GREEN_MID,
    textDecoration: "underline",
    textUnderlineOffset: 3,
  },
  sentence: {
    fontSize: 17,
    lineHeight: 1.55,
    color: "#0f172a",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: 4,
  },
  lead: {
    color: "#64748b",
    fontWeight: 500,
  },
  blank: {
    appearance: "none",
    border: "none",
    borderBottom: "1.5px solid #cbd5e1",
    background: "transparent",
    padding: "2px 2px 1px",
    margin: 0,
    font: "inherit",
    fontSize: 17,
    color: "#94a3b8",
    cursor: "pointer",
    minWidth: 72,
    textAlign: "left",
  },
  blankActive: {
    borderBottomColor: GREEN_MID,
  },
  blankFilled: {
    color: "#0f172a",
    fontWeight: 700,
  },
  mutedInline: {
    color: "#94a3b8",
    fontWeight: 500,
  },
  softRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  softPick: {
    appearance: "none",
    border: "none",
    background: "transparent",
    padding: 0,
    font: "inherit",
    fontSize: 15,
    fontWeight: 600,
    color: GREEN_MID,
    cursor: "pointer",
  },
  searchBlock: {
    display: "grid",
    gap: 8,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    font: "inherit",
    fontSize: 15,
  },
  post: {
    justifySelf: "start",
    minWidth: 88,
  },
  hint: {
    margin: 0,
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.4,
  },
  error: {
    margin: 0,
    fontSize: 13,
    color: "#b91c1c",
  },
};
