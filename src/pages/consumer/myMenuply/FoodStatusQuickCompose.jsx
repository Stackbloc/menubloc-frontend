/**
 * Tiny food-status control — not a form.
 * Tap Ate / Wanna Eat → tap a food chip → Post.
 * Meal period auto. Food emoji derived later from the key/text.
 * Video still goes through Multiplier/Post.
 */

import { useState } from "react";
import {
  FAVORITE_FOOD_TYPE_OPTIONS,
  FAVORITE_CUISINE_OPTIONS,
} from "../../../lib/dinerFavoriteFoods.js";
import { iconForFoodInterest } from "../../../lib/foodInterestIcons.js";
import {
  QUICK_STATUS_ACTIONS,
} from "../../../lib/dinerSocialEmojiLanguage.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";
import { socialBtn } from "../../../lib/socialDesignTokens.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

const FOOD_CHIPS = [
  ...FAVORITE_FOOD_TYPE_OPTIONS.slice(0, 8),
  ...FAVORITE_CUISINE_OPTIONS.filter((c) =>
    ["italian", "mexican", "korean", "japanese"].includes(c.key)
  ),
];

export default function FoodStatusQuickCompose({ busy = false, onSubmit }) {
  const [action, setAction] = useState("ate");
  const [foodKey, setFoodKey] = useState(null);
  const [error, setError] = useState("");

  const selected = FOOD_CHIPS.find((f) => f.key === foodKey) || null;
  const canPost = Boolean(selected && action && !busy);

  async function handlePost(e) {
    e.preventDefault();
    setError("");
    if (!selected) {
      setError("Tap a food.");
      return;
    }
    try {
      const category = action === "want" ? "want" : "ate";
      await onSubmit?.({
        category,
        mealPeriod: defaultWhatIAteMealPeriod(),
        ateKind: "food_item",
        wantKind: "food_item",
        foodInterestKey: selected.key,
        text: selected.label,
        homemade: false,
        restaurant: null,
        dish: null,
        file: null,
        marketDiscoverable: true,
      });
      setFoodKey(null);
    } catch (err) {
      setError(err?.message || "Unable to post");
    }
  }

  return (
    <form
      onSubmit={handlePost}
      style={styles.wrap}
      data-testid="food-status-quick-compose"
    >
      <div style={styles.actionRow} data-testid="food-status-actions">
        {QUICK_STATUS_ACTIONS.map((slot) => {
          const active = action === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              style={{ ...styles.actionChip, ...(active ? styles.actionChipOn : null) }}
              aria-pressed={active}
              disabled={busy}
              onClick={() => setAction(slot.id)}
            >
              {slot.emoji} {slot.label}
            </button>
          );
        })}
      </div>

      <div style={styles.foodRow} data-testid="food-status-food-chips">
        {FOOD_CHIPS.map((food) => {
          const active = foodKey === food.key;
          return (
            <button
              key={food.key}
              type="button"
              style={{ ...styles.foodChip, ...(active ? styles.foodChipOn : null) }}
              aria-pressed={active}
              disabled={busy}
              onClick={() => setFoodKey(food.key)}
            >
              {iconForFoodInterest(food.key)} {food.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <p style={styles.error} data-testid="food-status-quick-error">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canPost}
        style={{
          ...socialBtn("primary"),
          ...styles.post,
          opacity: canPost ? 1 : 0.45,
        }}
        data-testid="food-status-quick-post"
      >
        {busy ? "…" : "Post"}
      </button>
    </form>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: 10,
    margin: "0 0 12px",
    padding: "10px 0 4px",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  actionChip: {
    appearance: "none",
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    cursor: "pointer",
  },
  actionChipOn: {
    borderColor: GREEN_MID,
    background: "rgba(22, 163, 74, 0.1)",
    color: "#14532d",
  },
  foodRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  foodChip: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 999,
    padding: "5px 10px",
    fontSize: 12,
    fontWeight: 650,
    color: "#0f172a",
    cursor: "pointer",
  },
  foodChipOn: {
    borderColor: GREEN_MID,
    background: "#fff",
    boxShadow: `inset 0 0 0 1px ${GREEN_MID}`,
  },
  post: {
    justifySelf: "start",
    minWidth: 88,
  },
  error: {
    margin: 0,
    fontSize: 12,
    color: "#b91c1c",
  },
};
