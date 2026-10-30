/**
 * Post = one screen, no steps (Andre 2026-10-28/29: "posting should feel as simple as possible").
 * Clip (Record · Upload media) · what you're eating (Common Knowledge food types, the picked
 * restaurant's dishes, or "Use …" for a new food the server keeps for review) · where (optional:
 * Menuply, typed, or @home) · ⭐ Recommend. Quick Invite lives on My Profile. Same as the app.
 */
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import MenuplyMediaPicker from "../../social/MenuplyMediaPicker.jsx";
import { inlineCameraSupported, preferInlineCamera } from "../../../lib/consumerCameraCapture.js";
import { normalizeNativeVideoFile } from "../../../lib/nativeVideoCapture.js";
import {
  asDishPlace,
  asRestaurantPlace,
  dishLabel,
  restaurantLabel,
  restaurantPlaceMeta,
  searchReportPlaces,
} from "../../../lib/foodActivityApi.js";
import { searchFoodTypes } from "../../../lib/foodTypesApi.js";
import { unlistedRestaurantPlace } from "../../../lib/unlistedPlace.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";

const TYPEAHEAD_MS = 220;
const GREEN = "#0f7a24";

function cleanTyped(value) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, 160);
}

/** The food in a post: a CK food type, a menu dish, or typed ("Use …", reviewed later). */
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
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [foodQuery, setFoodQuery] = useState("");
  const [food, setFood] = useState(null);
  const [foodTypes, setFoodTypes] = useState([]);
  const [dishHits, setDishHits] = useState([]);
  const [cityDishes, setCityDishes] = useState([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [place, setPlace] = useState(null);
  const [atHome, setAtHome] = useState(false);
  const [recommend, setRecommend] = useState(false);
  const inlineCamera = useMemo(() => inlineCameraSupported() && preferInlineCamera(), []);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape" && !busy) onClose?.();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onClose]);

  // Restaurants suggested while you type (2+ letters), as on the app.
  useEffect(() => {
    const q = query.trim();
    if (place || q.length < 2) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const data = await searchReportPlaces({
          type: "restaurant",
          q,
          limit: 6,
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
  }, [query, place, locationCity, locationState]);

  // Food suggestions: Common Knowledge food types, plus the picked Menuply restaurant's dishes first.
  useEffect(() => {
    const q = foodQuery.trim();
    if (food || q.length < 2) return undefined;
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
  }, [foodQuery, food, place, locationCity, locationState]);

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

  function pickFood(next) {
    if (!next) return;
    setFood(next);
    setFoodQuery("");
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
    setPlace(restaurant);
    setAtHome(false);
    setQuery("");
    setHits([]);
  }

  function pickPlace(next) {
    if (!next) return;
    setPlace(next);
    setAtHome(false);
    setQuery("");
    setHits([]);
    setDishHits([]);
    // A dish from another restaurant's menu doesn't belong to this place.
    if (food?.kind === "dish") setFood(null);
  }

  function clearPlace() {
    setPlace(null);
    setAtHome(false);
    setDishHits([]);
    if (food?.kind === "dish") setFood(null);
  }

  const needsPlace = recommend && !place;
  const canPost = Boolean(file) && !busy && Boolean(food) && !needsPlace;
  // Say what's missing next to a greyed-out Post Clip, so diners aren't left guessing (Andre 2026-10-29).
  // Louder than plain text: amber callout + amber ring on the clip tile (Andre 2026-10-29: "too easy to not notice").
  const missing =
    busy || needsPlace
      ? null
      : !file && (food || place || atHome)
        ? "Add a clip first: tap Record or Upload media above."
        : file && !food
          ? "Add what you're eating to post."
          : null;

  async function submit() {
    if (!canPost) return;
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
      isRecommend: recommend,
      items: [
        {
          food_name: foodLabel(food),
          menu_item_id: dish?.menu_item_id || null,
          restaurant_id: place?.restaurant_id || null,
        },
      ],
    });
  }

  const typedFood = cleanTyped(foodQuery);
  const foodTyping = !food && typedFood.length >= 2;
  const menuDishes = place?.restaurant_id ? dishHits : [];
  const nearbyDishes = place ? [] : cityDishes;
  const exactFood = [...foodTypes.map((t) => t.name), ...menuDishes.map(dishLabel), ...nearbyDishes.map(dishLabel)].some(
    (n) => String(n).toLowerCase() === typedFood.toLowerCase()
  );
  const typedPlace = query.trim();
  const showUsePlace =
    typedPlace.length >= 2 && !hits.some((h) => restaurantLabel(h).toLowerCase() === typedPlace.toLowerCase());

  return createPortal(
    <div
      role="presentation"
      style={styles.backdrop}
      data-testid="quick-post-sheet"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="quick-post-title" style={styles.sheet}>
        <div style={styles.head}>
          <span style={styles.headSpacer} aria-hidden />
          <h2 style={styles.title} id="quick-post-title">
            Post
          </h2>
          <button type="button" style={styles.textBtn} onClick={() => !busy && onClose?.()} aria-label="Close">
            Close
          </button>
        </div>
        <div style={styles.body}>
          {/* Clip tile: Record in the middle, Upload media in the corner. */}
          <div style={{ ...styles.tile, ...(missing && !file ? styles.tileNeeded : null) }} data-testid="quick-post-tile">
            {previewUrl ? (
              <video src={previewUrl} style={styles.preview} autoPlay muted loop playsInline data-testid="quick-post-preview" />
            ) : (
              // Blurred food photo behind Record (Andre 2026-10-29: real food, not icons; placeholder photo for now).
              <img src="/post-tile-food.jpg" alt="" aria-hidden style={styles.preview} data-testid="quick-post-tile-photo" />
            )}
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
                  <button type="button" style={file ? styles.recordAgain : styles.recordCard} onClick={openCamera} data-testid="quick-post-record">
                    <RecordLabel again={Boolean(file)} />
                  </button>
                )}
              />
            ) : (
              <>
                {/* label + input capture: opens the phone camera (button→click opens a file picker on many phones). */}
                <label htmlFor={recordId} style={file ? styles.recordAgain : styles.recordCard} data-testid="quick-post-record">
                  <RecordLabel again={Boolean(file)} />
                </label>
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
              </>
            )}
            <label htmlFor={uploadId} style={styles.uploadPill} data-testid="quick-post-upload">
              ⇪ Upload media
            </label>
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
          </div>
          {fileError ? <p style={styles.error}>{fileError}</p> : null}

          <div>
            <div style={styles.row}>
              <span style={styles.icon} aria-hidden>
                🍴
              </span>
              {food ? (
                <div style={styles.flex} data-testid="quick-post-food-chosen">
                  <div style={styles.rowText}>{foodLabel(food)}</div>
                  {food.kind === "type" ? null : (
                    <div style={styles.muted}>
                      {food.kind === "dish" ? `On the menu at ${restaurantLabel(place)}` : "New food · we'll review it"}
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value.slice(0, 160))}
                  placeholder="What are you eating?"
                  autoComplete="off"
                  disabled={busy}
                  style={styles.rowInput}
                  aria-label="What are you eating?"
                  data-testid="quick-post-food"
                />
              )}
              {food ? (
                <button type="button" style={styles.clear} onClick={() => setFood(null)} aria-label="Change food" data-testid="quick-post-food-clear">
                  ✕
                </button>
              ) : null}
            </div>
            {foodTyping ? (
              <ul style={styles.hits}>
                {menuDishes.map((h) => (
                  <li key={`dish-${h.menu_item_id}`}>
                    <button
                      type="button"
                      style={styles.hit}
                      onClick={() => pickFood({ kind: "dish", dish: asDishPlace(h) })}
                      data-testid={`quick-post-dish-${h.menu_item_id}`}
                    >
                      {dishLabel(h)} <span style={styles.muted}>· on the menu</span>
                    </button>
                  </li>
                ))}
                {foodTypes.map((t, i) => (
                  <li key={`type-${i}-${t.name}`}>
                    <button type="button" style={styles.hit} onClick={() => pickFood({ kind: "type", type: t })} data-testid={`quick-post-food-type-${i}`}>
                      {t.name}
                    </button>
                  </li>
                ))}
                {nearbyDishes.map((h) => (
                  <li key={`near-${h.menu_item_id}`}>
                    <button type="button" style={styles.hit} onClick={() => pickCityDish(h)} data-testid={`quick-post-city-dish-${h.menu_item_id}`}>
                      {dishLabel(h)} <span style={styles.muted}>· {h.restaurant_name}</span>
                    </button>
                  </li>
                ))}
                {exactFood ? null : (
                  <li>
                    <button type="button" style={styles.useTyped} onClick={() => pickFood({ kind: "typed", name: typedFood })} data-testid="quick-post-food-use-typed">
                      Use “{typedFood}” <span style={styles.muted}>· new food, we'll review it</span>
                    </button>
                  </li>
                )}
              </ul>
            ) : null}
            {foodTyping ? <p style={{ ...styles.muted, marginTop: 4 }}>Pick a food from the list, or use what you typed.</p> : null}
          </div>

          <div>
            <div style={styles.row}>
              <span style={styles.icon} aria-hidden>
                📍
              </span>
              {place || atHome ? (
                <div style={styles.flex} data-testid="quick-post-place-chosen">
                  <div style={styles.rowText}>{atHome ? "@home" : restaurantLabel(place)}</div>
                  {place ? (
                    <div style={styles.muted}>{place.restaurant_id ? restaurantPlaceMeta(place) : "New restaurant · we'll add it"}</div>
                  ) : null}
                </div>
              ) : (
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value.slice(0, 120))}
                  placeholder="Restaurant (optional)"
                  autoComplete="off"
                  disabled={busy}
                  style={styles.rowInput}
                  aria-label="Restaurant"
                  data-testid="quick-post-where"
                />
              )}
              {place || atHome ? (
                <button type="button" style={styles.clear} onClick={clearPlace} aria-label="Clear where" data-testid="quick-post-where-clear">
                  ✕
                </button>
              ) : (
                <button
                  type="button"
                  style={styles.homePill}
                  onClick={() => {
                    setAtHome(true);
                    setQuery("");
                  }}
                  data-testid="quick-post-at-home"
                >
                  @home
                </button>
              )}
            </div>
            {!place && !atHome && (hits.length || showUsePlace) && typedPlace.length >= 2 ? (
              <ul style={styles.hits}>
                {hits.map((h) => (
                  <li key={h.restaurant_id}>
                    <button type="button" style={styles.hit} onClick={() => pickPlace(asRestaurantPlace(h))} data-testid={`quick-post-place-${h.restaurant_id}`}>
                      {restaurantLabel(h)}
                      {restaurantPlaceMeta(h) ? <span style={styles.muted}> · {restaurantPlaceMeta(h)}</span> : null}
                    </button>
                  </li>
                ))}
                {showUsePlace ? (
                  <li>
                    <button type="button" style={styles.useTyped} onClick={() => pickPlace(unlistedRestaurantPlace(typedPlace))} data-testid="quick-post-place-use-typed">
                      Use “{typedPlace}” <span style={styles.muted}>· new restaurant, we'll add it</span>
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          <button
            type="button"
            aria-pressed={recommend}
            style={{ ...styles.chip, ...(recommend ? styles.chipOn : null) }}
            onClick={() => setRecommend((v) => !v)}
            data-testid="quick-post-tag-recommend"
          >
            ⭐ Recommend
          </button>
          {needsPlace ? <p style={styles.muted}>Add the restaurant to recommend it.</p> : null}

          {/* Compact pill, not a full-width bar (Andre 2026-10-29). */}
          <div style={styles.postRow}>
            {missing ? (
              <p style={{ ...styles.missing, flex: 1 }} role="alert" data-testid="quick-post-missing">
                ⚠️ {missing}
              </p>
            ) : (
              <p style={{ ...styles.muted, flex: 1 }}>Public post to Feed</p>
            )}
            <button
              type="button"
              disabled={!canPost}
              style={{ ...styles.postBtn, ...(canPost ? null : styles.disabled) }}
              onClick={() => void submit().catch(() => {})}
              data-testid="quick-post-submit"
            >
              {busy ? `Posting…${uploadPercent != null ? ` ${uploadPercent}%` : ""}` : "Post Clip"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function RecordLabel({ again }) {
  return (
    <>
      <span style={styles.recordRow}>
        <span style={styles.recordDot} aria-hidden />
        <span style={again ? styles.recordAgainText : styles.recordText}>{again ? "Record again" : "Record"}</span>
      </span>
      {again ? null : <span style={styles.recordHint}>Tap to capture</span>}
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
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px 12px calc(var(--feed-primary-nav-h, 72px) + 12px)",
  },
  sheet: {
    width: "min(480px, 100%)",
    maxHeight: "100%",
    overflowY: "auto",
    background: "#f5f7f4",
    color: "#111",
    borderRadius: 18,
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  },
  head: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px 4px" },
  headSpacer: { width: 52 },
  title: { margin: 0, fontSize: 18, fontWeight: 800 },
  textBtn: { appearance: "none", border: "none", background: "transparent", color: "#475569", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 6 },
  body: { display: "flex", flexDirection: "column", gap: 10, padding: "8px 14px 16px" },
  tile: { position: "relative", height: 220, borderRadius: 14, background: "#e8f5e3", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" },
  preview: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" },
  recordCard: { position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: glass, border: "none", borderRadius: 12, padding: "14px 24px", cursor: "pointer", fontFamily: "inherit" },
  recordAgain: { position: "absolute", left: 8, bottom: 8, display: "flex", background: glass, border: "none", borderRadius: 999, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" },
  recordRow: { display: "inline-flex", alignItems: "center", gap: 8 },
  recordDot: { width: 14, height: 14, borderRadius: 7, background: "#b42318", display: "inline-block" },
  recordText: { fontSize: 20, fontWeight: 800, color: "#111" },
  recordAgainText: { fontSize: 13, fontWeight: 700, color: "#111" },
  recordHint: { fontSize: 13, fontWeight: 600, color: GREEN },
  uploadPill: { position: "absolute", right: 8, bottom: 8, background: glass, borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  row: { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #dfe5dc", borderRadius: 12, padding: "0 12px", minHeight: 52 },
  icon: { fontSize: 18, width: 22, textAlign: "center" },
  rowInput: { flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 16, padding: "12px 0", fontFamily: "inherit", color: "#111" },
  rowText: { fontSize: 16, fontWeight: 600 },
  flex: { flex: 1, minWidth: 0, padding: "8px 0" },
  clear: { appearance: "none", border: "none", background: "transparent", color: "#64748b", fontSize: 16, cursor: "pointer", padding: 4 },
  homePill: { appearance: "none", border: `1px solid ${GREEN}`, background: "#fff", color: GREEN, borderRadius: 999, padding: "4px 10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  hits: { listStyle: "none", margin: "4px 0 0", padding: 0, background: "#fff", border: "1px solid #dfe5dc", borderRadius: 12, overflow: "hidden" },
  hit: { appearance: "none", width: "100%", textAlign: "left", border: "none", borderBottom: "1px solid #f1f5f9", background: "#fff", padding: "11px 14px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: "#111" },
  useTyped: { appearance: "none", width: "100%", textAlign: "left", border: "none", borderTop: "1px dashed #cbd5e1", background: "#fafcf9", padding: "11px 14px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", color: "#111" },
  chip: { alignSelf: "flex-start", appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "7px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  chipOn: { background: GREEN, borderColor: GREEN, color: "#fff" },
  muted: { margin: 0, fontSize: 12, color: "#64748b" },
  missing: { margin: 0, padding: "8px 12px", borderRadius: 10, background: "#fef3c7", border: "1.5px solid #f59e0b", fontSize: 14, fontWeight: 700, color: "#92400e" },
  tileNeeded: { boxShadow: "0 0 0 3px #f59e0b" },
  error: { margin: 0, fontSize: 13, color: "#b42318", fontWeight: 600 },
  postRow: { display: "flex", alignItems: "center", gap: 12 },
  postBtn: { appearance: "none", border: "none", background: GREEN, color: "#fff", borderRadius: 999, padding: "10px 20px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};
