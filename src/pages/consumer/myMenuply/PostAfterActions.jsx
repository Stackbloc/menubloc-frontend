/**
 * After a simple eating post, or when a diner taps a posted item:
 * restaurant first, then that restaurant's menu item, homemade, notes, optional join seats.
 */

import { useEffect, useState } from "react";
import { asDishPlace, asRestaurantPlace, dishLabel, restaurantLabel } from "../../../lib/foodActivityApi.js";
import { followRestaurant, updateWhatIAteToday, updateWhatWeDoingSession, updateWantToEat } from "../../../lib/consumerApi.js";
import { WHAT_I_ATE_MEAL_PERIODS } from "../../../lib/whatIAteTodayMealPeriod.js";
import EatingPlaceFields from "./EatingPlaceFields.jsx";
import { joinHomemadeComment, splitHomemadeComment } from "./eatingPlaceLink.js";
import * as s from "./myMenuplyStyles.js";

export default function PostAfterActions({
  kind,
  record,
  busy = false,
  followed = [],
  locationCity = null,
  locationState = null,
  onTagged,
  onSkip,
}) {
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
    setError("");
  }, [record?.id, record?.token, record?.kind]);

  async function handleSave(e) {
    e.preventDefault();
    if (!record) return;
    setSaving(true);
    setError("");
    try {
      const mealLabel = WHAT_I_ATE_MEAL_PERIODS.find((p) => p.id === mealPeriod)?.label || "";
      if (kind === "plan") {
        const token = record.token || record.id;
        const placeLabel = homemade
          ? joinHomemadeComment(true, [dishLabel(dish), recipe.trim()].filter(Boolean).join(" · "))
          : [mealLabel, restaurantLabel(restaurant), dishLabel(dish), recipe.trim()]
              .filter(Boolean)
              .join(" · ") || undefined;
        await updateWhatWeDoingSession(token, {
          restaurant_id: homemade ? null : restaurant?.restaurant_id || undefined,
          place_label: placeLabel,
          joinable,
          join_capacity: joinable ? Number(joinCapacity) : undefined,
        });
        if (!homemade && restaurant?.restaurant_id) {
          try {
            await followRestaurant(restaurant.restaurant_id);
          } catch {
            /* ignore */
          }
        }
      } else if (kind === "want") {
        const data = await updateWantToEat(record.id, {
          restaurant_id: homemade ? null : restaurant?.restaurant_id || undefined,
          menu_item_id: homemade ? null : dish?.menu_item_id || undefined,
          food_name: homemade
            ? record.food_name
            : dishLabel(dish) || record.food_name || undefined,
          meal_period: mealPeriod || undefined,
          comment: joinHomemadeComment(homemade, recipe),
        });
        if (!homemade && restaurant?.restaurant_id) {
          try {
            await followRestaurant(restaurant.restaurant_id);
          } catch {
            /* ignore */
          }
        }
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
        if (!homemade && restaurant?.restaurant_id) {
          try {
            await followRestaurant(restaurant.restaurant_id);
          } catch {
            /* ignore */
          }
        }
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

  const canSave = Boolean(
    homemade || restaurant || dish || recipe.trim() || mealPeriod || (kind === "plan" && joinable)
  );
  const disabled = busy || saving;
  const isWant = kind === "want";

  return (
    <form onSubmit={handleSave} data-testid="post-after-actions" style={styles.form}>
      <div style={styles.kicker}>{isWant ? "Link restaurant and menu item" : "Add optional details"}</div>
      <p style={s.muted}>
        Photo or video is yours. Linking a restaurant and menu item is the metadata that makes it findable.
        Skip anytime.
      </p>
      <EatingPlaceFields
        homemade={homemade}
        onHomemadeChange={setHomemade}
        restaurant={restaurant}
        onRestaurantChange={setRestaurant}
        dish={dish}
        onDishChange={setDish}
        followed={followed}
        disabled={disabled}
        locationCity={locationCity}
        locationState={locationState}
        dishSearchPlaceholder="Tag a dish"
      />
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
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
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
  num: {
    width: 72,
    minHeight: 36,
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    padding: "0 8px",
    font: "inherit",
  },
};
