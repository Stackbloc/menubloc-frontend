/**
 * Post = one screen, no steps (Andre 2026-10-28: "posting should feel as simple as possible").
 * Clip (Record · Upload media) · what you're eating · where (optional: Menuply, typed, or At home)
 * · how is it, plus optional tags that replace the old post types:
 *   ⭐ Recommend (any place, incl. typed) · 🍹 Happy hour · 👩‍🍳 I made this (@home dish).
 * Invite sits in the header (it isn't a post). Same as the app's Post tab.
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
import { unlistedRestaurantPlace } from "../../../lib/unlistedPlace.js";
import { HAPPY_HOUR_INTENTS } from "../../../lib/happyHourActivity.js";
import { defaultWhatIAteMealPeriod } from "../../../lib/whatIAteTodayMealPeriod.js";

export const QUICK_POST_TAGS = [
  { key: "recommend", label: "⭐ Recommend" },
  { key: "happy_hour", label: "🍹 Happy hour" },
  { key: "made", label: "👩‍🍳 I made this" },
];

export const QUICK_INVITE_PHRASES = [
  { code: "LDL", phrase: "Let's do lunch" },
  { code: "LDD", phrase: "Let's do dinner" },
  { code: "LHC", phrase: "Let's have coffee" },
  { code: "LGD", phrase: "Let's get drinks" },
  { code: "MMH", phrase: "Meet me here" },
];

/** The Feed recognizes Happy Hour posts by this food name (happyHourActivity.js). */
const HAPPY_HOUR_FOOD = HAPPY_HOUR_INTENTS[0].foodName;
const TYPEAHEAD_MS = 220;
const GREEN = "#0f7a24";

export default function QuickPostSheet({
  open,
  onClose,
  onSubmit,
  onInvite,
  busy = false,
  uploadPercent = null,
  isAuthenticated = false,
  locationCity = null,
  locationState = null,
}) {
  const recordId = useId();
  const uploadId = useId();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [food, setFood] = useState("");
  const [dish, setDish] = useState(null);
  const [dishHits, setDishHits] = useState([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState([]);
  const [place, setPlace] = useState(null);
  const [atHome, setAtHome] = useState(false);
  const [note, setNote] = useState("");
  const [tags, setTags] = useState([]);
  const [inviting, setInviting] = useState(false);
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
        const data = await searchReportPlaces({ type: "restaurant", q, limit: 6, city: locationCity, state: locationState });
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

  // Once a Menuply restaurant is picked, its dishes are suggested in the food box.
  useEffect(() => {
    const q = food.trim();
    if (!place?.restaurant_id || dish || !q) return undefined;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const data = await searchReportPlaces({ type: "menu_item", q, restaurant_id: place.restaurant_id, limit: 5 });
        if (alive) setDishHits(data.results || []);
      } catch {
        if (alive) setDishHits([]);
      }
    }, TYPEAHEAD_MS);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [food, place, dish]);

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

  function pickPlace(next) {
    if (!next) return;
    setPlace(next);
    setAtHome(false);
    setQuery("");
    setHits([]);
    setDish(null);
    setDishHits([]);
  }

  function clearPlace() {
    setPlace(null);
    setAtHome(false);
    setDish(null);
    setDishHits([]);
  }

  function changeFood(v) {
    const next = v.slice(0, 160);
    setFood(next);
    if (dish && next !== dishLabel(dish)) setDish(null);
  }

  function pickDish(row) {
    const next = asDishPlace(row);
    if (!next) return;
    setDish(next);
    setFood(dishLabel(next));
    setDishHits([]);
  }

  function toggleTag(key) {
    setTags((cur) => {
      if (cur.includes(key)) return cur.filter((x) => x !== key);
      // I made this is an @home dish, so it doesn't mix with Recommend / Happy hour.
      return key === "made" ? ["made"] : [...cur.filter((x) => x !== "made"), key];
    });
  }

  const made = tags.includes("made");
  const happy = tags.includes("happy_hour");
  const recommend = tags.includes("recommend");
  const needsPlace = (recommend || happy) && !place;
  const typedFood = food.trim().replace(/\s+/g, " ");
  const canPost =
    Boolean(file) &&
    !busy &&
    !needsPlace &&
    (made ? Boolean(typedFood) : Boolean(typedFood || dish || place || atHome));

  async function submit() {
    if (!canPost) return;
    if (made) {
      await onSubmit?.({ category: "cooking", file, name: typedFood, text: note.trim() });
      return;
    }
    const whereType = atHome ? "home" : place?.restaurant_id ? "restaurant" : "other";
    const foodName = happy
      ? HAPPY_HOUR_FOOD
      : dishLabel(dish) || typedFood || restaurantLabel(place) || (atHome ? "@home" : "Food");
    await onSubmit?.({
      category: "ate",
      file,
      // Happy hour's food name is the marker, so what you're drinking goes in the note.
      text: happy && typedFood ? [typedFood, note.trim()].filter(Boolean).join(" · ") : note.trim(),
      mealPeriod: defaultWhatIAteMealPeriod(),
      homemade: atHome,
      whereType,
      restaurant: place,
      dish: happy ? null : dish,
      isRecommend: recommend,
      items: [
        {
          food_name: foodName,
          menu_item_id: happy ? null : dish?.menu_item_id || null,
          restaurant_id: place?.restaurant_id || null,
        },
      ],
    });
  }

  const typedPlace = query.trim();
  const showUsePlace =
    typedPlace.length >= 2 && !hits.some((h) => restaurantLabel(h).toLowerCase() === typedPlace.toLowerCase());

  const header = (
    <div style={styles.head}>
      {inviting ? (
        <button type="button" style={styles.textBtn} onClick={() => setInviting(false)} data-testid="quick-post-back">
          ‹ Back
        </button>
      ) : (
        <button type="button" style={styles.invitePill} onClick={() => setInviting(true)} data-testid="quick-post-invite">
          Invite
        </button>
      )}
      <h2 style={styles.title} id="quick-post-title">
        {inviting ? "Invite someone" : "Post"}
      </h2>
      <button type="button" style={styles.textBtn} onClick={() => !busy && onClose?.()} aria-label="Close">
        Close
      </button>
    </div>
  );

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
        {header}
        {inviting ? (
          <div style={styles.body} data-testid="quick-post-invite-list">
            <p style={styles.muted}>Share by text or Copy Link. Friends not on Menuply can still open it and RSVP.</p>
            {QUICK_INVITE_PHRASES.map((q) => (
              <button
                key={q.code}
                type="button"
                style={styles.inviteRow}
                onClick={() => onInvite?.(q.code)}
                data-testid={`quick-post-invite-${q.code.toLowerCase()}`}
              >
                {q.phrase}
              </button>
            ))}
          </div>
        ) : (
          <div style={styles.body}>
            {/* Clip tile: Record in the middle, Upload media in the corner. */}
            <div style={styles.tile} data-testid="quick-post-tile">
              {previewUrl ? (
                <video src={previewUrl} style={styles.preview} autoPlay muted loop playsInline data-testid="quick-post-preview" />
              ) : null}
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
              <label style={styles.row}>
                <span style={styles.icon} aria-hidden>
                  🍴
                </span>
                <input
                  type="text"
                  value={food}
                  onChange={(e) => changeFood(e.target.value)}
                  placeholder={made ? "What did you make?" : "What are you eating?"}
                  autoComplete="off"
                  disabled={busy}
                  style={styles.rowInput}
                  data-testid="quick-post-food"
                />
              </label>
              {!dish && place?.restaurant_id && typedFood && dishHits.length ? (
                <ul style={styles.hits}>
                  {dishHits.map((h) => (
                    <li key={h.menu_item_id}>
                      <button type="button" style={styles.hit} onClick={() => pickDish(h)} data-testid={`quick-post-dish-${h.menu_item_id}`}>
                        {dishLabel(h)} <span style={styles.muted}>· on the menu</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {made ? null : (
              <div>
                <div style={styles.row}>
                  <span style={styles.icon} aria-hidden>
                    📍
                  </span>
                  {place || atHome ? (
                    <div style={styles.flex} data-testid="quick-post-place-chosen">
                      <div style={styles.rowText}>{atHome ? "At home" : restaurantLabel(place)}</div>
                      {place ? (
                        <div style={styles.muted}>
                          {place.restaurant_id ? restaurantPlaceMeta(place) : "Not on Menuply yet"}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value.slice(0, 120))}
                      placeholder="Where? (optional)"
                      autoComplete="off"
                      disabled={busy}
                      style={styles.rowInput}
                      aria-label="Where"
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
                      At home
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
                          Use “{typedPlace}” <span style={styles.muted}>· not on Menuply yet</span>
                        </button>
                      </li>
                    ) : null}
                  </ul>
                ) : null}
              </div>
            )}

            <label style={{ ...styles.row, alignItems: "flex-start" }}>
              <span style={{ ...styles.icon, paddingTop: 12 }} aria-hidden>
                💬
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="How is it? (optional)"
                rows={2}
                disabled={busy}
                style={{ ...styles.rowInput, resize: "none", minHeight: 56 }}
                data-testid="quick-post-note"
              />
            </label>

            <div style={styles.chips} role="group" aria-label="Tags">
              {QUICK_POST_TAGS.filter((t) => t.key !== "made" || isAuthenticated).map((t) => {
                const on = tags.includes(t.key);
                return (
                  <button
                    key={t.key}
                    type="button"
                    aria-pressed={on}
                    style={{ ...styles.chip, ...(on ? styles.chipOn : null) }}
                    onClick={() => toggleTag(t.key)}
                    data-testid={`quick-post-tag-${t.key}`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            {needsPlace ? (
              <p style={styles.muted}>Add where it is to post a {recommend ? "recommendation" : "Happy hour"}.</p>
            ) : null}

            <p style={styles.muted}>Public post to Feed</p>
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
        )}
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
    // Above the Feed's mobile header (1300) so Invite / Close stay visible.
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
  title: { margin: 0, fontSize: 18, fontWeight: 800 },
  textBtn: { appearance: "none", border: "none", background: "transparent", color: "#475569", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 6 },
  invitePill: { appearance: "none", border: `1px solid ${GREEN}`, background: "#fff", color: GREEN, borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
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
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { appearance: "none", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  chipOn: { background: GREEN, borderColor: GREEN, color: "#fff" },
  muted: { margin: 0, fontSize: 12, color: "#64748b" },
  error: { margin: 0, fontSize: 13, color: "#b42318", fontWeight: 600 },
  postBtn: { appearance: "none", border: "none", background: GREEN, color: "#fff", borderRadius: 12, padding: "14px 16px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
  inviteRow: { appearance: "none", textAlign: "left", border: "1px solid #dfe5dc", background: "#fff", color: "#111", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
};
