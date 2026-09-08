/**
 * In-section What I'm Eating compose — no video, no free-text food name.
 * Meal period + Common Knowledge restaurant + menu item only.
 * Video posts still go through Multiplier/Post (Feed X).
 */

import { useState } from "react";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { socialBtn } from "../../../lib/socialDesignTokens.js";
import EatingPlaceFields from "./EatingPlaceFields.jsx";
import { GREEN_MID } from "./myMenuplyStyles.js";

export default function EatingActivityCompose({
  busy = false,
  followed = [],
  locationCity = null,
  locationState = null,
  defaultMealPeriod = null,
  onSubmit,
}) {
  const [mealPeriod, setMealPeriod] = useState(
    defaultMealPeriod || defaultWhatIAteMealPeriod()
  );
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [error, setError] = useState("");

  const canPost = Boolean(
    restaurant?.restaurant_id && dish?.menu_item_id && mealPeriod && !busy
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!restaurant?.restaurant_id || !dish?.menu_item_id) {
      setError("Pick a restaurant and menu item from Menuply (Common Knowledge).");
      return;
    }
    if (!mealPeriod) {
      setError("Choose a meal time.");
      return;
    }
    try {
      await onSubmit?.({
        mealPeriod,
        restaurant,
        dish,
        ateKind: "menu_item",
        homemade: false,
        file: null,
        text: "",
        marketDiscoverable: true,
      });
      setDish(null);
      setRestaurant(null);
      setMealPeriod(defaultWhatIAteMealPeriod());
    } catch (err) {
      setError(err?.message || "Unable to post");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={styles.wrap}
      data-testid="eating-activity-compose"
    >
      <p style={styles.lead}>
        Share what you&apos;re eating with emoji metadata — no video required. Use Multiplier/Post
        when you want a Feed video.
      </p>

      <p style={styles.label}>Meal time</p>
      <div style={styles.chipRow} data-testid="eating-activity-meal-periods">
        {WHAT_I_ATE_MEAL_PERIODS.map((slot) => {
          const active = mealPeriod === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              style={{ ...styles.chip, ...(active ? styles.chipActive : null) }}
              aria-pressed={active}
              disabled={busy}
              onClick={() => setMealPeriod(slot.id)}
            >
              {slot.label}
            </button>
          );
        })}
      </div>

      <p style={styles.label}>Restaurant &amp; menu item</p>
      <EatingPlaceFields
        homemade={false}
        onHomemadeChange={() => {}}
        restaurant={restaurant}
        onRestaurantChange={setRestaurant}
        dish={dish}
        onDishChange={setDish}
        followed={followed}
        disabled={busy}
        allowDishSearch
        allowHomemade={false}
        locationCity={locationCity}
        locationState={locationState}
        dishSearchPlaceholder="Search menu item (required)"
      />

      {error ? (
        <p style={styles.error} data-testid="eating-activity-compose-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canPost}
        style={socialBtn.primary}
        data-testid="eating-activity-post"
      >
        {busy ? "…" : "Post"}
      </button>
    </form>
  );
}

const styles = {
  wrap: {
    margin: "12px 0 16px",
    padding: "12px 12px 14px",
    borderRadius: 12,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    display: "grid",
    gap: 10,
  },
  lead: {
    margin: 0,
    fontSize: 13,
    color: "#475569",
    lineHeight: 1.4,
  },
  label: {
    margin: 0,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: GREEN_MID,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    appearance: "none",
    border: "1px solid #d1fae5",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    color: "#166534",
    cursor: "pointer",
  },
  chipActive: {
    borderColor: "#16a34a",
    background: "#dcfce7",
    color: "#14532d",
  },
  error: {
    margin: 0,
    fontSize: 13,
    color: "#b91c1c",
  },
};
