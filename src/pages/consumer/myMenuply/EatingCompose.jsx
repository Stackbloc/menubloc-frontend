/**
 * Unified Eating compose — sheet-only creation (X → My Menuply).
 * Ate: Where (restaurant | @home) → What → meal type → time → optional video.
 * Multiplier compose=ate uses the same sheet / same what_i_ate_today row.
 * Want: intent kind → cuisine | restaurant | menu item | food item.
 */

import { useEffect, useState } from "react";
import MenuplyMediaPicker from "../../../components/social/MenuplyMediaPicker.jsx";
import {
  WHAT_I_ATE_MEAL_PERIODS,
  defaultWhatIAteMealPeriod,
} from "../../../lib/whatIAteTodayMealPeriod.js";
import { isVideoFile } from "../../../lib/eatingMediaUtils.js";
import {
  EATING_COMPOSE_CATEGORIES,
  WANT_INTENT_KINDS,
  ATE_SIGNAL_KINDS,
} from "./eatingHubUtils.js";
import { FAVORITE_FOOD_TYPE_OPTIONS } from "../../../lib/dinerFavoriteFoods.js";
import { labelWithFoodIcon } from "../../../lib/foodInterestIcons.js";
import { isAteLikeFeedCategory, isCookingFeedCategory } from "../../../lib/feedContentKinds.js";
import EatingPlaceFields from "./EatingPlaceFields.jsx";
import InviteMeOutAudiencePicker from "./InviteMeOutAudiencePicker.jsx";
import {
  socialBtn,
  socialType,
} from "../../../lib/socialDesignTokens.js";
import { listMetaCuisines } from "../../../lib/consumerApi.js";

export default function EatingCompose({
  busy = false,
  uploadPercent = null,
  testId = "eating-compose",
  defaultCategory = "ate",
  defaultMealPeriod = null,
  initialFile = null,
  mediaSource = "camera",
  openLibraryOnMount = false,
  feedMode = false,
  onSubmit,
  onPlanSchedule,
  inSheet = false,
  followed = [],
  locationCity = null,
  locationState = null,
  inviteMeOutOpen: inviteMeOutOpenInitial = false,
  inviteMeOutAudience: inviteMeOutAudienceInitial = "connections",
  inviteMeOutSelectedIds: inviteMeOutSelectedIdsInitial = [],
  inviteMeOutCandidates = [],
}) {
  const [category, setCategory] = useState(defaultCategory);
  const [text, setText] = useState("");
  const [file, setFile] = useState(initialFile || null);
  const [mealPeriod, setMealPeriod] = useState(
    defaultMealPeriod || defaultWhatIAteMealPeriod()
  );
  const [homemade, setHomemade] = useState(false);
  const [whereType, setWhereType] = useState(null); // restaurant | home
  const [portionAmount, setPortionAmount] = useState("");
  const [restaurant, setRestaurant] = useState(null);
  const [dish, setDish] = useState(null);
  const [wantKind, setWantKind] = useState("food_item");
  const [ateKind, setAteKind] = useState("food_item");
  const [foodInterestKey, setFoodInterestKey] = useState("");
  const [cuisineSlug, setCuisineSlug] = useState("");
  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [cuisinesLoading, setCuisinesLoading] = useState(false);
  const [cuisinesError, setCuisinesError] = useState("");
  const [inviteMeOutOpen, setInviteMeOutOpen] = useState(Boolean(inviteMeOutOpenInitial));
  const [inviteMeOutAudience, setInviteMeOutAudience] = useState(
    inviteMeOutAudienceInitial === "selected" ? "selected" : "connections"
  );
  const [inviteMeOutSelectedIds, setInviteMeOutSelectedIds] = useState(
    Array.isArray(inviteMeOutSelectedIdsInitial) ? inviteMeOutSelectedIdsInitial : []
  );
  const [isRecommend, setIsRecommend] = useState(false);
  /** Extra food names on the same meal (primary is `text` / dish). */
  const [extraItemNames, setExtraItemNames] = useState([]);

  useEffect(() => {
    if (!isVideoFile(file)) setIsRecommend(false);
  }, [file]);

  useEffect(() => {
    if (category === "reviews") {
      setHomemade(false);
    }
    if (isCookingFeedCategory(category)) {
      setHomemade(true);
    }
  }, [category]);

  const meta =
    EATING_COMPOSE_CATEGORIES.find((c) => c.id === category) ||
    EATING_COMPOSE_CATEGORIES[0];

  const acceptMedia =
    isAteLikeFeedCategory(category) ||
    isCookingFeedCategory(category) ||
    category === "want" ||
    category === "plan";

  const wantMeta =
    WANT_INTENT_KINDS.find((k) => k.id === wantKind) ||
    WANT_INTENT_KINDS[1];

  const ateMeta =
    ATE_SIGNAL_KINDS.find((k) => k.id === ateKind) ||
    ATE_SIGNAL_KINDS[1];

  const needsCuisineCatalog =
    (category === "want" && wantKind === "cuisine") ||
    (category === "ate" && !feedMode && ateKind === "cuisine");

  useEffect(() => {
    let cancelled = false;

    if (!needsCuisineCatalog) {
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
  }, [needsCuisineCatalog, cuisineOptions.length]);

  function resetPlace() {
    setHomemade(false);
    setRestaurant(null);
    setDish(null);
    setWhereType(null);
    setPortionAmount("");
  }

  function selectWhere(next) {
    const where = next === "home" ? "home" : "restaurant";
    setWhereType(where);
    setRestaurant(null);
    setDish(null);
    setPortionAmount("");
    if (where === "home") {
      setHomemade(true);
      if (ateKind === "restaurant" || ateKind === "menu_item") {
        setAteKind("food_item");
      }
    } else {
      setHomemade(false);
      if (ateKind === "cuisine" || ateKind === "food_item") {
        setAteKind("restaurant");
      }
    }
  }

  function selectWantKind(next) {
    setWantKind(next);
    resetPlace();
    setCuisineSlug("");
    setFoodInterestKey("");

    if (next === "cuisine") {
      setText("");
      setHomemade(true);
    } else if (next === "food_item") {
      setHomemade(true);
    }
  }

  function selectAteKind(next) {
    setAteKind(next);
    setRestaurant(null);
    setDish(null);
    setCuisineSlug("");
    setFoodInterestKey("");

    if (next === "cuisine" || next === "food_item") {
      setHomemade(true);
      setWhereType("home");
      if (next === "cuisine") setText("");
    } else {
      setHomemade(false);
      setWhereType("restaurant");
      setPortionAmount("");
    }
  }

  function selectFoodTypeChip(opt) {
    setFoodInterestKey(opt.key);
    setText(opt.label);
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
        file,
      });
      return;
    }

    const value = String(text || "").trim();

    if (category === "want") {
      if (feedMode) {
        if (!isVideoFile(file)) return;
        await onSubmit({
          category,
          text: value,
          file,
          wantKind: "food_item",
          homemade: !restaurant && !dish,
          restaurant: restaurant || null,
          dish: dish || null,
        });
        setText("");
        setFile(null);
        resetPlace();
        return;
      }

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
      if (
        inviteMeOutOpen &&
        inviteMeOutAudience === "selected" &&
        inviteMeOutSelectedIds.length === 0
      ) {
        return;
      }

      await onSubmit({
        category,
        text: needsCuisine
          ? String(text || "").trim() || value
          : value,
        file,
        wantKind,
        foodInterestKey:
          wantKind === "food_item"
            ? foodInterestKey || null
            : wantKind === "cuisine"
              ? cuisineSlug || null
              : null,
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
        inviteMeOutOpen,
        inviteMeOutAudience,
        inviteMeOutSelectedIds,
      });

      setText("");
      setFile(null);
      setCuisineSlug("");
      setFoodInterestKey("");
      resetPlace();
      return;
    }

    if (feedMode && !isVideoFile(file)) {
      return;
    }

    if (category === "ate" && !feedMode) {
      const needsRestaurant =
        ateKind === "restaurant" || ateKind === "menu_item";
      const needsDish = ateKind === "menu_item";
      const needsCuisine = ateKind === "cuisine";
      const resolvedWhere =
        whereType ||
        (needsRestaurant ? "restaurant" : "home");
      if (!whereType && !needsRestaurant && ateKind !== "cuisine" && ateKind !== "food_item") {
        return;
      }
      if (needsCuisine && !cuisineSlug) return;
      if (ateKind === "food_item" && !value) return;
      if (needsRestaurant && !restaurant) return;
      if (needsDish && !(restaurant && dish)) return;

      const portionNum = Number(portionAmount);
      const primaryName =
        ateKind === "restaurant"
          ? restaurant?.restaurant_name || value
          : ateKind === "menu_item"
            ? dish?.item_name || value
            : value;
      const mealItems = [
        {
          food_name: primaryName,
          menu_item_id: needsDish ? dish?.menu_item_id : null,
          restaurant_id: needsRestaurant ? restaurant?.restaurant_id : null,
        },
        ...extraItemNames
          .map((name) => String(name || "").trim())
          .filter(Boolean)
          .map((food_name) => ({ food_name })),
      ];
      await onSubmit({
        category,
        text: primaryName,
        file,
        mealPeriod,
        ateKind,
        items: mealItems,
        foodInterestKey:
          ateKind === "food_item"
            ? foodInterestKey || null
            : ateKind === "cuisine"
              ? cuisineSlug || null
              : null,
        cuisineSlug: needsCuisine ? cuisineSlug : null,
        whereType: resolvedWhere,
        portionAmount:
          resolvedWhere === "home" && Number.isFinite(portionNum) && portionNum > 0
            ? portionNum
            : null,
        portionUnit: "serving",
        eatenAt: new Date().toISOString(),
        homemade:
          resolvedWhere === "home" ||
          ateKind === "cuisine" ||
          ateKind === "food_item",
        restaurant: needsRestaurant ? restaurant : null,
        dish: needsDish ? dish : null,
        isRecommend:
          isVideoFile(file) &&
          (ateKind === "restaurant" || ateKind === "menu_item")
            ? isRecommend
            : false,
      });

      setText("");
      setFile(null);
      setCuisineSlug("");
      setFoodInterestKey("");
      setIsRecommend(false);
      setExtraItemNames([]);
      resetPlace();
      return;
    }

    if (feedMode && isAteLikeFeedCategory(category)) {
      if (!whereType && !homemade && !(restaurant || dish)) {
        return;
      }
    }

    if (
      !feedMode &&
      !value &&
      !file &&
      !homemade &&
      !restaurant &&
      !dish
    ) {
      return;
    }

    const feedHomemade = isCookingFeedCategory(category)
      ? true
      : category === "reviews"
        ? false
        : homemade || whereType === "home";
    const feedWhere =
      category === "ate" || isAteLikeFeedCategory(category)
        ? whereType === "home" || whereType === "restaurant"
          ? whereType
          : feedHomemade
            ? "home"
            : restaurant || dish
              ? "restaurant"
              : whereType
        : null;
    const portionNum = Number(portionAmount);
    const feedPrimary =
      String(dish?.item_name || "").trim() ||
      String(restaurant?.restaurant_name || "").trim() ||
      value ||
      (feedHomemade ? "Homemade" : "Food");
    const feedItems = [
      {
        food_name: feedPrimary,
        menu_item_id: dish?.menu_item_id || null,
        restaurant_id: restaurant?.restaurant_id || dish?.restaurant_id || null,
      },
      ...extraItemNames
        .map((name) => String(name || "").trim())
        .filter(Boolean)
        .map((food_name) => ({ food_name })),
    ];
    await onSubmit({
      category,
      text: value,
      file,
      mealPeriod:
        isAteLikeFeedCategory(category)
          ? mealPeriod
          : undefined,
      whereType: feedWhere,
      items: isAteLikeFeedCategory(category) ? feedItems : undefined,
      portionAmount:
        feedWhere === "home" && Number.isFinite(portionNum) && portionNum > 0
          ? portionNum
          : null,
      portionUnit: "serving",
      eatenAt: new Date().toISOString(),
      homemade: feedHomemade,
      restaurant,
      dish,
      isRecommend:
        category === "ate" && isVideoFile(file)
          ? isRecommend
          : false,
    });

    setText("");
    setFile(null);
    setIsRecommend(false);
    setExtraItemNames([]);
    resetPlace();
  }

  const canSubmit =
    feedMode &&
    (isAteLikeFeedCategory(category) ||
      isCookingFeedCategory(category) ||
      category === "want")
      ? isVideoFile(file) &&
        (category !== "reviews" || Boolean(dish?.menu_item_id)) &&
        (category !== "ate" ||
          Boolean(whereType || homemade || restaurant || dish))
      : category === "plan"
        ? true
        : category === "want"
          ? (wantKind === "cuisine"
              ? Boolean(cuisineSlug)
              : wantKind === "food_item"
                ? Boolean(String(text).trim())
                : wantKind === "restaurant"
                  ? Boolean(restaurant)
                  : Boolean(restaurant && dish)) &&
            !(
              inviteMeOutOpen &&
              inviteMeOutAudience === "selected" &&
              inviteMeOutSelectedIds.length === 0
            )
          : category === "ate"
            ? Boolean(whereType) &&
              (ateKind === "cuisine"
                ? Boolean(cuisineSlug)
                : ateKind === "food_item"
                  ? Boolean(String(text).trim())
                  : ateKind === "restaurant"
                    ? Boolean(restaurant)
                    : Boolean(restaurant && dish))
            : Boolean(
                String(text).trim() ||
                  file ||
                  homemade ||
                  restaurant ||
                  dish
              );

  /*
   * Camera behavior (hybrid sheet):
   * Photo → ConsumerCameraSheet getUserMedia snap.
   * Video → desktop MediaRecorder; phone OS camera (<input capture>).
   * Library mode uses the native file picker for both.
   */

  return (
    <div data-testid={testId} style={styles.wrap} data-feed-mode={feedMode ? "1" : undefined}>
      {!feedMode ? (
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
      ) : null}

      {!feedMode && meta.description ? (
        <p style={socialType.meta}>
          {meta.description}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} style={styles.form}>
        {acceptMedia ? (
          <div style={styles.mediaBlock}>
            <p style={styles.stepLabel}>
              {feedMode
                ? "Record video"
                : category === "ate"
                  ? "Video (core) or photo"
                  : "Photo or video"}
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
              openOnMount={
                !initialFile &&
                (mediaSource === "camera" ||
                  Boolean(
                    openLibraryOnMount &&
                      mediaSource === "library"
                  ))
              }
              allowPhoto={!feedMode}
              allowVideo={acceptMedia}
              testId="eating-compose-media"
              ariaLabel={
                feedMode
                  ? "Record video for Feed"
                  : mediaSource === "library"
                    ? "Upload photo or video from library"
                    : "Take photo or video"
              }
            />
          </div>
        ) : null}

        {isCookingFeedCategory(category) ? (
          <>
            <p style={styles.stepLabel}>{feedMode ? "Caption (optional)" : "Dish name (optional)"}</p>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={meta.placeholder}
              disabled={busy}
              maxLength={160}
              autoComplete="off"
              style={styles.input}
              data-testid="eating-compose-cooking-input"
            />
          </>
        ) : null}

        {category === "want" && !feedMode ? (
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
                  {kind.icon ? `${kind.icon} ` : ""}
                  {kind.label}
                </button>
              );
            })}
          </div>
        ) : null}

        {category === "ate" && !feedMode ? (
          <>
            <div data-testid="ate-where-step">
              <p style={styles.stepLabel}>Where</p>
              <div style={styles.chips} role="group" aria-label="Where did you eat">
                <button
                  type="button"
                  data-testid="ate-where-restaurant"
                  disabled={busy}
                  style={{
                    ...styles.chip,
                    ...(whereType === "restaurant" ? styles.chipActive : null),
                  }}
                  onClick={() => selectWhere("restaurant")}
                >
                  Restaurant
                </button>
                <button
                  type="button"
                  data-testid="ate-where-home"
                  disabled={busy}
                  style={{
                    ...styles.chip,
                    ...(whereType === "home" ? styles.chipActive : null),
                  }}
                  onClick={() => selectWhere("home")}
                >
                  @Home
                </button>
              </div>
              <p style={styles.hint}>Pick where before what — restaurant menu or home recipe.</p>
            </div>

            {whereType ? (
            <div
              style={styles.chips}
              role="group"
              aria-label="Eating signal type"
            >
              {ATE_SIGNAL_KINDS.filter((kind) =>
                whereType === "home"
                  ? kind.id === "cuisine" || kind.id === "food_item"
                  : kind.id === "restaurant" || kind.id === "menu_item"
              ).map((kind) => {
                const active = ateKind === kind.id;
                return (
                  <button
                    key={kind.id}
                    type="button"
                    data-testid={`ate-signal-${kind.id}`}
                    disabled={busy}
                    style={{
                      ...styles.chip,
                      ...(active ? styles.chipActive : null),
                    }}
                    onClick={() => selectAteKind(kind.id)}
                  >
                    {kind.icon ? `${kind.icon} ` : ""}
                    {kind.label}
                  </button>
                );
              })}
            </div>
            ) : null}

            {whereType === "home" ? (
              <div style={{ marginTop: 8 }} data-testid="ate-home-portion">
                <label htmlFor="ate-portion-amount" style={styles.stepLabel}>
                  Portion eaten (optional)
                </label>
                <input
                  id="ate-portion-amount"
                  type="number"
                  min="0.1"
                  step="0.25"
                  inputMode="decimal"
                  value={portionAmount}
                  onChange={(e) => setPortionAmount(e.target.value)}
                  placeholder="e.g. 1 serving"
                  disabled={busy}
                  style={styles.input}
                  data-testid="ate-portion-amount"
                />
                <p style={styles.hint}>
                  Optional — recipe nutrition is enrichment only, never required to save.
                </p>
              </div>
            ) : null}

            {ateKind === "cuisine" && whereType === "home" ? (
              <div style={styles.cuisineBlock}>
                <label htmlFor="ate-cuisine-select" style={styles.stepLabel}>
                  Cuisine
                </label>
                <select
                  id="ate-cuisine-select"
                  value={cuisineSlug}
                  onChange={(e) => selectCuisine(e.target.value)}
                  disabled={busy || cuisinesLoading}
                  style={styles.input}
                  data-testid="ate-cuisine-select"
                >
                  <option value="">
                    {cuisinesLoading ? "Loading…" : "Select cuisine"}
                  </option>
                  {cuisineOptions.map((row) => (
                    <option key={row.value} value={row.value}>
                      {row.label}
                    </option>
                  ))}
                </select>
                {cuisinesError ? <p style={styles.hint}>{cuisinesError}</p> : null}
                <p style={styles.hint}>
                  Homemade / @ home cuisine signal — e.g. 🍣 Sushi @ Home when you add video.
                </p>
              </div>
            ) : null}

            {ateKind === "food_item" && whereType === "home" ? (
              <div>
                <p style={styles.stepLabel}>Food type</p>
                <div style={styles.chips} role="group" aria-label="Food types">
                  {FAVORITE_FOOD_TYPE_OPTIONS.map((opt) => {
                    const active = foodInterestKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        data-testid={`ate-food-type-${opt.key}`}
                        disabled={busy}
                        style={{
                          ...styles.chip,
                          ...(active ? styles.chipActive : null),
                        }}
                        onClick={() => selectFoodTypeChip(opt)}
                      >
                        {labelWithFoodIcon(opt.key, opt.label)}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setFoodInterestKey("");
                  }}
                  placeholder="Or type what you're eating"
                  disabled={busy}
                  maxLength={160}
                  autoComplete="off"
                  style={{ ...styles.input, marginTop: 8 }}
                  data-testid="eating-compose-input"
                />
                <p style={styles.hint}>
                  Video turns this into Feed discovery — not just a diary note.
                </p>
              </div>
            ) : null}

            {(ateKind === "restaurant" || ateKind === "menu_item") &&
            whereType === "restaurant" ? (
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
              />
            ) : null}

            {(ateKind === "restaurant" || ateKind === "menu_item") &&
            whereType === "restaurant"
              ? isVideoFile(file) ? (
                  <label style={styles.recommendRow} data-testid="eating-compose-recommend">
                    <input
                      type="checkbox"
                      checked={isRecommend}
                      disabled={busy || (!restaurant && !dish)}
                      onChange={(e) => setIsRecommend(e.target.checked)}
                    />
                    <span>
                      Recommend this (needs a restaurant or Common Knowledge dish tag)
                    </span>
                  </label>
                ) : null
              : null}

            <div data-testid="ate-multi-items" style={{ marginTop: 10 }}>
              <p style={styles.stepLabel}>More items on this meal (optional)</p>
              {extraItemNames.map((name, index) => (
                <div key={`extra-${index}`} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
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
                    style={styles.input}
                    data-testid={`ate-extra-item-${index}`}
                  />
                  <button
                    type="button"
                    disabled={busy}
                    data-testid={`ate-extra-item-remove-${index}`}
                    onClick={() =>
                      setExtraItemNames((prev) => prev.filter((_, i) => i !== index))
                    }
                    style={styles.chip}
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
                  style={styles.chip}
                >
                  + Add another item
                </button>
              ) : null}
            </div>

            <p style={styles.stepLabel}>Meal time</p>
            <div style={styles.mealRow} role="group" aria-label="Meal time">
              {WHAT_I_ATE_MEAL_PERIODS.map((slot) => {
                const active = mealPeriod === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    data-testid={`eating-meal-${slot.id}`}
                    disabled={busy}
                    style={{
                      ...styles.mealChip,
                      ...(active ? styles.mealChipActive : null),
                    }}
                    onClick={() => setMealPeriod(slot.id)}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>

            {ateKind === "restaurant" || ateKind === "menu_item" ? (
              <>
                <p style={styles.stepLabel}>Anything to say?</p>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={meta.placeholder}
                  disabled={busy}
                  maxLength={160}
                  autoComplete="off"
                  style={styles.input}
                  data-testid="eating-compose-comment"
                />
              </>
            ) : null}
            <p style={styles.hint} data-testid="ate-signal-hint">
              {ateMeta.label}: actual eating now — separate from What I Wanna Eat (desire).
            </p>
          </>
        ) : null}

        {category === "reviews" || (category === "ate" && feedMode) ? (
          <>
            {category === "ate" && feedMode ? (
              <div data-testid="ate-where-step">
                <p style={styles.stepLabel}>Where</p>
                <div style={styles.chips} role="group" aria-label="Where did you eat">
                  <button
                    type="button"
                    data-testid="ate-where-restaurant"
                    disabled={busy}
                    style={{
                      ...styles.chip,
                      ...(whereType === "restaurant" || (!whereType && !homemade && (restaurant || dish))
                        ? styles.chipActive
                        : null),
                    }}
                    onClick={() => {
                      setWhereType("restaurant");
                      setHomemade(false);
                    }}
                  >
                    Restaurant
                  </button>
                  <button
                    type="button"
                    data-testid="ate-where-home"
                    disabled={busy}
                    style={{
                      ...styles.chip,
                      ...(whereType === "home" || homemade ? styles.chipActive : null),
                    }}
                    onClick={() => {
                      setWhereType("home");
                      setHomemade(true);
                      setRestaurant(null);
                      setDish(null);
                    }}
                  >
                    @Home
                  </button>
                </div>
              </div>
            ) : null}
            <p style={styles.stepLabel}>
              {category === "reviews"
                ? "Which menu item are you reviewing?"
                : feedMode
                  ? "Restaurant & menu item (optional)"
                  : "What is this?"}
            </p>

            <EatingPlaceFields
              homemade={category === "reviews" ? false : homemade}
              onHomemadeChange={category === "reviews" ? () => {} : setHomemade}
              restaurant={restaurant}
              onRestaurantChange={setRestaurant}
              dish={dish}
              onDishChange={setDish}
              followed={followed}
              disabled={busy}
              locationCity={locationCity}
              locationState={locationState}
              allowDishSearch
            />

            {category === "ate" && isVideoFile(file) ? (
              <label style={styles.recommendRow} data-testid="eating-compose-recommend">
                <input
                  type="checkbox"
                  checked={isRecommend}
                  disabled={busy || (!restaurant && !dish) || homemade}
                  onChange={(e) => setIsRecommend(e.target.checked)}
                />
                <span>
                  Recommend this (needs a restaurant or Common Knowledge dish tag)
                </span>
              </label>
            ) : null}

            {category === "ate" && feedMode ? (
              <div data-testid="ate-multi-items" style={{ marginTop: 10 }}>
                <p style={styles.stepLabel}>More items on this meal (optional)</p>
                {extraItemNames.map((name, index) => (
                  <div key={`feed-extra-${index}`} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
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
                      style={styles.input}
                      data-testid={`ate-extra-item-${index}`}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      data-testid={`ate-extra-item-remove-${index}`}
                      onClick={() =>
                        setExtraItemNames((prev) => prev.filter((_, i) => i !== index))
                      }
                      style={styles.chip}
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
                    style={styles.chip}
                  >
                    + Add another item
                  </button>
                ) : null}
              </div>
            ) : null}

            <p style={styles.stepLabel}>
              Meal time
            </p>

            {!feedMode ? (
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
            ) : null}

            <p style={styles.stepLabel}>
              {feedMode ? "Caption (optional)" : "Anything to say?"}
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
          feedMode ? (
            <>
              <p style={styles.stepLabel}>Restaurant & menu item (optional)</p>
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
                allowDishSearch
              />
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Caption (optional)"
                disabled={busy}
                maxLength={160}
                autoComplete="off"
                style={styles.input}
                data-testid="eating-compose-input"
              />
            </>
          ) : (
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
              <div data-testid="want-food-type-chips">
                <p style={styles.stepLabel}>Tap a food type — then save</p>
                <div style={styles.chips} role="group" aria-label="Food type">
                  {FAVORITE_FOOD_TYPE_OPTIONS.map((opt) => {
                    const active = foodInterestKey === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        data-testid={`want-food-type-${opt.key}`}
                        disabled={busy}
                        style={{
                          ...styles.chip,
                          ...(active ? styles.chipActive : null),
                        }}
                        onClick={() => selectFoodTypeChip(opt)}
                      >
                        {labelWithFoodIcon(opt.key, opt.label)}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setFoodInterestKey("");
                  }}
                  placeholder="Or type what you want"
                  disabled={busy}
                  maxLength={160}
                  autoComplete="off"
                  style={{ ...styles.input, marginTop: 8 }}
                  data-testid="eating-compose-input"
                />
                <p style={styles.hint}>
                  Optional: add a short video so others can discover your craving on Feed.
                </p>
              </div>
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
                allowDishSearch
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

            <div
              data-testid="want-invite-me-out-settings"
              style={{ marginTop: 4 }}
            >
              <InviteMeOutAudiencePicker
                open={inviteMeOutOpen}
                onOpenChange={setInviteMeOutOpen}
                audience={inviteMeOutAudience}
                onAudienceChange={setInviteMeOutAudience}
                selectedIds={inviteMeOutSelectedIds}
                onSelectedIdsChange={setInviteMeOutSelectedIds}
                candidates={inviteMeOutCandidates}
                disabled={busy}
              />
              <p style={{ ...socialType.meta, margin: "8px 0 0" }}>
                Connections you allow can use Invite Me Out on food you save.
              </p>
            </div>
          </>
          )
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
          {busy ? (
            <div
              data-testid="eating-compose-upload-progress"
              style={styles.uploadProgressWrap}
              role="status"
              aria-live="polite"
            >
              <p style={styles.uploadProgressHint}>
                {Number.isFinite(Number(uploadPercent))
                  ? `Uploading… ${Math.round(Number(uploadPercent))}% — stay on this screen`
                  : "Uploading… stay on this screen"}
              </p>
              <div style={styles.uploadProgressTrack}>
                <div
                  style={{
                    ...styles.uploadProgressBar,
                    width: `${Math.max(4, Math.min(100, Number(uploadPercent) || 8))}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
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
              ? Number.isFinite(Number(uploadPercent))
                ? `${Math.round(Number(uploadPercent))}%`
                : "…"
              : category === "plan"
                ? "Continue"
                : category === "want"
                  ? "Save"
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

  hint: {
    margin: "8px 0 0",
    fontSize: 12,
    color: "#64748b",
    lineHeight: 1.35,
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

  dishSelected: {
    margin: 0,
    fontSize: 14,
    color: "#166534",
    fontWeight: 600,
  },

  recommendRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    margin: "4px 0 0",
    fontSize: 13,
    color: "#344054",
    lineHeight: 1.4,
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
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
    marginTop: 4,
  },

  submitBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
  },

  uploadProgressWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  uploadProgressHint: {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: "#475467",
    lineHeight: 1.35,
  },

  uploadProgressTrack: {
    height: 6,
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.08)",
    overflow: "hidden",
  },

  uploadProgressBar: {
    height: "100%",
    borderRadius: 999,
    background: "linear-gradient(90deg, #22C55E 0%, #16A34A 100%)",
    transition: "width 160ms ease-out",
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
    alignSelf: "flex-end",
  },
};
