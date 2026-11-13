/**
 * Current Vibe presentation helpers (FE).
 * Machine values/labels prefer backend catalog when provided.
 *
 * Andre 2026-10-28 (menuply-mobile docs/16): Open for lunch · Open for coffee · Open for dinner ·
 * Hungry · Eating at home. Pick several; set for today, hours, days or all week. Old values
 * (open_for_suggestions, im_good, craving, drinks, looking_for_company) read as no vibe.
 *
 * Andre 2026-11-13 (plan 41, app parity): the picker no longer offers Me time or Not sure today.
 * "not_sure_today" stays only as the internal "no vibe" value (no chip, no badge); a saved Me time
 * reads as no vibe. Profile's My Vibe card (MyVibeCard.jsx) replaces these chips on the app layout.
 */

/** No vibe (was "Not sure today"): never a chip, never a badge. */
export const DEFAULT_CURRENT_VIBE = "not_sure_today";
/** Me time is gone (2026-11-13); kept as a name so old saved values read as no vibe. */
export const OPT_OUT_CURRENT_VIBE = "me_time";
const LEGACY = new Set(["open_for_suggestions", "im_good", "craving", "drinks", "looking_for_company", "me_time"]);
const DROPPED = new Set([DEFAULT_CURRENT_VIBE, OPT_OUT_CURRENT_VIBE]);
const NO_VIBE_ENTRY = Object.freeze({ value: DEFAULT_CURRENT_VIBE, label: "No vibe", icon: null, badgeTone: "none", searchEligible: false, exclusive: true });

/** Fallback catalog if profile payload has no catalog yet (offline / stale session). */
export const FALLBACK_CURRENT_VIBE_CATALOG = Object.freeze([
  { value: "open_for_lunch", label: "Open for lunch", icon: "🥪", badgeTone: "inviting", searchEligible: true, exclusive: false },
  { value: "coffee", label: "Open for coffee", icon: "☕", badgeTone: "warm", searchEligible: true, exclusive: false },
  { value: "open_for_dinner", label: "Open for dinner", icon: "🍝", badgeTone: "inviting", searchEligible: true, exclusive: false },
  { value: "hungry", label: "Hungry", icon: "🍽️", badgeTone: "warm", searchEligible: true, exclusive: false },
  { value: "eating_at_home", label: "Eating at home", icon: "🏠", badgeTone: "warm", searchEligible: false, exclusive: false },
]);

export function coerceCurrentVibe(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  if (!key || LEGACY.has(key)) return DEFAULT_CURRENT_VIBE;
  const hit = FALLBACK_CURRENT_VIBE_CATALOG.find((e) => e.value === key);
  return hit ? key : DEFAULT_CURRENT_VIBE;
}

/** Tap a chip: it toggles; nothing left = no vibe. */
export function toggleVibeSet(current, tapped, catalog) {
  const list = resolveCurrentVibeCatalog(catalog);
  if (DROPPED.has(tapped)) return [DEFAULT_CURRENT_VIBE];
  const rest = (current || []).filter((v) => !DROPPED.has(v));
  const next = rest.includes(tapped) ? rest.filter((v) => v !== tapped) : [...rest, tapped];
  const order = list.map((e) => e.value);
  return next.length ? next.sort((a, b) => order.indexOf(a) - order.indexOf(b)) : [DEFAULT_CURRENT_VIBE];
}

export function resolveCurrentVibeCatalog(catalog) {
  if (Array.isArray(catalog) && catalog.length) {
    const rows = catalog.filter((e) => !DROPPED.has(String(e?.value || "").trim()));
    if (!rows.length) return FALLBACK_CURRENT_VIBE_CATALOG;
    return rows.map((e) => ({
      value: String(e.value || "").trim(),
      label: String(e.label || e.value || "").trim(),
      icon: e.icon == null || e.icon === "" ? null : String(e.icon),
      badgeTone: String(e.badgeTone || e.badge_tone || "warm"),
      searchEligible: e.searchEligible === true || e.search_eligible === true,
      exclusive: false,
    }));
  }
  return FALLBACK_CURRENT_VIBE_CATALOG;
}

export function getCurrentVibeEntry(value, catalog) {
  const list = resolveCurrentVibeCatalog(catalog);
  const key = coerceCurrentVibe(value);
  return list.find((e) => e.value === key) || NO_VIBE_ENTRY;
}

/** No vibe shows no badge; every picked vibe does. */
export function showsCurrentVibeBadge(value) {
  return coerceCurrentVibe(value) !== DEFAULT_CURRENT_VIBE;
}

export function badgeToneStyles(tone) {
  const t = String(tone || "warm");
  if (t === "muted") {
    return {
      background: "#e5e7eb",
      border: "2px solid #fff",
      boxShadow: "0 1px 4px rgba(15, 23, 42, 0.18)",
      filter: "grayscale(0.35)",
      opacity: 0.92,
    };
  }
  if (t === "inviting") {
    return {
      background: "#fef3c7",
      border: "2px solid #fff",
      boxShadow: "0 1px 4px rgba(180, 83, 9, 0.25)",
    };
  }
  return {
    background: "#fff7ed",
    border: "2px solid #fff",
    boxShadow: "0 1px 4px rgba(154, 52, 18, 0.2)",
  };
}
