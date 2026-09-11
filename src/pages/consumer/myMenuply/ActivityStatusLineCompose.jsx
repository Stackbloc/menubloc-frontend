/**
 * Compact category compose — Add trigger opens a small sheet with CK pickers.
 * Reuses EatingPlaceFields. No fill-in-the-blank sentence prompts.
 */

import { useEffect, useState } from "react";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { iconForFoodText } from "../../../lib/foodInterestIcons.js";
import { socialBtn } from "../../../lib/socialDesignTokens.js";
import EatingPlaceFields from "./EatingPlaceFields.jsx";
import { HAPPY_HOUR_INTENTS, happyHourFoodName } from "./eatingHubUtils.js";
import { GREEN_MID } from "./myMenuplyStyles.js";

export default function ActivityStatusLineCompose({
  category = "ate",
  busy = false,
  followed = [],
  locationCity = null,
  locationState = null,
  onSubmit,
  /** When true, parent owns the Add control (e.g. SectionHead aside). */
  hideTrigger = false,
  open: openProp = undefined,
  onOpenChange = null,
}) {
  const isWant = category === "want";
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const controlled = typeof openProp === "boolean";
  const open = controlled ? openProp : openUncontrolled;
  function setOpen(next) {
    if (!controlled) setOpenUncontrolled(next);
    onOpenChange?.(next);
  }
  const [mode, setMode] = useState("restaurant"); // restaurant | happy_hour | athome
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [mealPeriod, setMealPeriod] = useState(defaultWhatIAteMealPeriod());
  const [homeText, setHomeText] = useState("");
  const [wantText, setWantText] = useState("");
  const [extraItemNames, setExtraItemNames] = useState([]);
  const [happyHourIntent, setHappyHourIntent] = useState("enjoying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const homeEmoji = homeText.trim() ? iconForFoodText(homeText) : "";
  const canPostRestaurant = Boolean(restaurant);
  const canPostHome = Boolean(homeText.trim());
  const canPostHappyHour = Boolean(restaurant && happyHourIntent);
  const canPostWant = Boolean(wantText.trim() || restaurant);
  const canPost = isWant
    ? canPostWant
    : mode === "athome"
      ? canPostHome
      : mode === "happy_hour"
        ? canPostHappyHour
        : canPostRestaurant;

  function reset() {
    setRestaurant(null);
    setDish(null);
    setHomeText("");
    setWantText("");
    setExtraItemNames([]);
    setMode("restaurant");
    setHappyHourIntent("enjoying");
    setMealPeriod(defaultWhatIAteMealPeriod());
    setError("");
  }

  function close() {
    setOpen(false);
    reset();
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
        const extras = extraItemNames.map((name) => String(name || "").trim()).filter(Boolean);
        const primary = homeText.trim();
        await onSubmit?.({
          category: "ate",
          text: primary,
          homemade: true,
          restaurant: null,
          dish: null,
          ateKind: "food_item",
          mealPeriod: mealPeriod || null,
          file: null,
          marketDiscoverable: true,
          whereType: "home",
          items: [
            { food_name: primary },
            ...extras.map((food_name) => ({ food_name })),
          ],
        });
      } else if (mode === "happy_hour") {
        const foodName = happyHourFoodName(happyHourIntent);
        await onSubmit?.({
          category: "ate",
          text: foodName,
          homemade: false,
          restaurant,
          dish: null,
          ateKind: "restaurant",
          mealPeriod: mealPeriod || null,
          file: null,
          marketDiscoverable: true,
          whereType: "restaurant",
          items: [
            {
              food_name: foodName,
              restaurant_id: restaurant?.restaurant_id || null,
            },
          ],
        });
      } else {
        const extras = extraItemNames.map((name) => String(name || "").trim()).filter(Boolean);
        const primary = dish?.item_name || restaurant?.restaurant_name || "";
        await onSubmit?.({
          category: "ate",
          text: primary,
          homemade: false,
          restaurant,
          dish,
          ateKind: dish ? "menu_item" : "restaurant",
          mealPeriod: mealPeriod || null,
          file: null,
          marketDiscoverable: true,
          whereType: "restaurant",
          items: [
            {
              food_name: primary,
              menu_item_id: dish?.menu_item_id || null,
              restaurant_id: restaurant?.restaurant_id || null,
            },
            ...extras.map((food_name) => ({ food_name })),
          ],
        });
      }
      close();
    } catch (err) {
      setError(err?.message || "Unable to post");
    }
  }

  const triggerLabel = isWant ? "Add" : "Add";

  return (
    <div
      style={hideTrigger ? styles.wrapSheetOnly : styles.wrap}
      data-testid={isWant ? "wanna-status-line-compose" : "eating-status-line-compose"}
    >
      {!hideTrigger ? (
        <button
          type="button"
          style={styles.trigger}
          data-testid="status-compose-open"
          disabled={busy}
          onClick={() => setOpen(true)}
        >
          <span style={styles.triggerPlus} aria-hidden="true">
            +
          </span>
          {triggerLabel}
        </button>
      ) : null}

      {open ? (
        <div
          role="presentation"
          style={styles.backdrop}
          data-testid="status-compose-sheet"
          onClick={close}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-label={isWant ? "Wanna Eat" : "What I'm Eating"}
            style={styles.sheet}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handlePost}
          >
            <div style={styles.sheetHead}>
              <p style={styles.sheetTitle}>{isWant ? "Wanna Eat" : "What I'm Eating"}</p>
              <button type="button" style={styles.close} onClick={close} aria-label="Close">
                ✕
              </button>
            </div>

            {isWant ? (
              <>
                <input
                  type="text"
                  value={wantText}
                  onChange={(ev) => setWantText(ev.target.value.slice(0, 120))}
                  placeholder="Cuisine or dish (optional)"
                  style={styles.textInput}
                  disabled={busy}
                  data-testid="wanna-free-text"
                />
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
              </>
            ) : (
              <>
                <div style={styles.modeRow} data-testid="eating-status-mode">
                  <button
                    type="button"
                    style={{
                      ...styles.modeBtn,
                      ...(mode === "restaurant" ? styles.modeBtnOn : null),
                    }}
                    onClick={() => {
                      setMode("restaurant");
                      setHomeText("");
                    }}
                    disabled={busy}
                  >
                    Restaurant
                  </button>
                  <button
                    type="button"
                    data-testid="ate-where-happy-hour"
                    style={{
                      ...styles.modeBtn,
                      ...(mode === "happy_hour" ? styles.modeBtnOn : null),
                    }}
                    onClick={() => {
                      setMode("happy_hour");
                      setHomeText("");
                      setDish(null);
                      setHappyHourIntent((prev) => prev || "enjoying");
                    }}
                    disabled={busy}
                  >
                    Happy Hour
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.modeBtn,
                      ...(mode === "athome" ? styles.modeBtnOn : null),
                    }}
                    onClick={() => {
                      setMode("athome");
                      setRestaurant(null);
                      setDish(null);
                    }}
                    disabled={busy}
                  >
                    @home
                  </button>
                </div>

                {mode === "restaurant" ? (
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
                ) : mode === "happy_hour" ? (
                  <div data-testid="ate-happy-hour-compose">
                    <div
                      style={styles.modeRow}
                      role="group"
                      aria-label="Happy Hour status"
                      data-testid="ate-happy-hour-intents"
                    >
                      {HAPPY_HOUR_INTENTS.map((intent) => {
                        const on = happyHourIntent === intent.id;
                        return (
                          <button
                            key={intent.id}
                            type="button"
                            data-testid={`ate-happy-hour-${intent.id}`}
                            disabled={busy}
                            style={{
                              ...styles.modeBtn,
                              ...(on ? styles.modeBtnOn : null),
                            }}
                            onClick={() => setHappyHourIntent(intent.id)}
                          >
                            {intent.label}
                          </button>
                        );
                      })}
                    </div>
                    <EatingPlaceFields
                      homemade={false}
                      onHomemadeChange={() => {}}
                      restaurant={restaurant}
                      onRestaurantChange={setRestaurant}
                      dish={dish}
                      onDishChange={setDish}
                      followed={followed}
                      disabled={busy}
                      allowDishSearch={false}
                      allowHomemade={false}
                      locationCity={locationCity}
                      locationState={locationState}
                    />
                  </div>
                ) : (
                  <div data-testid="eating-athome-compose">
                    <label style={styles.homeLabel}>
                      {homeEmoji ? <span aria-hidden="true">{homeEmoji} </span> : null}
                      What did you cook?
                    </label>
                    <input
                      type="text"
                      value={homeText}
                      onChange={(ev) => setHomeText(ev.target.value.slice(0, 160))}
                      placeholder="e.g. pasta, eggs…"
                      style={styles.textInput}
                      disabled={busy}
                      data-testid="athome-free-text"
                    />
                  </div>
                )}
              </>
            )}

            {!isWant && mode !== "happy_hour" ? (
              <div data-testid="ate-multi-items">
                <p style={styles.extraLabel}>More items on this meal (optional)</p>
                {extraItemNames.map((name, index) => (
                  <div key={`extra-${index}`} style={styles.extraRow}>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const next = [...extraItemNames];
                        next[index] = e.target.value;
                        setExtraItemNames(next);
                      }}
                      placeholder={`Item ${index + 2}`}
                      disabled={busy}
                      maxLength={160}
                      style={styles.textInput}
                      data-testid={`ate-extra-item-${index}`}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      data-testid={`ate-extra-item-remove-${index}`}
                      onClick={() =>
                        setExtraItemNames((prev) => prev.filter((_, i) => i !== index))
                      }
                      style={styles.removeExtra}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {extraItemNames.length < 12 ? (
                  <button
                    type="button"
                    data-testid="ate-add-item"
                    disabled={busy}
                    onClick={() => setExtraItemNames((prev) => [...prev, ""])}
                    style={styles.addExtra}
                  >
                    + Add another item
                  </button>
                ) : null}
              </div>
            ) : null}

            {!isWant && mode === "happy_hour" ? null : (
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
            )}

            {error ? <p style={styles.error}>{error}</p> : null}

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
          </form>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  wrap: { margin: "0 0 8px" },
  wrapSheetOnly: { margin: 0 },
  trigger: {
    appearance: "none",
    border: "1px dashed #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    padding: "7px 14px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 700,
    color: GREEN_MID,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  },
  triggerPlus: {
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1,
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    zIndex: 80,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "88vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: "14px 16px 18px",
    display: "grid",
    gap: 12,
    boxShadow: "0 18px 50px rgba(15,23,42,0.25)",
  },
  sheetHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sheetTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
  },
  close: {
    appearance: "none",
    border: "none",
    background: "transparent",
    fontSize: 18,
    cursor: "pointer",
    color: "#64748b",
    padding: 4,
  },
  modeRow: { display: "flex", gap: 8 },
  modeBtn: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999,
    padding: "7px 12px",
    font: "inherit",
    fontSize: 13,
    fontWeight: 650,
    color: "#334155",
    cursor: "pointer",
  },
  modeBtnOn: {
    borderColor: GREEN_MID,
    background: "rgba(22, 163, 74, 0.08)",
    color: "#166534",
  },
  textInput: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    font: "inherit",
    fontSize: 15,
  },
  homeLabel: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 6,
  },
  extraLabel: {
    margin: "0 0 6px",
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
  },
  extraRow: {
    display: "flex",
    gap: 8,
    marginBottom: 6,
  },
  addExtra: {
    appearance: "none",
    border: "1px dashed #cbd5e1",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    font: "inherit",
    fontSize: 12,
    fontWeight: 700,
    color: GREEN_MID,
    cursor: "pointer",
  },
  removeExtra: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 10,
    padding: "8px 10px",
    font: "inherit",
    fontSize: 12,
    fontWeight: 650,
    color: "#64748b",
    cursor: "pointer",
    flexShrink: 0,
  },
  mealRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  mealChip: {
    appearance: "none",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: 999,
    padding: "6px 10px",
    font: "inherit",
    fontSize: 12,
    fontWeight: 650,
    color: "#475569",
    cursor: "pointer",
  },
  mealChipOn: {
    borderColor: GREEN_MID,
    background: "rgba(22, 163, 74, 0.1)",
    color: "#166534",
  },
  post: {
    width: "100%",
    justifyContent: "center",
    marginTop: 4,
  },
  error: { margin: 0, color: "#b91c1c", fontSize: 13, fontWeight: 650 },
};
