/**
 * Andre 2026-11-14 redesign (his three mockups, same as the app): the sheet is a soft green card with
 * faint food doodles, the Menuply logo, round ‹ / ✕. Capture Your Clip (no "Posting about" pills) → Tag
 * Your Clip → Posted! (where the clip went, the clip card, optional "I Paid $" + Show the price on my
 * post, Done, Edit Tags). Edit Tags reopens the tags and saves them on the live post. Guests post as
 * before (no Posted! step: they have no account to edit with).
 *
 * Earlier: Post = a quick post in two steps (Andre 2026-11-02 light design, same as the app's Post tab).
 * 1 · Capture your clip: a dashed frame ("Frame your dish, then hit record") with the tip, optional
 *    "Posting about" pills (A restaurant · Cooking @home), a big red Record button and the
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
import { updateWhatIAteToday } from "../../../lib/consumerApi.js";
import { notifyFeedVideoPosted } from "../../../lib/feedVideoCompose.js";
import { sendDealReport } from "../../../lib/dealReportsApi.js";
import { Burst, CheckIcon, PencilIcon, PinIcon, PriceTicket, SearchIcon, StoreIcon, TacoIcon, TagSparks, VideoCam } from "./postArt.jsx";
import { DOODLE_BG, POST_COLORS, priceToCents } from "../../../lib/postArtTheme.js";

const TYPEAHEAD_MS = 220;
const MAX_FOOD_CHIPS = 6;
const GREEN = "#0f7a24";

/** Record limit on the web (Andre 2026-11-08: record 90 s, upload 10 min). */
const RECORD_SECONDS = 90;

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
  /** 2026-11-28 (Andre): Deals → "+ Report a Deal" opens Post with Report a Deal ticked. */
  initialReportDeal = false,
  /** Reports need an account (guests post without one). */
  canReportDeal = false,
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
  const [, setPlaceOpen] = useState(false);
  const [placeText, setPlaceText] = useState("");
  const [hits, setHits] = useState([]);
  const [place, setPlace] = useState(null);
  const [atHome, setAtHome] = useState(false);
  const [recommend, setRecommend] = useState(false);
  // "No particular dish": a restaurant clip posts with only the restaurant (Andre 2026-11-02).
  const [noDish, setNoDish] = useState(false);
  // Posted! (Andre 2026-11-14): the post just made, then optional I Paid $ / Edit Tags on it.
  const [posted, setPosted] = useState(null);
  const [editing, setEditing] = useState(false);
  const [priceText, setPriceText] = useState("");
  const [showPrice, setShowPrice] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doneError, setDoneError] = useState("");
  // Plan 78 (Andre 2026-11-27/28): "Report a Deal" = informational use only, never a deal. Sent after the
  // normal post, so the clip upload is unchanged. Needs a restaurant (listed or typed); dish optional.
  const [reportDeal, setReportDeal] = useState(Boolean(initialReportDeal));
  const [dealNote, setDealNote] = useState("");
  const [dealReportLine, setDealReportLine] = useState("");
  const [reportOpenSeen, setReportOpenSeen] = useState(false);
  if (open && initialReportDeal && canReportDeal && !reportOpenSeen) {
    setReportOpenSeen(true);
    setReportDeal(true);
  } else if (!open && reportOpenSeen) {
    setReportOpenSeen(false);
  }
  const inlineCamera = useMemo(() => inlineCameraSupported() && preferInlineCamera(), []);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  /**
   * Cancel = throw the draft away and close (Andre 2026-10-30: "there needs to be a way to cancel the
   * post"). Only on an explicit cancel: the sheet is also hidden, not cancelled, during the guest consent step.
   */
  function cancel() {
    if (busy || saving) return;
    // On Posted!, closing = Done (a typed price is saved, never silently dropped).
    if (posted && !editing) {
      void finish();
      return;
    }
    if (editing) {
      closeEdit();
      return;
    }
    reset();
    onClose?.();
  }

  function reset() {
    setPosted(null);
    setEditing(false);
    setPriceText("");
    setShowPrice(true);
    setSaving(false);
    setDoneError("");
    setReportDeal(false);
    setDealNote("");
    setDealReportLine("");
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
  }, [open, busy, onClose, posted, editing, saving, priceText, showPrice]);


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
  // Home cooking gets no restaurant dishes (Where is picked first since 2026-11-14).
  const nearbyDishes = place || atHome ? [] : cityDishes;
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
    choosePlace(restaurant, { keepDish: true, typed: "" });
  }

  function choosePlace(next, { keepDish = false, typed = placeText } = {}) {
    if (!next) return;
    // Keep what the diner typed with the place (Andre 2026-11-12), even when it links a Menuply restaurant.
    const typedName = String(typed || "").trim().replace(/\s+/g, " ").slice(0, 120);
    setPlace(typedName.length >= 2 ? { ...next, typed_name: typedName } : next);
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
    setPlaceText("");
    setAtHome(false);
    setRecommend(false);
    setNoDish(false);
    setDishHits([]);
    if (foodPick?.kind === "dish") setFoodPick(null);
  }

  /** "Cooking @home / No restaurant" (Andre 2026-11-14 mockup): a checkbox; checked clears the restaurant. */
  function toggleHome() {
    const next = !atHome;
    if (next) {
      clearPlace();
      setReportDeal(false);
    }
    setAtHome(next);
  }

  const food = resolveFood();
  // A restaurant typed but not picked still counts (Andre 2026-11-12: ssus's typed restaurant was lost when
  // Post was tapped without Enter or a suggestion): the exact suggestion, else the typed name.
  const pendingTyped = !place && !atHome ? placeText.trim().replace(/\s+/g, " ").slice(0, 120) : "";
  const pendingHit = pendingTyped.length >= 2 ? hits.find((h) => same(restaurantLabel(h), pendingTyped)) : null;
  const pendingPlace =
    pendingTyped.length >= 2
      ? { ...(pendingHit ? asRestaurantPlace(pendingHit) : unlistedRestaurantPlace(pendingTyped)), typed_name: pendingTyped }
      : null;
  const postPlace = place || pendingPlace;
  // A restaurant clip can post with only the restaurant (Andre 2026-10-30: a clip can be about a place, not a dish).
  // So can any clip once "No particular dish" is picked (Andre 2026-11-02).
  // A restaurant alone is enough (Andre 2026-11-14: a typed restaurant left Post dim with no hint): picked or
  // just typed, Post turns on and the clip posts about the place.
  const placeOnly = !food && Boolean(postPlace);
  // A deal report needs the restaurant (picked, or typed like Invite to Eat).
  const canPost = Boolean(file) && !busy && !saving && (Boolean(food) || placeOnly) && (!reportDeal || editing || Boolean(postPlace));
  const whereNow = atHome ? "home" : postPlace?.restaurant_id ? "restaurant" : "other";

  /** What the Posted! card shows and Edit Tags saves. */
  function snapshot(entryId) {
    return {
      entryId,
      whereType: whereNow,
      restaurantId: whereNow === "restaurant" ? postPlace?.restaurant_id || null : null,
      placeName: atHome ? null : postPlace ? restaurantLabel(postPlace) : null,
      foodLabel: food ? foodLabel(food) : null,
    };
  }

  async function submit() {
    if (busy || saving) return;
    if (!food && !placeOnly) {
      foodRef.current?.focus();
      return;
    }
    if (!file) return;
    if (reportDeal && !editing && !postPlace) {
      setDoneError("Add the restaurant to report a deal.");
      return;
    }
    if (editing) {
      await saveTags();
      return;
    }
    const dish = food?.kind === "dish" ? food.dish : null;
    const made = await onSubmit?.({
      category: "ate",
      file,
      text: "",
      mealPeriod: defaultWhatIAteMealPeriod(),
      homemade: atHome,
      whereType: atHome ? "home" : postPlace?.restaurant_id ? "restaurant" : "other",
      restaurant: postPlace,
      dish,
      isRecommend: Boolean(recommend && place),
      // No food on a restaurant clip: postFeedAteVideo names the item after the restaurant.
      items: food
        ? [
            {
              food_name: foodLabel(food),
              menu_item_id: dish?.menu_item_id || null,
              restaurant_id: postPlace?.restaurant_id || null,
            },
          ]
        : null,
    });
    // Signed in: the overlay hands back the new post and keeps the sheet open on Posted!.
    const entryId = Number(made?.id);
    if (Number.isInteger(entryId) && entryId > 0) {
      setPosted(snapshot(entryId));
      setPlaceOpen(false);
      if (reportDeal) {
        // Never fails the post: the clip is already up, so a refused report is only a line on Posted!.
        setDealReportLine(
          await sendDealReport({ clipId: entryId, place: postPlace, food: food ? { ...food, label: foodLabel(food) } : null, description: dealNote })
        );
      }
    }
  }

  /** Edit Tags → Save: the new where + food go onto the live post, then back to Posted!. */
  async function saveTags() {
    if (!posted?.entryId || saving) return;
    setSaving(true);
    setDoneError("");
    try {
      const dish = food?.kind === "dish" ? food.dish : null;
      await updateWhatIAteToday(posted.entryId, {
        where_type: whereNow,
        restaurant_id: whereNow === "home" ? null : postPlace?.restaurant_id || null,
        place_name: whereNow === "home" ? null : postPlace?.typed_name || (postPlace ? restaurantLabel(postPlace) : null),
        food_name: food ? foodLabel(food) : postPlace ? restaurantLabel(postPlace) : "",
        menu_item_id: dish?.menu_item_id || null,
        is_recommend: Boolean(recommend && place),
      });
      setPosted(snapshot(posted.entryId));
      setPlaceOpen(false);
      setEditing(false);
      notifyFeedVideoPosted();
    } catch (err) {
      setDoneError(String(err?.message || "Couldn't save the tags. Try again."));
    } finally {
      setSaving(false);
    }
  }

  /** Done on Posted!: save the price if one was typed, then close. */
  async function finish() {
    if (saving) return;
    const cents = priceToCents(priceText);
    if (cents === undefined) {
      setDoneError("Enter a price like 12.50 (up to $1,000).");
      return;
    }
    if (cents != null && posted?.entryId) {
      setSaving(true);
      setDoneError("");
      try {
        await updateWhatIAteToday(posted.entryId, { price_paid_cents: cents, show_price: showPrice });
        notifyFeedVideoPosted();
      } catch (err) {
        setSaving(false);
        setDoneError(String(err?.message || "Couldn't save the price. Try again."));
        return;
      }
    }
    reset();
    onClose?.();
  }

  function openEditTags() {
    setDoneError("");
    setEditing(true);
  }

  /** ‹ / ✕ on Edit Tags: back to Posted!, unsaved. */
  function closeEdit() {
    setEditing(false);
    setPlaceOpen(false);
    setDoneError("");
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
  const placeTyping = !place && !atHome && placeText.trim().length >= 2;
  // Typing on a phone: small clip, sheet at the top, so the keyboard can't cover the box or chips.
  const typing = foodFocused || placeFocused;

  // Restaurant suggestions under the Restaurant row while you type.
  const placeChips = placeTyping ? (
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

  const title = editing ? "Edit Tags" : file ? "Tag Your Clip" : "Capture Your Clip";
  const showPosted = Boolean(posted) && !editing;
  // Say only where the clip really went (Andre 2026-11-14): the Feed, plus the restaurant's page when
  // it's a Menuply restaurant. Feed clips never go on the Wall (the Wall has its own posts).
  const postedWhere =
    posted?.restaurantId && posted?.placeName
      ? `Your clip is in the Feed and on ${posted.placeName}'s page.`
      : "Your clip is in the Feed.";
  const priceBad = priceToCents(priceText) === undefined;
  const lineError = doneError || fileError;
  const errorBlock = lineError ? (
    <p style={styles.error} role="alert" data-testid="quick-post-error">
      {lineError}
    </p>
  ) : null;

  const header = (
    <div style={styles.head}>
      <span style={styles.side}>
        {showPosted ? null : (
          // Back: Tag → Capture (the clip goes, the tags stay); Capture → close; Edit Tags → Posted!.
          <button
            type="button"
            style={styles.roundBtn}
            onClick={() => (editing ? closeEdit() : file ? setFile(null) : cancel())}
            disabled={busy || saving}
            aria-label={editing ? "Back to Posted" : file ? "Back to capture" : "Cancel post"}
            data-testid={editing ? "quick-post-edit-back" : file ? "quick-post-back" : "quick-post-cancel"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
        )}
      </span>
      <span style={styles.logo} data-testid="quick-post-logo">
        <img src="/menuply-qr-logo-x.svg" alt="" style={styles.logoX} />
        <span style={styles.wordmark}>Menuply</span>
      </span>
      <span style={{ ...styles.side, justifyContent: "flex-end" }}>
        <button
          type="button"
          style={styles.roundBtn}
          onClick={cancel}
          disabled={busy || saving}
          aria-label={showPosted ? "Done" : editing ? "Back to Posted" : "Cancel post"}
          data-testid="quick-post-close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </span>
    </div>
  );

  let body;
  if (showPosted) {
    body = (
      <div style={styles.body} data-testid="quick-post-done">
        <div style={styles.doneTop}>
          <Burst width={150} style={styles.doneBurst} />
          <span style={styles.bigCheck} aria-hidden>
            <CheckIcon size={40} strokeWidth={3} />
          </span>
          <h2 style={styles.postedTitle} data-testid="quick-post-done-title">
            Posted!
          </h2>
          <p style={styles.postedLine} data-testid="quick-post-done-where">
            {postedWhere}
          </p>
          {dealReportLine ? (
            <p style={styles.postedLine} data-testid="quick-post-done-deal-report">
              {dealReportLine}
            </p>
          ) : null}
        </div>
        <div style={styles.box} data-testid="quick-post-done-card">
          <div style={styles.thumb}>
            <ClipPreview src={previewUrl} small />
          </div>
          <div style={styles.doneInfo}>
            {posted.whereType === "home" ? (
              <span style={{ fontSize: 24 }} aria-hidden>
                🏠
              </span>
            ) : posted.placeName ? (
              <StoreIcon size={28} />
            ) : null}
            <div style={{ minWidth: 0 }}>
              <div style={styles.doneName} data-testid="quick-post-done-place">
                {posted.whereType === "home" ? "Home cooking" : posted.placeName || posted.foodLabel || "Your clip"}
              </div>
              {posted.foodLabel && (posted.whereType === "home" || posted.placeName) ? (
                <div style={styles.doneFood} data-testid="quick-post-done-food">
                  {posted.foodLabel}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div style={{ ...styles.box, ...styles.priceBox }} data-testid="quick-post-price">
          <div style={styles.priceHead}>
            <PriceTicket />
            <span style={styles.priceTitle}>I Paid $</span>
            <span style={styles.optional}>(optional)</span>
          </div>
          <label style={{ ...styles.priceField, ...(priceBad ? styles.priceFieldBad : null) }}>
            <span style={styles.priceDollar} aria-hidden>
              $
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={priceText}
              onChange={(e) => {
                setPriceText(e.target.value.slice(0, 8));
                setDoneError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void finish();
                }
              }}
              placeholder="e.g., 12.50"
              autoComplete="off"
              enterKeyHint="done"
              style={styles.priceInput}
              aria-label="What you paid, in dollars"
              data-testid="quick-post-price-input"
            />
          </label>
          <label style={styles.checkRow}>
            <input
              type="checkbox"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              style={styles.checkboxNative}
              data-testid="quick-post-price-show"
            />
            <span style={{ ...styles.checkbox, ...(showPrice ? styles.checkboxOn : null) }} aria-hidden>
              {showPrice ? <CheckIcon size={16} /> : null}
            </span>
            Show the price on my post
          </label>
        </div>
        {errorBlock}
        {/* Compact Done pill + Edit Tags as a text link (Andre: no full-width bars, no outlined oval pills). */}
        <div style={styles.doneActions}>
          <button type="button" style={styles.editLink} onClick={openEditTags} disabled={saving} data-testid="quick-post-edit-tags">
            <PencilIcon /> Edit Tags
          </button>
          <button type="button" style={{ ...styles.darkPill, ...(saving ? styles.postSoft : null) }} onClick={() => void finish()} disabled={saving} data-testid="quick-post-done-button">
            {saving ? "Saving…" : "Done"}
          </button>
        </div>
      </div>
    );
  } else if (!file) {
    // Capture Your Clip (Andre 2026-11-14 mockup): the frame, gallery on the left, the big red record button.
    body = (
      <div style={styles.body}>
        {recordTrigger(
          styles.frame,
          <>
            <span style={styles.camArt} aria-hidden>
              <Burst width={120} />
              <VideoCam size={92} />
            </span>
            <span style={styles.frameText} data-testid="quick-post-tip">
              📷 Record up to {RECORD_SECONDS} seconds.
              <br />
              Close-ups in good light look best.
            </span>
          </>,
          "Record a clip"
        )}
        {errorBlock}
        <div style={styles.captureRow}>
          <span style={styles.captureSide}>
            <label htmlFor={uploadId} style={styles.galleryBtn} aria-label="Upload media" title="Upload media" data-testid="quick-post-upload">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
                <circle cx="9" cy="10" r="1.6" />
                <path d="m4.5 17 4.5-4.5 3 3 2.5-2.5 5 5" />
              </svg>
            </label>
          </span>
          <span style={styles.recordWrap}>
            <Burst width={170} side="left" style={styles.recordBurst} />
            <Burst width={170} side="right" style={styles.recordBurst} />
            {recordTrigger(
              styles.recordRing,
              <span style={styles.recordInner} aria-hidden>
                <VideoCam size={48} color="#fff" />
              </span>,
              "Record"
            )}
          </span>
          <span style={styles.captureSide} aria-hidden />
        </div>
      </div>
    );
  } else {
    // Tag Your Clip (or Edit Tags after posting): the clip, Where, What food, Post / Save.
    body = (
      <div style={styles.body}>
        <div style={{ ...styles.clip, ...(typing ? styles.clipTyping : null) }}>
          <ClipPreview src={previewUrl} />
        </div>

            {/* Andre 2026-11-14 mockup: restaurant and dish asked together, with a nudge to tag the place. */}
            <div style={styles.tagHead} data-testid="quick-post-tag-head">
              <TagSparks side="left" size={18} />
              <span style={styles.tagHeadText}>Tag it so friends can find it!</span>
              <TagSparks side="right" size={18} />
            </div>

            <div style={styles.section}>
              <div style={{ ...styles.tagRow, ...(atHome ? styles.postSoft : null) }}>
                <span style={styles.tagRowIcon}>
                  <PinIcon size={22} />
                </span>
                <span style={styles.tagRowLabel}>Restaurant</span>
                <span style={styles.tagRowBar} aria-hidden />
                {place ? (
                  <button type="button" onMouseDown={keepFocus} style={styles.tagRowChosen} onClick={clearPlace} aria-label={`Remove ${restaurantLabel(place)}`} data-testid="quick-post-place-chosen">
                    <span style={styles.tagRowValue}>{restaurantLabel(place)}</span>
                    <span style={styles.clear} aria-hidden>
                      ✕
                    </span>
                  </button>
                ) : (
                  <input
                    ref={placeRef}
                    type="text"
                    value={atHome ? "" : placeText}
                    onChange={(e) => {
                      setPlaceText(e.target.value.slice(0, 120));
                      setPlaceOpen(true);
                    }}
                    onFocus={(e) => {
                      setPlaceFocused(true);
                      const el = e.currentTarget;
                      setTimeout(() => el.scrollIntoView?.({ block: "start", behavior: "smooth" }), 250);
                    }}
                    onBlur={() => setPlaceFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        acceptPlaceText();
                      }
                    }}
                    placeholder="Where’s it from?"
                    autoComplete="off"
                    enterKeyHint="done"
                    disabled={busy || saving || atHome}
                    style={styles.tagRowInput}
                    aria-label="Restaurant: where's it from?"
                    data-testid="quick-post-where"
                  />
                )}
                {place ? null : pendingPlace ? (
                  // The typed name counts as is (no Enter needed): say so like the Dish row does.
                  <span style={styles.check} aria-label="Restaurant looks good" data-testid="quick-post-place-check">
                    ✓
                  </span>
                ) : (
                  <SearchIcon size={18} />
                )}
              </div>
              {placeChips}
              {place ? (
                <div style={styles.chips}>
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
                </div>
              ) : null}
            </div>

            <div style={styles.section}>
              <div style={styles.tagRow}>
                <span style={styles.tagRowIcon}>
                  <TacoIcon size={24} />
                </span>
                <span style={styles.tagRowLabel}>Dish</span>
                <span style={styles.tagRowBar} aria-hidden />
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
                  placeholder="What are you eating?"
                  autoComplete="off"
                  enterKeyHint="done"
                  disabled={busy || saving}
                  style={styles.tagRowInput}
                  aria-label="Dish: what are you eating?"
                  data-testid="quick-post-food"
                />
                {food ? (
                  <span style={styles.check} aria-label="Looks good" data-testid="quick-post-food-check">
                    ✓
                  </span>
                ) : (
                  <SearchIcon size={18} />
                )}
              </div>
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
            </div>

            <label style={styles.homeRow}>
              <input type="checkbox" checked={atHome} onChange={toggleHome} disabled={busy || saving} style={styles.checkboxNative} data-testid="quick-post-at-home" />
              <span style={{ ...styles.homeBox, ...(atHome ? styles.homeBoxOn : null) }} aria-hidden>
                {atHome ? <CheckIcon size={16} /> : null}
              </span>
              Cooking @home / No restaurant
            </label>

            {canReportDeal && !editing && !atHome ? (
              <>
                <label style={styles.homeRow}>
                  <input type="checkbox" checked={reportDeal} onChange={() => setReportDeal((v) => !v)} disabled={busy || saving} style={styles.checkboxNative} data-testid="quick-post-report-deal" />
                  <span style={{ ...styles.homeBox, ...(reportDeal ? styles.homeBoxOn : null) }} aria-hidden>
                    {reportDeal ? <CheckIcon size={16} /> : null}
                  </span>
                  Report a Deal
                </label>
                {reportDeal ? (
                  <div style={styles.dealBox} data-testid="quick-post-report-deal-box">
                    <textarea
                      value={dealNote}
                      onChange={(e) => setDealNote(e.target.value.slice(0, 500))}
                      placeholder="What's the deal? e.g. Tuesday special, $9 pasta"
                      maxLength={500}
                      rows={2}
                      disabled={busy || saving}
                      style={styles.dealInput}
                      aria-label="Deal description"
                      data-testid="quick-post-report-deal-note"
                    />
                    <span style={styles.dealHint}>
                      {postPlace ? "Shows in Deals as User Reported · Subject to restaurant confirmation." : "Add the restaurant above to report a deal."}
                    </span>
                  </div>
                ) : null}
              </>
            ) : null}

        {errorBlock}
        {/* Compact pill, not a full-width bar (Andre 2026-10-29). */}
        <button
          type="button"
          aria-disabled={!canPost}
          style={{ ...styles.darkPill, ...styles.postRight, ...(canPost ? null : styles.postSoft) }}
          onClick={() => void submit().catch(() => {})}
          data-testid="quick-post-submit"
        >
          {busy ? `Posting…${uploadPercent != null ? ` ${uploadPercent}%` : ""}` : editing ? (saving ? "Saving…" : "Save") : "Post"}
        </button>
      </div>
    );
  }

  return createPortal(
    <div
      role="presentation"
      style={{ ...styles.backdrop, ...(typing ? styles.backdropTyping : null) }}
      data-testid="quick-post-sheet"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) cancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={showPosted ? "Posted" : title} style={styles.sheet}>
        {header}
        {showPosted ? null : (
          <h2 style={styles.stepTitle} data-testid="quick-post-title">
            {title}
          </h2>
        )}
        {clipInputs}
        {body}
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
function ClipPreview({ src, small = false }) {
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
        <span style={{ ...styles.playBtn, ...(small ? styles.playBtnSmall : null) }} aria-hidden>
          <span style={{ ...styles.playTriangle, ...(small ? styles.playTriangleSmall : null) }} />
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
const C = POST_COLORS;
const roundShadow = "0 2px 6px rgba(0,0,0,0.12)";
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
  // The mockups' card: soft green, cream edge, faint food doodles.
  sheet: {
    width: "min(440px, 100%)",
    maxHeight: "100%",
    overflowY: "auto",
    boxSizing: "border-box",
    background: `${DOODLE_BG} repeat, ${C.card}`,
    backgroundSize: "220px 320px, auto",
    color: C.ink,
    borderRadius: 32,
    border: `6px solid ${C.cardEdge}`,
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  },
  head: { display: "flex", alignItems: "center", padding: "12px 14px 0" },
  side: { width: 46, flex: "0 0 auto", display: "flex" },
  roundBtn: { appearance: "none", width: 42, height: 42, borderRadius: 21, border: "none", background: "#fff", color: C.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0, boxShadow: roundShadow },
  logo: { flex: 1, minWidth: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 },
  logoX: { width: 30, height: 30, objectFit: "contain" },
  wordmark: { fontSize: 30, lineHeight: 1.1, fontWeight: 800, color: C.logoInk, letterSpacing: -0.5 },
  stepTitle: { margin: "10px 16px 0", fontSize: 28, lineHeight: 1.2, fontWeight: 800, color: C.logoInk, textAlign: "center" },
  body: { display: "flex", flexDirection: "column", gap: 16, padding: "14px 16px 18px" },
  section: { display: "flex", flexDirection: "column", gap: 8 },
  sectionLabel: { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: C.muted },
  // Capture Your Clip
  frame: { minHeight: "min(40vh, 320px)", borderRadius: 18, border: `2.5px dashed ${C.logoInk}`, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, padding: 24, cursor: "pointer", fontFamily: "inherit", color: C.ink, boxSizing: "border-box", width: "100%" },
  camArt: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  frameText: { fontSize: 17, lineHeight: 1.45, fontWeight: 500, color: C.ink, textAlign: "center" },
  captureRow: { display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 6 },
  captureSide: { flex: 1, display: "flex", justifyContent: "center" },
  galleryBtn: { width: 64, height: 64, borderRadius: 32, background: "#fff", color: C.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 3px 8px rgba(0,0,0,0.12)" },
  recordWrap: { position: "relative", width: 110, height: 110, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  recordBurst: { position: "absolute", top: -16, left: -30, pointerEvents: "none" },
  recordRing: { appearance: "none", position: "relative", width: 104, height: 104, borderRadius: 52, border: `3px solid ${C.logoInk}`, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: "pointer", boxSizing: "border-box" },
  recordInner: { width: 88, height: 88, borderRadius: 44, background: C.record, display: "inline-flex", alignItems: "center", justifyContent: "center" },
  // Tag Your Clip
  clip: { position: "relative", height: "min(26vh, 220px)", minHeight: 160, borderRadius: 16, overflow: "hidden", background: "#111" },
  clipTyping: { height: 110, minHeight: 110 },
  clipBtn: { appearance: "none", position: "absolute", inset: 0, border: "none", padding: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  playBtn: { position: "relative", width: 64, height: 64, borderRadius: 32, background: glass, display: "inline-flex", alignItems: "center", justifyContent: "center", paddingLeft: 5, boxSizing: "border-box" },
  playBtnSmall: { width: 40, height: 40, borderRadius: 20, paddingLeft: 3 },
  playTriangle: { width: 0, height: 0, borderTop: "11px solid transparent", borderBottom: "11px solid transparent", borderLeft: "18px solid #111" },
  playTriangleSmall: { borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderLeft: "11px solid #111" },
  duration: { position: "absolute", left: 8, bottom: 8, background: glass, color: "#111", borderRadius: 999, padding: "2px 8px", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" },
  backdropTyping: { alignItems: "flex-start", padding: "12px 12px calc(var(--feed-primary-nav-h, 72px) + 12px)" },
  preview: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  caption: { display: "flex", alignItems: "center", gap: 8, borderBottom: "2px solid #cfdccb", padding: "2px 2px" },
  captionInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 19, fontWeight: 600, padding: "8px 0", fontFamily: "inherit", color: C.ink },
  check: { width: 24, height: 24, borderRadius: 12, background: GREEN, color: "#fff", fontSize: 14, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "6px 12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  chipNew: { borderStyle: "dashed" },
  chipSub: { color: "#64748b", fontWeight: 500 },
  examples: { margin: 0, fontSize: 13, color: "#64748b" },
  chipTyped: { color: C.ink, borderColor: C.ink, fontWeight: 800 },
  placeBox: { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #dfe5dc", borderRadius: 999, padding: "0 6px 0 12px" },
  placeInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "9px 0", fontFamily: "inherit", color: "#111" },
  clear: { appearance: "none", border: "none", background: "transparent", color: "#64748b", fontSize: 15, cursor: "pointer", padding: 6 },
  tag: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "10px 16px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  // Selected: dark, not a green pill (Andre 2026-11-06, same as the app).
  tagOn: { background: C.ink, borderColor: C.ink, color: "#fff" },
  error: { margin: 0, fontSize: 14, color: "#b42318", fontWeight: 600, textAlign: "center" },
  // Tag rows (Andre 2026-11-14 mockup): white rounded rows, bold label | input, magnifier.
  tagHead: { display: "flex", alignItems: "center", justifyContent: "center", gap: 4 },
  tagHeadText: { fontSize: 17, lineHeight: 1.3, whiteSpace: "nowrap", fontWeight: 800, fontStyle: "italic", color: C.logoInk, textAlign: "center" },
  tagRow: { display: "flex", alignItems: "center", gap: 6, minHeight: 52, boxSizing: "border-box", background: "#fff", borderRadius: 26, padding: "0 8px 0 10px", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" },
  tagRowIcon: { width: 24, flex: "0 0 auto", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  tagRowLabel: { minWidth: 84, flex: "0 0 auto", whiteSpace: "nowrap", fontSize: 15, fontWeight: 800, color: C.ink },
  tagRowBar: { width: 1.5, alignSelf: "stretch", margin: "12px 0", background: "#dfe5dc", flex: "0 0 auto" },
  tagRowInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 14, fontStyle: "italic", padding: "12px 0", fontFamily: "inherit", color: C.ink },
  tagRowChosen: { flex: 1, minWidth: 0, appearance: "none", border: "none", background: "transparent", padding: 0, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "inherit", textAlign: "left" },
  tagRowValue: { flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  homeRow: { position: "relative", alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 26, padding: "10px 16px", fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", color: C.ink, cursor: "pointer", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" },
  homeBox: { width: 22, height: 22, flex: "0 0 auto", boxSizing: "border-box", borderRadius: 6, border: `2px solid ${C.logoInk}`, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  homeBoxOn: { background: C.accent, borderColor: C.accent },
  dealBox: { display: "grid", gap: 4, background: "#fff", borderRadius: 12, padding: 10 },
  dealInput: { width: "100%", boxSizing: "border-box", border: `1px solid ${C.logoInk}33`, borderRadius: 8, padding: 8, fontSize: 15, fontFamily: "inherit", resize: "vertical", color: C.ink },
  dealHint: { fontSize: 12, color: C.ink, opacity: 0.7 },
  // Compact dark pill sized to its label (Post / Save / Done): no full-width bars, no green pills.
  darkPill: { alignSelf: "center", appearance: "none", border: "none", background: C.ink, color: "#fff", borderRadius: 999, padding: "11px 32px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  postRight: { alignSelf: "flex-end" },
  postSoft: { opacity: 0.5 },
  // Posted!
  doneTop: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  doneBurst: { position: "absolute", top: -6 },
  bigCheck: { width: 76, height: 76, borderRadius: 38, background: C.camGreen, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 14 },
  postedTitle: { margin: "6px 0 0", fontSize: 40, lineHeight: 1.15, fontWeight: 800, color: C.logoInk },
  postedLine: { margin: 0, fontSize: 18, lineHeight: 1.35, fontWeight: 500, color: C.ink, textAlign: "center" },
  box: { display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.72)", borderRadius: 18, padding: 12 },
  thumb: { position: "relative", width: 140, height: 96, flex: "0 0 auto", borderRadius: 12, overflow: "hidden", background: "#111" },
  doneInfo: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 },
  doneName: { fontSize: 22, lineHeight: 1.2, fontWeight: 800, color: C.logoInk, overflowWrap: "anywhere" },
  doneFood: { fontSize: 15, lineHeight: 1.3, color: C.muted, overflowWrap: "anywhere" },
  priceBox: { flexDirection: "column", alignItems: "stretch", gap: 12, padding: 16 },
  priceHead: { display: "flex", alignItems: "center", gap: 8 },
  priceTitle: { fontSize: 22, fontWeight: 800, color: C.ink },
  optional: { fontSize: 14, color: C.muted },
  priceField: { display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 12, border: "1px solid #dfe5dc", padding: "0 14px" },
  priceFieldBad: { borderColor: "#b42318" },
  priceDollar: { fontSize: 22, fontWeight: 700, color: C.ink },
  priceInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 20, padding: "10px 0", fontFamily: "inherit", color: C.ink },
  checkRow: { position: "relative", display: "flex", alignItems: "center", gap: 10, fontSize: 16, color: C.ink, cursor: "pointer" },
  // The real checkbox sits under the drawn one (keyboard + screen readers keep working).
  checkboxNative: { position: "absolute", left: 0, top: "50%", width: 26, height: 26, margin: "-13px 0 0", opacity: 0, cursor: "pointer" },
  // Checkboxes stay green (Andre 2026-11-06 kept radios/checkboxes green).
  checkbox: { width: 26, height: 26, flex: "0 0 auto", boxSizing: "border-box", borderRadius: 6, border: `2px solid ${C.accent}`, background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" },
  checkboxOn: { background: C.accent },
  doneActions: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  editLink: { appearance: "none", border: "none", background: "transparent", color: C.accent, fontSize: 16, fontWeight: 700, cursor: "pointer", padding: 4, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" },
};
