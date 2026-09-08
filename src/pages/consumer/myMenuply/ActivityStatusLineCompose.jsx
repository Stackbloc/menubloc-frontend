/**
 * What I'm Eating — simple consumer compose.
 * Restaurant → "I'm eating @" opens restaurant + optional dish + meal time form.
 * @home → free-typed dish (not CK); emoji derived when we can.
 * What I Wanna Eat → same restaurant form or cuisine free-text stop-anytime.
 */

import { useState } from "react";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import { socialBtn } from "../../../lib/socialDesignTokens.js";
import EatingPlaceFields from "./EatingPlaceFields.jsx";
import { GREEN_MID } from "./myMenuplyStyles.js";

export default function ActivityStatusLineCompose({
  category = "ate",
  busy = false,
  followed = [],
  locationCity = null,
  locationState = null,
  onSubmit,
}) {
  const isWant = category === "want";
  const [mode, setMode] = useState("restaurant"); // restaurant | athome
  const [formOpen, setFormOpen] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [homemade, setHomemade] = useState(false);
  const [mealPeriod, setMealPeriod] = useState(defaultWhatIAteMealPeriod());
  const [homeText, setHomeText] = useState("");
  const [wantText, setWantText] = useState("");
  const [error, setError] = useState("");

  const homeEmoji = homeText.trim() ? iconForFoodText(homeText) : "";

  const canPostRestaurant = Boolean(restaurant);
  const canPostHome = Boolean(homeText.trim());
  const canPostWant = Boolean(wantText.trim() || restaurant);
  const canPost = isWant
    ? canPostWant
    : mode === "athome"
      ? canPostHome
      : canPostRestaurant;

  function reset() {
    setRestaurant(null);
    setDish(null);
    setHomemade(false);
    setHomeText("");
    setWantText("");
    setFormOpen(false);
    setMealPeriod(defaultWhatIAteMealPeriod());
    setError("");
  }

  async function handlePost(e) {
    e.preventDefault();
    setError("");
    if (!canPost || busy) return;
    try {
      if (isWant) {
        await onSubmit?.({
          category: "want",
          text: dish?.item_name || wantText.trim() || restaurant?.restaurant_name || "",
          wantKind: restaurant || dish ? null : "cuisine",
          foodInterestKey: null,
          homemade: false,
          restaurant: restaurant || null,
          dish: dish || null,
          mealPeriod: mealPeriod || null,
          file: null,
          marketDiscoverable: true,
        });
      } else if (mode === "athome") {
        await onSubmit?.({
          category: "ate",
          text: homeText.trim(),
          homemade: true,
          restaurant: null,
          dish: null,
          ateKind: "food_item",
          mealPeriod: mealPeriod || null,
          file: null,
          marketDiscoverable: true,
        });
      } else {
        await onSubmit?.({
          category: "ate",
          text: dish?.item_name || restaurant?.restaurant_name || "",
          homemade: false,
          restaurant,
          dish,
          ateKind: dish ? "menu_item" : "restaurant",
          mealPeriod: mealPeriod || null,
          file: null,
          marketDiscoverable: true,
        });
      }
      reset();
    } catch (err) {
      setError(err?.message || "Unable to post");
    }
  }

  if (isWant) {
    return (
      <form
        onSubmit={handlePost}
        style={styles.wrap}
        data-testid="wanna-status-line-compose"
      >
        <p style={styles.lead}>I wanna eat</p>
        <input
          type="text"
          value={wantText}
          onChange={(ev) => setWantText(ev.target.value.slice(0, 120))}
          placeholder="Chinese, sushi, burgers…"
          style={styles.textInput}
          disabled={busy}
          data-testid="wanna-free-text"
        />
        <button
          type="button"
          style={styles.linkOpen}
          onClick={() => setFormOpen((v) => !v)}
          disabled={busy}
        >
          {formOpen ? "Hide place" : "Add restaurant / dish (optional)"}
        </button>
        {formOpen ? (
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
            dishSearchPlaceholder="Dish (optional)"
          />
        ) : null}
        <MealRow mealPeriod={mealPeriod} setMealPeriod={setMealPeriod} busy={busy} />
        {error ? <p style={styles.error}>{error}</p> : null}
        <button
          type="submit"
          disabled={!canPost || busy}
          style={{ ...socialBtn.primary, ...styles.post, opacity: canPost && !busy ? 1 : 0.45 }}
          data-testid="status-line-post"
        >
          Post
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handlePost}
      style={styles.wrap}
      data-testid="eating-status-line-compose"
    >
      <div style={styles.modeRow} data-testid="eating-status-mode">
        <button
          type="button"
          style={{ ...styles.modeBtn, ...(mode === "restaurant" ? styles.modeBtnOn : null) }}
          onClick={() => {
            setMode("restaurant");
            setHomeText("");
            setFormOpen(false);
          }}
          disabled={busy}
        >
          Restaurant
        </button>
        <button
          type="button"
          style={{ ...styles.modeBtn, ...(mode === "athome" ? styles.modeBtnOn : null) }}
          onClick={() => {
            setMode("athome");
            setRestaurant(null);
            setDish(null);
            setFormOpen(false);
          }}
          disabled={busy}
        >
          @home
        </button>
      </div>

      {mode === "restaurant" ? (
        <>
          <button
            type="button"
            style={styles.imEatingAt}
            data-testid="im-eating-at-open"
            onClick={() => setFormOpen(true)}
            disabled={busy}
          >
            I&apos;m eating @
            {restaurant?.restaurant_name ? (
              <span style={styles.filledPlace}> {restaurant.restaurant_name}</span>
            ) : (
              <span style={styles.placeholder}> restaurant</span>
            )}
            {dish?.item_name ? (
              <span style={styles.filledDish}> — {dish.item_name}</span>
            ) : null}
          </button>
          {formOpen ? (
            <div style={styles.formPanel} data-testid="im-eating-at-form">
              <EatingPlaceFields
                homemade={homemade}
                onHomemadeChange={setHomemade}
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
                dishSearchPlaceholder="Dish (optional)"
              />
              <MealRow mealPeriod={mealPeriod} setMealPeriod={setMealPeriod} busy={busy} />
            </div>
          ) : null}
        </>
      ) : (
        <div style={styles.homeBlock} data-testid="eating-athome-compose">
          <label style={styles.homeLabel}>
            {homeEmoji ? <span aria-hidden="true">{homeEmoji} </span> : null}
            @home
          </label>
          <input
            type="text"
            value={homeText}
            onChange={(ev) => setHomeText(ev.target.value.slice(0, 160))}
            placeholder="What did you cook?"
            style={styles.textInput}
            disabled={busy}
            data-testid="athome-free-text"
          />
          <MealRow mealPeriod={mealPeriod} setMealPeriod={setMealPeriod} busy={busy} />
        </div>
      )}

      {error ? <p style={styles.error}>{error}</p> : null}
      <button
        type="submit"
        disabled={!canPost || busy}
        style={{ ...socialBtn.primary, ...styles.post, opacity: canPost && !busy ? 1 : 0.45 }}
        data-testid="status-line-post"
      >
        Post
      </button>
    </form>
  );
}

function MealRow({ mealPeriod, setMealPeriod, busy }) {
  return (
    <div style={styles.mealRow} data-testid="status-meal-period">
      {WHAT_I_ATE_MEAL_PERIODS.map((slot) => {
        const on = mealPeriod === slot.id;
        return (
          <button
            key={slot.id}
            type="button"
            disabled={busy}
            style={{ ...styles.mealChip, ...(on ? styles.mealChipOn : null) }}
            onClick={() => setMealPeriod(slot.id)}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  wrap: {
    display: "grid",
    gap: 12,
    marginBottom: 12,
    padding: "8px 0 12px",
  },
  modeRow: { display: "flex", gap: 8 },
  modeBtn: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999,
    padding: "8px 14px",
    font: "inherit",
    fontSize: 14,
    fontWeight: 650,
    color: "#64748b",
    cursor: "pointer",
  },
  modeBtnOn: {
    borderColor: GREEN_MID,
    color: GREEN_MID,
    background: "rgba(22, 163, 74, 0.08)",
  },
  imEatingAt: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 14,
    padding: "14px 16px",
    font: "inherit",
    fontSize: 17,
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "left",
    cursor: "pointer",
  },
  placeholder: { color: "#94a3b8", fontWeight: 500 },
  filledPlace: { color: GREEN_MID },
  filledDish: { color: "#0f172a", fontWeight: 650 },
  formPanel: {
    display: "grid",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    background: "#fff",
  },
  homeBlock: { display: "grid", gap: 8 },
  homeLabel: { fontSize: 15, fontWeight: 700, color: "#0f172a" },
  textInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "12px 14px",
    font: "inherit",
    fontSize: 16,
  },
  lead: { margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" },
  linkOpen: {
    appearance: "none",
    border: "none",
    background: "transparent",
    padding: 0,
    font: "inherit",
    fontSize: 13,
    fontWeight: 650,
    color: GREEN_MID,
    cursor: "pointer",
    textAlign: "left",
  },
  mealRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  mealChip: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 12px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 600,
    color: "#64748b",
    cursor: "pointer",
  },
  mealChipOn: {
    borderColor: GREEN_MID,
    color: GREEN_MID,
    background: "rgba(22, 163, 74, 0.08)",
  },
  post: { justifySelf: "start", minWidth: 88 },
  error: { margin: 0, fontSize: 13, color: "#b91c1c" },
};
