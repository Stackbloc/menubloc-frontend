/**
 * Post = a quick post, not a form (Andre 2026-10-30: "it still feels like a form instead of a quick post").
 * 1. Record or Upload media: nothing else shows until there's a clip.
 * 2. The clip fills the sheet with one caption line, "What food is your clip about?" (Andre 2026-10-30: any food
 *    clip, not only eating: cooking, drinks, a friend's dish), with example foods under it while it's
 *    empty. What you type counts
 *    (✓ shows when it's enough) and is the first chip, in green; the other chips are suggestions
 *    (Common Knowledge food types, the picked restaurant's dishes, dishes in your city). Enter accepts.
 *    While you type, the clip shrinks and the sheet moves to the top so the phone keyboard never covers
 *    the box or its chips (Andre 2026-10-30).
 * 3. Small chips: 📍 Restaurant (type-ahead; a new place is added for review) · 🏠 Home; ⭐ Recommend
 *    once a restaurant is set. Post. No warning banners: tapping Post with no food jumps to the caption.
 * Same as the app's Post tab.
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

  // With a clip in hand, go straight to the caption.
  useEffect(() => {
    if (file) foodRef.current?.focus();
  }, [file]);

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

  /** What gets posted: the tapped suggestion, an exact match of what you typed, or the typed name. */
  function resolveFood() {
    if (foodPick) return foodPick;
    if (typedFood.length < 2) return null;
    const dish = menuDishes.find((h) => same(dishLabel(h), typedFood));
    if (dish) return { kind: "dish", dish: asDishPlace(dish) };
    const type = foodTypes.find((t) => same(t.name, typedFood));
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
    setDishHits([]);
    if (foodPick?.kind === "dish") setFoodPick(null);
  }

  const food = resolveFood();
  const canPost = Boolean(file) && !busy && Boolean(food);

  async function submit() {
    if (busy) return;
    if (!food) {
      foodRef.current?.focus();
      return;
    }
    if (!file) return;
    const dish = food.kind === "dish" ? food.dish : null;
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
      items: [
        {
          food_name: foodLabel(food),
          menu_item_id: dish?.menu_item_id || null,
          restaurant_id: place?.restaurant_id || null,
        },
      ],
    });
  }

  // Suggestions only while you're typing the caption, so they don't linger once you move on.
  // What you typed comes first, in green, so you can always pick it (Andre 2026-10-30: "lobster").
  const foodChips =
    foodFocused && !foodPick && typedFood.length >= 2
      ? [
          { key: "typed", label: typedFood, typed: true, testId: "quick-post-food-typed", onPick: () => food && pickFood(food) },
          ...menuDishes.map((h) => ({ key: `dish-${h.menu_item_id}`, label: dishLabel(h), testId: `quick-post-dish-${h.menu_item_id}`, onPick: () => pickFood({ kind: "dish", dish: asDishPlace(h) }) })),
          ...foodTypes.map((t, i) => ({ key: `type-${i}-${t.name}`, label: t.name, testId: `quick-post-food-type-${i}`, onPick: () => pickFood({ kind: "type", type: t }) })),
          ...nearbyDishes.map((h) => ({ key: `near-${h.menu_item_id}`, label: dishLabel(h), sub: h.restaurant_name, testId: `quick-post-city-dish-${h.menu_item_id}`, onPick: () => pickCityDish(h) })),
        ]
          .filter((c) => c.typed || !same(c.label, typedFood) || c.sub)
          .slice(0, MAX_FOOD_CHIPS + 1)
      : [];
  const placeTyping = !place && placeText.trim().length >= 2;
  // Typing on a phone: small clip, sheet at the top, so the keyboard can't cover the box or chips.
  const typing = foodFocused || placeFocused;

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

  return createPortal(
    <div
      role="presentation"
      style={{ ...styles.backdrop, ...(typing ? styles.backdropTyping : null) }}
      data-testid="quick-post-sheet"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) cancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="quick-post-title" style={styles.sheet}>
        <div style={styles.head}>
          <span style={styles.headSpacer} aria-hidden />
          <h2 style={styles.title} id="quick-post-title">
            Post
          </h2>
          <button type="button" style={styles.cancelBtn} onClick={cancel} disabled={busy} aria-label="Cancel post" data-testid="quick-post-cancel">
            Cancel
          </button>
        </div>
        {clipInputs}

        {!file ? (
          // Step 1: only Record and Upload media.
          <div style={styles.body}>
            <div style={styles.startGrid}>
              {inlineCamera ? (
                <MenuplyMediaPicker
                  source="camera"
                  allowPhoto={false}
                  allowVideo
                  showPreview={false}
                  file={file}
                  onFile={(f) => void takeFile(f)}
                  disabled={busy}
                  testId="quick-post-camera"
                  renderTrigger={({ open: openCamera }) => (
                    <button type="button" style={styles.startTile} onClick={openCamera} data-testid="quick-post-record">
                      <RecordTile />
                    </button>
                  )}
                />
              ) : (
                <label htmlFor={recordId} style={styles.startTile} data-testid="quick-post-record">
                  <RecordTile />
                </label>
              )}
              <label htmlFor={uploadId} style={{ ...styles.startTile, ...styles.uploadTile }} data-testid="quick-post-upload">
                <span style={styles.uploadIcon} aria-hidden>
                  ⇪
                </span>
                <span style={styles.startText}>Upload media</span>
              </label>
            </div>
            {fileError ? <p style={styles.error}>{fileError}</p> : null}
          </div>
        ) : (
          // Step 2: the clip, one caption line, a few chips, Post.
          <div style={styles.body}>
            <div style={{ ...styles.clip, ...(typing ? styles.clipTyping : null) }}>
              <video src={previewUrl} style={styles.preview} autoPlay muted loop playsInline data-testid="quick-post-preview" />
              <button
                type="button"
                style={styles.changeClip}
                onClick={() => !busy && setFile(null)}
                disabled={busy}
                data-testid="quick-post-change-clip"
              >
                ↺ Change clip
              </button>
            </div>

            <div style={styles.caption}>
              <input
                ref={foodRef}
                type="text"
                value={foodText}
                onChange={(e) => {
                  setFoodText(e.target.value.slice(0, 160));
                  setFoodPick(null);
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
                placeholder="What food is your clip about?"
                autoComplete="off"
                enterKeyHint="done"
                disabled={busy}
                style={styles.captionInput}
                aria-label="What food is your clip about?"
                data-testid="quick-post-food"
              />
              {food ? (
                <span style={styles.check} aria-label="Looks good" data-testid="quick-post-food-check">
                  ✓
                </span>
              ) : null}
            </div>
            {typedFood ? null : (
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

            {placeOpen && !place ? (
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
            ) : null}

            <div style={styles.bottom}>
              <div style={styles.tagRow}>
                {place ? (
                  <>
                    <button type="button" style={{ ...styles.tag, ...styles.tagOn }} onClick={clearPlace} aria-label={`Remove ${restaurantLabel(place)}`} data-testid="quick-post-place-chosen">
                      📍 {restaurantLabel(place)} ✕
                    </button>
                    <button
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
                  <button type="button" style={{ ...styles.tag, ...styles.tagOn }} onClick={clearPlace} aria-label="Remove Home" data-testid="quick-post-place-chosen">
                    🏠 Home ✕
                  </button>
                ) : placeOpen ? null : (
                  <>
                    <button type="button" style={styles.tag} onClick={() => setPlaceOpen(true)} data-testid="quick-post-where-open">
                      📍 Restaurant
                    </button>
                    <button
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
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Record tile: blurred food photo behind a red dot (Andre 2026-10-29: real food, not icons; placeholder photo). */
function RecordTile() {
  return (
    <>
      <img src="/post-tile-food.jpg" alt="" aria-hidden style={styles.preview} data-testid="quick-post-tile-photo" />
      <span style={styles.recordCard}>
        <span style={styles.recordDot} aria-hidden />
        <span style={styles.startText}>Record</span>
      </span>
    </>
  );
}

const glass = "rgba(255,255,255,0.92)";
const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    // Above the Feed's mobile header (1300) so Close stays visible.
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
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px 4px" },
  headSpacer: { width: 72 },
  title: { margin: 0, fontSize: 18, fontWeight: 800 },
  cancelBtn: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "5px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  body: { display: "flex", flexDirection: "column", gap: 10, padding: "8px 14px 16px" },
  startGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  startTile: { position: "relative", height: 200, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: "#e8f5e3", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", color: "#111" },
  uploadTile: { background: "#fff", border: "1px solid #dfe5dc" },
  uploadIcon: { fontSize: 28, lineHeight: 1 },
  startText: { fontSize: 17, fontWeight: 800 },
  recordCard: { position: "relative", display: "inline-flex", alignItems: "center", gap: 8, background: glass, borderRadius: 999, padding: "10px 18px" },
  recordDot: { width: 14, height: 14, borderRadius: 7, background: "#b42318", display: "inline-block" },
  clip: { position: "relative", height: "min(46vh, 380px)", minHeight: 220, borderRadius: 14, overflow: "hidden", background: "#111" },
  clipTyping: { height: 110, minHeight: 110 },
  backdropTyping: { alignItems: "flex-start", paddingTop: 12 },
  preview: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  changeClip: { position: "absolute", left: 8, top: 8, appearance: "none", border: "none", background: glass, borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#111" },
  caption: { display: "flex", alignItems: "center", gap: 8, borderBottom: "2px solid #dfe5dc", padding: "2px 2px" },
  captionInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 19, fontWeight: 600, padding: "8px 0", fontFamily: "inherit", color: "#111" },
  check: { width: 24, height: 24, borderRadius: 12, background: GREEN, color: "#fff", fontSize: 14, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" },
  chips: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 },
  chip: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "6px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  chipNew: { borderStyle: "dashed" },
  chipSub: { color: "#64748b", fontWeight: 500 },
  examples: { margin: "-4px 0 0", fontSize: 13, color: "#64748b" },
  chipTyped: { color: GREEN, borderColor: GREEN, fontWeight: 800 },
  placeBox: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #dfe5dc", borderRadius: 999, padding: "0 6px 0 12px" },
  placeInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "9px 0", fontFamily: "inherit", color: "#111" },
  clear: { appearance: "none", border: "none", background: "transparent", color: "#64748b", fontSize: 15, cursor: "pointer", padding: 6 },
  bottom: { display: "flex", alignItems: "center", gap: 8, marginTop: 2 },
  tagRow: { flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 6 },
  tag: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "7px 12px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  tagOn: { background: "#e8f5e3", borderColor: GREEN, color: GREEN },
  error: { margin: 0, fontSize: 13, color: "#b42318", fontWeight: 600 },
  postBtn: { appearance: "none", border: "none", background: GREEN, color: "#fff", borderRadius: 999, padding: "10px 22px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  postSoft: { opacity: 0.5 },
};
