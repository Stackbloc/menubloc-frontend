/**
 * Post = a quick post in two steps (Andre 2026-11-02 light design, same as the app's Post tab).
 * 1 · Capture your clip: a dashed frame ("Frame your dish, then hit record") with the tip, optional
 *    "Posting about" pills (A restaurant · A dish · Home cooking), a big red Record button and the
 *    gallery (Upload media). A restaurant clip needs no food: the restaurant box comes first.
 * 2 · Tag your clip: the clip (▶ to play, its length), WHERE (📍 Restaurant type-ahead, a new place is
 *    added for review · 🏠 Home; ⭐ Recommend once a restaurant is set), WHAT FOOD (one caption line,
 *    "What food is your clip about?": what you type counts, ✓ when it's enough, and is the first chip,
 *    in green; suggestions are Common Knowledge food types, the picked restaurant's dishes, dishes in your
 *    city; Enter accepts), Post. No warning banners: tapping Post with no food jumps to the caption.
 * The back arrow goes from Tag to Capture (tags kept), and from Capture closes the sheet (draft thrown
 * away). While you type, the clip shrinks and the sheet moves to the top so the phone keyboard never
 * covers the box or its chips (Andre 2026-10-30).
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MenuplyMediaPicker from "../../social/MenuplyMediaPicker.jsx";
import { inlineCameraSupported, preferInlineCamera } from "../../../lib/consumerCameraCapture.js";
import { normalizeNativeVideoFile } from "../../../lib/nativeVideoCapture.js";
import { asDishPlace, asRestaurantPlace, dishLabel, restaurantLabel, searchReportPlaces } from "../../../lib/foodActivityApi.js";
import { searchFoodTypes } from "../../../lib/foodTypesApi.js";
import { unlistedRestaurantPlace } from "../../../lib/unlistedPlace.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";

const TYPEAHEAD_MS = 220;
const MAX_FOOD_CHIPS = 6;
const GREEN = "#0f7a24";

/** What the clip is about, picked before the clip; optional, so Record still takes one tap. */
const ABOUT = [
  { key: "restaurant", icon: "📍", label: "A restaurant" },
  { key: "dish", icon: "🍜", label: "A dish" },
  { key: "home", icon: "🏠", label: "Home cooking" },
];

function cleanTyped(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 160);
}

const same = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

/** The food in a post: a CK food type, a menu dish, or typed (the server reviews a new food). */
function foodLabel(food) {
  if (!food) return "";
  if (food.kind === "type") return food.type.name;
  if (food.kind === "dish") return dishLabel(food.dish);
  return food.name;
}

export default function QuickPostSheet({
  open,
  onClose,
  onSubmit,
  busy = false,
  uploadPercent = null,
  locationCity = null,
  locationState = null,
}) {
  const recordId = useId();
  const uploadId = useId();
  const foodRef = useRef(null);
  const placeRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [foodText, setFoodText] = useState("");
  const [foodPick, setFoodPick] = useState(null);
  const [foodFocused, setFoodFocused] = useState(false);
  const [placeFocused, setPlaceFocused] = useState(false);
  const [foodTypes, setFoodTypes] = useState([]);
  const [dishHits, setDishHits] = useState([]);
  const [cityDishes, setCityDishes] = useState([]);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [placeText, setPlaceText] = useState("");
  const [hits, setHits] = useState([]);
  const [place, setPlace] = useState(null);
  const [atHome, setAtHome] = useState(false);
  const [recommend, setRecommend] = useState(false);
  // "No particular dish": a restaurant clip posts with only the restaurant (Andre 2026-11-02).
  const [noDish, setNoDish] = useState(false);
  const [about, setAbout] = useState(null);
  const inlineCamera = useMemo(() => inlineCameraSupported() && preferInlineCamera(), []);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  /**
   * Cancel = throw the draft away and close (Andre 2026-10-30: "there needs to be a way to cancel the
   * post"). Only on an explicit cancel: the sheet is also hidden, not cancelled, during the guest consent step.
   */
  function cancel() {
    if (busy) return;
    setFile(null);
    setFileError("");
    setFoodText("");
    setFoodPick(null);
    setFoodTypes([]);
    setDishHits([]);
    setCityDishes([]);
    setPlaceOpen(false);
    setPlaceText("");
    setHits([]);
    setPlace(null);
    setAtHome(false);
    setRecommend(false);
    setNoDish(false);
    setAbout(null);
    onClose?.();
  }

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape" && !busy) cancel();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  // With a clip in hand, go straight to the caption (a restaurant clip: straight to the restaurant box).
  useEffect(() => {
    if (!file) return;
    if (about === "restaurant" && !place) setPlaceOpen(true);
    else foodRef.current?.focus();
  }, [file]);

  function pickAbout(key) {
    const next = about === key ? null : key;
    setAbout(next);
    setAtHome(next === "home");
    if (next === "home") {
      setPlace(null);
      setRecommend(false);
    }
  }

  useEffect(() => {
    if (placeOpen) placeRef.current?.focus();
  }, [placeOpen]);

  // Restaurants suggested while you type (2+ letters), one per franchise, as on the app.
  useEffect(() => {
    const q = placeText.trim();
    if (place || q.length < 2) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const data = await searchReportPlaces({
          type: "restaurant",
          q,
          limit: 5,
          city: locationCity,
          state: locationState,
          one_per_franchise: 1,
        });
        if (alive) setHits(data.results || []);
      } catch {
        if (alive) setHits([]);
      }
    }, TYPEAHEAD_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [placeText, place, locationCity, locationState]);

  // Food suggestions: Common Knowledge food types, plus the picked Menuply restaurant's dishes first.
  useEffect(() => {
    const q = foodText.trim();
    if (foodPick || q.length < 2) return undefined;
    const rid = place?.restaurant_id || null;
    let alive = true;
    const t = setTimeout(async () => {
      searchFoodTypes(q)
        .then((rows) => alive && setFoodTypes(rows))
        .catch(() => alive && setFoodTypes([]));
      if (rid) {
        try {
          const data = await searchReportPlaces({ type: "menu_item", q, restaurant_id: rid, limit: 4 });
          if (alive) setDishHits(data.results || []);
        } catch {
          if (alive) setDishHits([]);
        }
      } else if (!place) {
        // People type the menu item ("big mac", "pastrami on rye"): dishes from any restaurant in the city.
        try {
          const data = await searchReportPlaces({ type: "dish", q, limit: 5, city: locationCity, state: locationState });
          if (alive) setCityDishes(data.results || []);
        } catch {
          if (alive) setCityDishes([]);
        }
      }
    }, TYPEAHEAD_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [foodText, foodPick, place, locationCity, locationState]);

  if (!open || typeof document === "undefined") return null;

  async function takeFile(raw) {
    if (!raw) return;
    setFileError("");
    try {
      setFile(await normalizeNativeVideoFile(raw));
    } catch (err) {
      setFileError(String(err?.message || "Could not use that video."));
    }
  }

  const typedFood = cleanTyped(foodText);
  const menuDishes = place?.restaurant_id ? dishHits : [];
  const nearbyDishes = place ? [] : cityDishes;
  // A Menuply restaurant: only its menu dishes are suggested (Andre 2026-11-02: "Which restaurant dish?").
  const typeHits = place?.restaurant_id ? [] : foodTypes;
  // A dish typed at a restaurant that isn't on its menu is new: the server keeps it for review.
  const typedIsNew = Boolean(place) && !menuDishes.some((h) => same(dishLabel(h), typedFood));

  /** What gets posted: the tapped suggestion, an exact match of what you typed, or the typed name. */
  function resolveFood() {
    if (foodPick) return foodPick;
    if (noDish || typedFood.length < 2) return null;
    const dish = menuDishes.find((h) => same(dishLabel(h), typedFood));
    if (dish) return { kind: "dish", dish: asDishPlace(dish) };
    const type = typeHits.find((t) => same(t.name, typedFood));
    if (type) return { kind: "type", type };
    return { kind: "typed", name: typedFood };
  }

  function pickFood(next) {
    setFoodPick(next);
    setFoodText(foodLabel(next));
    setFoodTypes([]);
    setDishHits([]);
    setCityDishes([]);
  }

  /** "Big Mac · McDonald's": the dish and its restaurant (a franchise as its brand) in one tap. */
  function pickCityDish(row) {
    const dish = asDishPlace(row);
    const restaurant = asRestaurantPlace({ restaurant_id: row.restaurant_id, restaurant_name: row.restaurant_name });
    if (!dish || !restaurant) return;
    pickFood({ kind: "dish", dish });
    choosePlace(restaurant, { keepDish: true });
  }

  function choosePlace(next, { keepDish = false } = {}) {
    if (!next) return;
    setPlace(next);
    setAtHome(false);
    setPlaceOpen(false);
    // The restaurant box unmounts without a blur, so the clip would stay small.
    setPlaceFocused(false);
    setPlaceText("");
    setHits([]);
    setDishHits([]);
    // A dish from another restaurant's menu doesn't belong to this place.
    if (!keepDish && foodPick?.kind === "dish") setFoodPick(null);
  }

  /** Enter in the restaurant box: the exact suggestion, else the typed name (a new place we'll add). */
  function acceptPlaceText() {
    const typed = placeText.trim();
    if (typed.length < 2) return;
    const hit = hits.find((h) => same(restaurantLabel(h), typed));
    choosePlace(hit ? asRestaurantPlace(hit) : unlistedRestaurantPlace(typed));
  }

  function clearPlace() {
    setPlace(null);
    setAtHome(false);
    setRecommend(false);
    setNoDish(false);
    setDishHits([]);
    if (foodPick?.kind === "dish") setFoodPick(null);
  }

  /** "No particular dish": toggles; clears whatever food was typed. */
  function toggleNoDish() {
    const next = !noDish;
    setNoDish(next);
    if (next) {
      setFoodPick(null);
      setFoodText("");
    }
  }

  const food = resolveFood();
  // A restaurant clip can post with only the restaurant (Andre 2026-10-30: a clip can be about a place, not a dish).
  // So can any clip once "No particular dish" is picked (Andre 2026-11-02).
  const placeOnly = !food && Boolean(place) && (noDish || about === "restaurant");
  const canPost = Boolean(file) && !busy && (Boolean(food) || placeOnly);

  async function submit() {
    if (busy) return;
    if (!food && !placeOnly) {
      if (about === "restaurant") setPlaceOpen(true);
      else foodRef.current?.focus();
      return;
    }
    if (!file) return;
    const dish = food?.kind === "dish" ? food.dish : null;
    await onSubmit?.({
      category: "ate",
      file,
      text: "",
      mealPeriod: defaultWhatIAteMealPeriod(),
      homemade: atHome,
      whereType: atHome ? "home" : place?.restaurant_id ? "restaurant" : "other",
      restaurant: place,
      dish,
      isRecommend: Boolean(recommend && place),
      // No food on a restaurant clip: postFeedAteVideo names the item after the restaurant.
      items: food
        ? [
            {
              food_name: foodLabel(food),
              menu_item_id: dish?.menu_item_id || null,
              restaurant_id: place?.restaurant_id || null,
            },
          ]
        : null,
    });
  }

  // Suggestions only while you're typing the caption, so they don't linger once you move on.
  // What you typed comes first, in green, so you can always pick it (Andre 2026-10-30: "lobster").
  const foodChips =
    foodFocused && !foodPick && typedFood.length >= 2
      ? [
          // At a restaurant, a dish not on its menu says so: "+ “…” · new, we'll review it".
          {
            key: "typed",
            label: typedIsNew ? `+ “${typedFood}”` : typedFood,
            sub: typedIsNew ? "new, we'll review it" : null,
            typed: true,
            testId: "quick-post-food-typed",
            onPick: () => food && pickFood(food),
          },
          ...menuDishes.map((h) => ({ key: `dish-${h.menu_item_id}`, label: dishLabel(h), testId: `quick-post-dish-${h.menu_item_id}`, onPick: () => pickFood({ kind: "dish", dish: asDishPlace(h) }) })),
          ...typeHits.map((t, i) => ({ key: `type-${i}-${t.name}`, label: t.name, testId: `quick-post-food-type-${i}`, onPick: () => pickFood({ kind: "type", type: t }) })),
          ...nearbyDishes.map((h) => ({ key: `near-${h.menu_item_id}`, label: dishLabel(h), sub: h.restaurant_name, testId: `quick-post-city-dish-${h.menu_item_id}`, onPick: () => pickCityDish(h) })),
        ]
          .filter((c) => c.typed || !same(c.label, typedFood) || c.sub)
          .slice(0, MAX_FOOD_CHIPS + 1)
      : [];
  const placeTyping = !place && placeText.trim().length >= 2;
  // Typing on a phone: small clip, sheet at the top, so the keyboard can't cover the box or chips.
  const typing = foodFocused || placeFocused;

  const placePicker = placeOpen && !place ? (
    <div>
      <div style={styles.placeBox}>
        <span aria-hidden>📍</span>
        <input
          ref={placeRef}
          type="text"
          value={placeText}
          onChange={(e) => setPlaceText(e.target.value.slice(0, 120))}
          onFocus={(e) => {
            setPlaceFocused(true);
            const el = e.currentTarget;
            setTimeout(() => el.scrollIntoView({ block: "start", behavior: "smooth" }), 250);
          }}
          onBlur={() => setPlaceFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              acceptPlaceText();
            }
          }}
          placeholder="Which restaurant?"
          autoComplete="off"
          enterKeyHint="done"
          disabled={busy}
          style={styles.placeInput}
          aria-label="Restaurant"
          data-testid="quick-post-where"
        />
        <button type="button" style={styles.clear} onClick={() => setPlaceOpen(false)} aria-label="Cancel restaurant">
          ✕
        </button>
      </div>
      {placeTyping ? (
        <div style={styles.chips}>
          {hits.map((h) => (
            <button
              key={h.restaurant_id}
              type="button"
              style={styles.chip}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choosePlace(asRestaurantPlace(h))}
              data-testid={`quick-post-place-${h.restaurant_id}`}
            >
              {restaurantLabel(h)}
            </button>
          ))}
          {hits.some((h) => same(restaurantLabel(h), placeText.trim())) ? null : (
            <button
              type="button"
              style={{ ...styles.chip, ...styles.chipNew }}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choosePlace(unlistedRestaurantPlace(placeText))}
              data-testid="quick-post-place-use-typed"
            >
              + “{placeText.trim()}” <span style={styles.chipSub}>· new, we'll add it</span>
            </button>
          )}
        </div>
      ) : null}
    </div>
  ) : null;

  const clipInputs = (
    <>
      <input
        id={uploadId}
        type="file"
        accept="video/*"
        hidden
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          void takeFile(f);
        }}
        data-testid="quick-post-upload-input"
      />
      {inlineCamera ? null : (
        // label + input capture: opens the phone camera (button→click opens a file picker on many phones).
        <input
          id={recordId}
          type="file"
          accept="video/*"
          capture="environment"
          hidden
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            void takeFile(f);
          }}
        />
      )}
    </>
  );

  // While you type, the clip is small; a blur would grow it back before the click lands and the tap
  // would miss. Keep the focus (the restaurant box takes it when it opens).
  const keepFocus = (e) => e.preventDefault();
  const errorLine = fileError ? <p style={styles.error}>{fileError}</p> : null;
  const recordTrigger = (style, content, label) =>
    inlineCamera ? (
      <MenuplyMediaPicker
        source="camera"
        allowPhoto={false}
        allowVideo
        showPreview={false}
        file={file}
        onFile={(f) => void takeFile(f)}
        disabled={busy}
        testId={label === "Record" ? "quick-post-camera" : undefined}
        renderTrigger={({ open: openCamera }) => (
          <button type="button" style={style} onClick={openCamera} aria-label={label} data-testid={label === "Record" ? "quick-post-record" : "quick-post-frame"}>
            {content}
          </button>
        )}
      />
    ) : (
      // label + input capture: opens the phone camera (button→click opens a file picker on many phones).
      <label htmlFor={recordId} style={style} aria-label={label} data-testid={label === "Record" ? "quick-post-record" : "quick-post-frame"}>
        {content}
      </label>
    );

  return createPortal(
    <div
      role="presentation"
      style={{ ...styles.backdrop, ...(typing ? styles.backdropTyping : null) }}
      data-testid="quick-post-sheet"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) cancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={file ? "Tag your clip" : "Capture your clip"} style={styles.sheet}>
        <div style={styles.head}>
          {/* Back: Tag → Capture (the clip goes, the tags stay); Capture → close and throw the draft away. */}
          <button
            type="button"
            style={styles.backBtn}
            onClick={() => (file ? setFile(null) : cancel())}
            disabled={busy}
            aria-label={file ? "Back to capture" : "Cancel post"}
            data-testid={file ? "quick-post-back" : "quick-post-cancel"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <h2 style={styles.stepTitle} data-testid="quick-post-title">
            {file ? "2 · Tag your clip" : "1 · Capture your clip"}
          </h2>
          {/* The Menuply X mark, so the sheet still reads as ours. */}
          <img src="/menuply-qr-logo-x.svg" alt="Menuply" style={styles.logoX} data-testid="quick-post-logo" />
        </div>
        {clipInputs}

        {!file ? (
          // Step 1 · Capture: a frame, what it's about (optional), the record button.
          <div style={styles.body}>
            {recordTrigger(
              styles.frame,
              <>
                <span style={styles.frameText}>
                  Frame your dish,
                  <br />
                  then hit record
                </span>
                <span style={styles.tip} data-testid="quick-post-tip">
                  💡 Up to 10 minutes. Show the food up close, in good light.
                </span>
              </>,
              "Record a clip"
            )}
            <div style={styles.section}>
              <p style={styles.sectionLabel}>Posting about</p>
              <div style={styles.chips}>
                {ABOUT.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    aria-pressed={about === a.key}
                    style={{ ...styles.tag, ...(about === a.key ? styles.tagOn : null) }}
                    onClick={() => pickAbout(a.key)}
                    data-testid={`quick-post-about-${a.key}`}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
            {errorLine}
            <div style={styles.captureRow}>
              <span style={styles.captureSide} aria-hidden />
              {recordTrigger(styles.recordRing, <span style={styles.recordInner} aria-hidden />, "Record")}
              <span style={styles.captureSide}>
                <label htmlFor={uploadId} style={styles.galleryBtn} aria-label="Upload media" title="Upload media" data-testid="quick-post-upload">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
                    <circle cx="9" cy="10" r="1.6" />
                    <path d="m4.5 17 4.5-4.5 3 3 2.5-2.5 5 5" />
                  </svg>
                </label>
              </span>
            </div>
          </div>
        ) : (
          // Step 2 · Tag: the clip, Where, What food, Post.
          <div style={styles.body}>
            <div style={{ ...styles.clip, ...(typing ? styles.clipTyping : null) }}>
              <ClipPreview src={previewUrl} />
            </div>

            <div style={styles.section}>
              <p style={styles.sectionLabel}>Where</p>
              <div style={styles.chips}>
                {place ? (
                  <>
                    <button type="button" onMouseDown={keepFocus} style={{ ...styles.tag, ...styles.tagOn }} onClick={clearPlace} aria-label={`Remove ${restaurantLabel(place)}`} data-testid="quick-post-place-chosen">
                      📍 {restaurantLabel(place)} ✕
                    </button>
                    <button
                      onMouseDown={keepFocus}
                      type="button"
                      aria-pressed={recommend}
                      style={{ ...styles.tag, ...(recommend ? styles.tagOn : null) }}
                      onClick={() => setRecommend((v) => !v)}
                      data-testid="quick-post-tag-recommend"
                    >
                      ⭐ Recommend
                    </button>
                  </>
                ) : atHome ? (
                  <button type="button" onMouseDown={keepFocus} style={{ ...styles.tag, ...styles.tagOn }} onClick={clearPlace} aria-label="Remove Home" data-testid="quick-post-place-chosen">
                    🏠 Home ✕
                  </button>
                ) : placeOpen ? null : (
                  <>
                    <button type="button" onMouseDown={keepFocus} style={styles.tag} onClick={() => setPlaceOpen(true)} data-testid="quick-post-where-open">
                      📍 Restaurant
                    </button>
                    <button
                      onMouseDown={keepFocus}
                      type="button"
                      style={styles.tag}
                      onClick={() => {
                        setAtHome(true);
                        setPlaceOpen(false);
                      }}
                      data-testid="quick-post-at-home"
                    >
                      🏠 Home
                    </button>
                  </>
                )}
              </div>
              {placePicker}
            </div>

            <div style={styles.section}>
              <p style={styles.sectionLabel}>{place ? "Dish" : "What food"}</p>
              <div style={styles.caption}>
                <input
                  ref={foodRef}
                  type="text"
                  value={foodText}
                  onChange={(e) => {
                    setFoodText(e.target.value.slice(0, 160));
                    setFoodPick(null);
                    setNoDish(false);
                  }}
                  onFocus={() => setFoodFocused(true)}
                  onBlur={() => setFoodFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (food) pickFood(food);
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder={place ? "Which restaurant dish?" : about === "restaurant" ? "Any food in it? (optional)" : "What food is your clip about?"}
                  autoComplete="off"
                  enterKeyHint="done"
                  disabled={busy}
                  style={styles.captionInput}
                  aria-label={place ? "Which restaurant dish?" : "What food is your clip about?"}
                  data-testid="quick-post-food"
                />
                {food ? (
                  <span style={styles.check} aria-label="Looks good" data-testid="quick-post-food-check">
                    ✓
                  </span>
                ) : null}
              </div>
              {typedFood || place || about === "restaurant" ? null : (
                <p style={styles.examples} data-testid="quick-post-food-examples">
                  Like tacos, a matcha latte, homemade lasagna
                </p>
              )}
              {foodChips.length ? (
                <div style={styles.chips} data-testid="quick-post-food-chips">
                  {foodChips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      style={{ ...styles.chip, ...(c.typed ? styles.chipTyped : null) }}
                      // Keep the caption focused so the tap lands before the chips hide.
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        c.onPick();
                        foodRef.current?.blur();
                      }}
                      data-testid={c.testId}
                    >
                      {c.label}
                      {c.sub ? <span style={styles.chipSub}> · {c.sub}</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
              {place && !typedFood ? (
                <div style={styles.chips}>
                  <button
                    type="button"
                    aria-pressed={noDish}
                    style={{ ...styles.tag, ...(noDish ? styles.tagOn : null) }}
                    onMouseDown={keepFocus}
                    onClick={toggleNoDish}
                    data-testid="quick-post-no-dish"
                  >
                    No particular dish
                  </button>
                </div>
              ) : null}
            </div>

            {errorLine}
            {/* Compact pill, not a full-width bar (Andre 2026-10-29). */}
            <button
              type="button"
              aria-disabled={!canPost}
              style={{ ...styles.postBtn, ...(canPost ? null : styles.postSoft) }}
              onClick={() => void submit().catch(() => {})}
              data-testid="quick-post-submit"
            >
              {busy ? `Posting…${uploadPercent != null ? ` ${uploadPercent}%` : ""}` : "Post"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/** m:ss, like the badge on the design's clip card. */
function clock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The chosen clip: still with a ▶ until tapped, then it plays (with sound) and a tap pauses it. */
function ClipPreview({ src }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(null);
  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }
  return (
    <button type="button" style={styles.clipBtn} onClick={toggle} aria-label={playing ? "Pause clip" : "Play clip"} data-testid="quick-post-clip-play">
      <video
        ref={ref}
        src={src}
        style={styles.preview}
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setSeconds(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : null)}
        data-testid="quick-post-preview"
      />
      {playing ? null : (
        <span style={styles.playBtn} aria-hidden>
          <span style={styles.playTriangle} />
        </span>
      )}
      {seconds ? (
        <span style={styles.duration} data-testid="quick-post-clip-duration">
          {clock(seconds)}
        </span>
      ) : null}
    </button>
  );
}

const glass = "rgba(255,255,255,0.92)";
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    // Above the Feed's mobile header (1300) so the back arrow stays visible.
    zIndex: 1310,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    // Centered on the screen, not a bottom sheet (Andre 2026-10-30), above the bottom nav.
    alignItems: "center",
    justifyContent: "center",
    padding: "16px 12px calc(var(--feed-primary-nav-h, 72px) + 12px)",
  },
  sheet: {
    width: "min(440px, 100%)",
    maxHeight: "100%",
    overflowY: "auto",
    background: "#f5f7f4",
    color: "#111",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  },
  head: { display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 4px" },
  backBtn: { appearance: "none", width: 40, height: 40, flex: "0 0 auto", borderRadius: 20, border: "1px solid #dfe5dc", background: "#fff", color: "#111", display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 },
  stepTitle: { flex: 1, minWidth: 0, margin: 0, fontSize: 17, fontWeight: 700, color: "#111" },
  logoX: { width: 22, height: 22, objectFit: "contain" },
  body: { display: "flex", flexDirection: "column", gap: 16, padding: "10px 16px 18px" },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  sectionLabel: { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#5c665f" },
  // Step 1 · Capture
  frame: { minHeight: "min(36vh, 300px)", height: 260, borderRadius: 16, border: "2px dashed #d3dad2", background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, cursor: "pointer", fontFamily: "inherit", color: "#111", boxSizing: "border-box", width: "100%" },
  frameText: { fontSize: 22, lineHeight: 1.3, fontWeight: 500, color: "#5c665f", textAlign: "center" },
  tip: { margin: 0, fontSize: 13, color: "#64748b", textAlign: "center" },
  captureRow: { display: "flex", alignItems: "center", justifyContent: "center" },
  captureSide: { flex: 1, display: "flex", justifyContent: "center" },
  recordRing: { appearance: "none", width: 80, height: 80, borderRadius: 40, border: "4px solid #111", background: "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer", boxSizing: "border-box" },
  recordInner: { width: 62, height: 62, borderRadius: 31, background: "#b42318", display: "block" },
  galleryBtn: { display: "inline-flex", padding: 8, cursor: "pointer", color: "#111" },
  // Step 2 · Tag
  clip: { position: "relative", height: "min(32vh, 260px)", minHeight: 200, borderRadius: 16, overflow: "hidden", background: "#111" },
  clipTyping: { height: 110, minHeight: 110 },
  clipBtn: { appearance: "none", position: "absolute", inset: 0, border: "none", padding: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  playBtn: { position: "relative", width: 64, height: 64, borderRadius: 32, background: glass, display: "inline-flex", alignItems: "center", justifyContent: "center", paddingLeft: 5, boxSizing: "border-box" },
  playTriangle: { width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: "18px solid #111" },
  duration: { position: "absolute", left: 8, bottom: 8, background: glass, color: "#111", borderRadius: 999, padding: "2px 8px", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  backdropTyping: { alignItems: "flex-start", paddingTop: 12 },
  preview: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  caption: { display: "flex", alignItems: "center", gap: 8, borderBottom: "2px solid #dfe5dc", padding: "2px 2px" },
  captionInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 19, fontWeight: 600, padding: "8px 0", fontFamily: "inherit", color: "#111" },
  check: { width: 24, height: 24, borderRadius: 12, background: GREEN, color: "#fff", fontSize: 14, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "6px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  chipNew: { borderStyle: "dashed" },
  chipSub: { color: "#64748b", fontWeight: 500 },
  examples: { margin: 0, fontSize: 13, color: "#64748b" },
  chipTyped: { color: GREEN, borderColor: GREEN, fontWeight: 800 },
  placeBox: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #dfe5dc", borderRadius: 999, padding: "0 6px 0 12px" },
  placeInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "9px 0", fontFamily: "inherit", color: "#111" },
  clear: { appearance: "none", border: "none", background: "transparent", color: "#64748b", fontSize: 15, cursor: "pointer", padding: 6 },
  // Rounded pills, solid green when picked (the design's Where / What dish chips).
  tag: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "10px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  tagOn: { background: GREEN, borderColor: GREEN, color: "#fff" },
  error: { margin: 0, fontSize: 13, color: "#b42318", fontWeight: 600 },
  postBtn: { alignSelf: "flex-end", appearance: "none", border: "none", background: GREEN, color: "#fff", borderRadius: 999, padding: "11px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  postSoft: { opacity: 0.5 },
};
