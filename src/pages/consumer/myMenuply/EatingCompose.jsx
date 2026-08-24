/**
 * Unified Eating compose — sheet-only creation (X → My Menuply).
 * Ate: media → restaurant/homemade → meal time → optional comment.
 * Want: intent kind → cuisine | restaurant | menu item | food item.
 */

import { useEffect, useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import {
  EATING_COMPOSE_CATEGORIES,
  WANT_INTENT_KINDS,
} from "./eatingHubUtils.js";
import EatingPlaceFields from "./EatingPlaceFields.jsx";
import {
  socialBtn,
  socialType,
} from "../../../lib/socialDesignTokens.js";
import { listMetaCuisines } from "../../../lib/consumerApi.js";

export default function EatingCompose({
  busy = false,
  testId = "eating-compose",
  defaultCategory = "ate",
  defaultMealPeriod = null,
  initialFile = null,
  mediaSource = "camera",
  openLibraryOnMount = false,
  onSubmit,
  onPlanSchedule,
  inSheet = false,
  followed = [],
  locationCity = null,
  locationState = null,
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [text, setText] = useState("");
  const [file, setFile] = useState(initialFile || null);
  const [mealPeriod, setMealPeriod] = useState(
    defaultMealPeriod || defaultWhatIAteMealPeriod()
  );
  const [homemade, setHomemade] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [wantKind, setWantKind] = useState("food_item");
  const [cuisineSlug, setCuisineSlug] = useState("");
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [cuisinesLoading, setCuisinesLoading] = useState(false);
  const [cuisinesError, setCuisinesError] = useState("");

  const meta =
    EATING_COMPOSE_CATEGORIES.find((c) => c.id === category) ||
    EATING_COMPOSE_CATEGORIES[0];

  const acceptMedia = category === "ate" || category === "want";

  const wantMeta =
    WANT_INTENT_KINDS.find((k) => k.id === wantKind) ||
    WANT_INTENT_KINDS[3];

  useEffect(() => {
    let cancelled = false;

    if (category !== "want" || wantKind !== "cuisine") {
      return undefined;
    }

    if (cuisineOptions.length > 0) {
      return undefined;
    }

    setCuisinesLoading(true);
    setCuisinesError("");

    listMetaCuisines()
      .then((data) => {
        if (cancelled) return;

        const rows = Array.isArray(data?.cuisines)
          ? data.cuisines
          : [];

        setCuisineOptions(
          rows
            .map((row) => ({
              value: String(
                row.value || row.slug || ""
              ).trim(),
              label: String(
                row.label ||
                  row.display_name ||
                  row.value ||
                  ""
              ).trim(),
            }))
            .filter((row) => row.value && row.label)
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setCuisinesError(
          err?.message || "Unable to load cuisines"
        );
      })
      .finally(() => {
        if (!cancelled) {
          setCuisinesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category, wantKind, cuisineOptions.length]);

  function resetPlace() {
    setHomemade(false);
    setRestaurant(null);
    setDish(null);
  }

  function selectWantKind(next) {
    setWantKind(next);
    resetPlace();
    setCuisineSlug("");

    if (next === "cuisine") {
      setText("");
      setHomemade(true);
    } else if (next === "food_item") {
      setHomemade(true);
    }
  }

  function selectCuisine(slug) {
    const next = String(slug || "").trim();

    setCuisineSlug(next);

    const match = cuisineOptions.find(
      (row) => row.value === next
    );

    setText(match?.label || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (category === "plan") {
      onPlanSchedule?.({
        text: String(text || "").trim(),
        homemade,
        restaurant,
        dish,
      });
      return;
    }

    const value = String(text || "").trim();

    if (category === "want") {
      const needsCuisine = wantKind === "cuisine";
      const needsText = wantKind === "food_item";
      const needsRestaurant =
        wantKind === "restaurant" ||
        wantKind === "menu_item";
      const needsDish = wantKind === "menu_item";

      if (needsCuisine && !cuisineSlug) return;
      if (needsText && !value) return;
      if (needsRestaurant && !restaurant) return;
      if (needsDish && !dish) return;

      await onSubmit({
        category,
        text: needsCuisine
          ? String(text || "").trim() || value
          : value,
        file,
        wantKind,
        cuisineSlug: needsCuisine
          ? cuisineSlug
          : null,
        homemade:
          wantKind === "cuisine" ||
          wantKind === "food_item",
        restaurant: needsRestaurant
          ? restaurant
          : null,
        dish: needsDish ? dish : null,
      });

      setText("");
      setFile(null);
      setCuisineSlug("");
      resetPlace();
      return;
    }

    if (
      !value &&
      !file &&
      !homemade &&
      !restaurant &&
      !dish
    ) {
      return;
    }

    await onSubmit({
      category,
      text: value,
      file,
      mealPeriod:
        category === "ate"
          ? mealPeriod
          : undefined,
      homemade,
      restaurant,
      dish,
    });

    setText("");
    setFile(null);
    resetPlace();
  }

  const canSubmit =
    category === "plan"
      ? true
      : category === "want"
        ? wantKind === "cuisine"
          ? Boolean(cuisineSlug)
          : wantKind === "food_item"
            ? Boolean(String(text).trim())
            : wantKind === "restaurant"
              ? Boolean(restaurant)
              : Boolean(restaurant && dish)
        : Boolean(
            String(text).trim() ||
              file ||
              homemade ||
              restaurant ||
              dish
          );

  /*
   * Camera mode:
   *
   * Explicitly use the device/browser native camera.
   *
   * Library mode:
   * Continue using the native file picker without capture.
   *
   * This prevents EatingCompose from opening the custom
   * ConsumerCameraSheet for the normal "Photo or video" flow.
   */
  const useNativeCamera = mediaSource !== "library";

  return (
    <div data-testid={testId} style={styles.wrap}>
      <div
        style={styles.chips}
        role="tablist"
        aria-label="Eating category"
      >
        {EATING_COMPOSE_CATEGORIES.map((chip) => {
          const active = chip.id === category;

          return (
            <button
              key={chip.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-testid={`eating-compose-${chip.id}`}
              disabled={busy}
              style={{
                ...styles.chip,
                ...(active
                  ? styles.chipActive
                  : null),
              }}
              onClick={() => {
                setCategory(chip.id);
                resetPlace();
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {meta.description ? (
        <p style={socialType.meta}>
          {meta.description}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} style={styles.form}>
        {acceptMedia ? (
          <div style={styles.mediaBlock}>
            <p style={styles.stepLabel}>
              Photo or video
            </p>

            <MenuplyMediaPicker
              file={file}
              onFile={setFile}
              onClear={() => setFile(null)}
              disabled={busy}
              facingMode="environment"
              source={
                mediaSource === "library"
                  ? "library"
                  : "camera"
              }
              useNativeCamera={useNativeCamera}
              openOnMount={Boolean(
                openLibraryOnMount &&
                  mediaSource === "library"
              )}
              allowPhoto
              allowVideo={
                category === "ate" ||
                category === "want"
              }
              testId="eating-compose-media"
              ariaLabel={
                mediaSource === "library"
                  ? "Upload photo or video from library"
                  : "Take photo or video"
              }
            />
          </div>
        ) : null}

        {category === "want" ? (
          <div
            style={styles.chips}
            role="group"
            aria-label="Want type"
          >
            {WANT_INTENT_KINDS.map((kind) => {
              const active =
                wantKind === kind.id;

              return (
                <button
                  key={kind.id}
                  type="button"
                  data-testid={`want-intent-${kind.id}`}
                  disabled={busy}
                  style={{
                    ...styles.chip,
                    ...(active
                      ? styles.chipActive
                      : null),
                  }}
                  onClick={() =>
                    selectWantKind(kind.id)
                  }
                >
                  {kind.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {category === "ate" ? (
          <>
            <p style={styles.stepLabel}>
              What is this?
            </p>

            <EatingPlaceFields
              homemade={homemade}
              onHomemadeChange={setHomemade}
              restaurant={restaurant}
              onRestaurantChange={setRestaurant}
              dish={dish}
              onDishChange={setDish}
              followed={followed}
              disabled={busy}
              locationCity={locationCity}
              locationState={locationState}
            />

            <p style={styles.stepLabel}>
              Meal time
            </p>

            <div
              style={styles.mealRow}
              role="group"
              aria-label="Meal time"
            >
              {WHAT_I_ATE_MEAL_PERIODS.map(
                (slot) => {
                  const active =
                    mealPeriod === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      data-testid={`eating-meal-${slot.id}`}
                      disabled={busy}
                      style={{
                        ...styles.mealChip,
                        ...(active
                          ? styles.mealChipActive
                          : null),
                      }}
                      onClick={() =>
                        setMealPeriod(slot.id)
                      }
                    >
                      {slot.label}
                    </button>
                  );
                }
              )}
            </div>

            <p style={styles.stepLabel}>
              Anything to say?
            </p>

            <input
              type="text"
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              placeholder={meta.placeholder}
              disabled={busy}
              maxLength={160}
              autoComplete="off"
              style={styles.input}
              data-testid="eating-compose-input"
            />
          </>
        ) : null}

        {category === "want" ? (
          <>
            {wantKind === "cuisine" ? (
              <div style={styles.cuisineBlock}>
                <label
                  htmlFor="want-cuisine-select"
                  style={styles.stepLabel}
                >
                  Cuisine
                </label>

                <select
                  id="want-cuisine-select"
                  value={cuisineSlug}
                  onChange={(e) =>
                    selectCuisine(e.target.value)
                  }
                  disabled={
                    busy || cuisinesLoading
                  }
                  style={styles.input}
                  data-testid="want-cuisine-select"
                >
                  <option value="">
                    {cuisinesLoading
                      ? "Loading cuisines…"
                      : "Select a cuisine"}
                  </option>

                  {cuisineOptions.map(
                    (opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </option>
                    )
                  )}
                </select>

                {cuisinesError ? (
                  <p
                    style={styles.cuisineError}
                    data-testid="want-cuisine-error"
                  >
                    {cuisinesError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {wantKind === "food_item" ? (
              <input
                type="text"
                value={text}
                onChange={(e) =>
                  setText(e.target.value)
                }
                placeholder={
                  wantMeta.placeholder
                }
                disabled={busy}
                maxLength={160}
                autoComplete="off"
                style={styles.input}
                data-testid="eating-compose-input"
              />
            ) : null}

            {wantKind === "restaurant" ||
            wantKind === "menu_item" ? (
              <EatingPlaceFields
                homemade={false}
                onHomemadeChange={() => {}}
                restaurant={restaurant}
                onRestaurantChange={
                  setRestaurant
                }
                dish={dish}
                onDishChange={setDish}
                followed={followed}
                disabled={busy}
                allowDishSearch={
                  wantKind === "menu_item"
                }
                allowHomemade={false}
                locationCity={locationCity}
                locationState={locationState}
              />
            ) : null}

            {wantKind === "restaurant" &&
            restaurant ? (
              <p
                style={{
                  ...socialType.meta,
                  margin: 0,
                }}
              >
                Want to try{" "}
                {restaurant.restaurant_name}
              </p>
            ) : null}
          </>
        ) : null}

        {category === "plan" ? (
          <>
            <input
              type="text"
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              placeholder={meta.placeholder}
              disabled={busy}
              maxLength={160}
              autoComplete="off"
              style={styles.input}
              data-testid="eating-compose-input"
            />

            <EatingPlaceFields
              homemade={homemade}
              onHomemadeChange={setHomemade}
              restaurant={restaurant}
              onRestaurantChange={setRestaurant}
              dish={dish}
              onDishChange={setDish}
              followed={followed}
              disabled={busy}
              locationCity={locationCity}
              locationState={locationState}
            />
          </>
        ) : null}

        <div
          style={
            inSheet
              ? styles.submitRow
              : styles.submitBlock
          }
        >
          <button
            type="submit"
            disabled={busy || !canSubmit}
            style={
              inSheet
                ? styles.submitBtn
                : socialBtn.primary
            }
          >
            {busy
              ? "…"
              : category === "plan"
                ? "Continue"
                : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  wrap: {
    margin: "0 0 12px",
  },

  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },

  chip: {
    appearance: "none",
    border:
      "1px solid rgba(60,60,67,0.18)",
    background:
      "rgba(120,120,128,0.08)",
    color: "#3C3C43",
    borderRadius: 999,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  chipActive: {
    background: "#1C1C1E",
    color: "#fff",
    borderColor: "#1C1C1E",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
  },

  mediaBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  stepLabel: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    color: "#475467",
    letterSpacing: "0.02em",
    textTransform: "uppercase",
  },

  cuisineBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  cuisineError: {
    margin: 0,
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    minHeight: 44,
    padding: "10px 14px",
    borderRadius: 12,
    border:
      "1px solid rgba(60,60,67,0.18)",
    fontSize: 15,
    fontFamily: "inherit",
    color: "#1C1C1E",
    background: "#fff",
    boxSizing: "border-box",
  },

  mealRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },

  mealChip: {
    appearance: "none",
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#475569",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  },

  mealChipActive: {
    background: "#ecfdf5",
    borderColor: "#86efac",
    color: "#166534",
  },

  submitRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 4,
  },

  submitBlock: {
    display: "flex",
    justifyContent: "stretch",
  },

  submitBtn: {
    appearance: "none",
    minHeight: 40,
    padding: "0 20px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(180deg, #22C55E 0%, #16A34A 100%)",
    color: "#0B0F0C",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
