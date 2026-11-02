/**
 * Current Vibe presentation helpers (FE).
 * Machine values/labels prefer backend catalog when provided.
 *
 * Andre 2026-10-28 (menuply-mobile docs/16): Not sure today (default; every day starts here) ·
 * Open for lunch · Open for coffee · Open for dinner · Hungry · Eating @home · Me time (not available).
 * Pick several, except Not sure today / Me time (each stands alone); set for today, hours, days or
 * all week. Old values (open_for_suggestions, im_good, craving, drinks, looking_for_company) read as
 * Not sure today.
 */

export const DEFAULT_CURRENT_VIBE = "not_sure_today";
/** Me time hides the vibe from Connects (was I'm good). */
export const OPT_OUT_CURRENT_VIBE = "me_time";
const LEGACY = new Set(["open_for_suggestions", "im_good", "craving", "drinks", "looking_for_company"]);

/** Fallback catalog if profile payload has no catalog yet (offline / stale session). */
export const FALLBACK_CURRENT_VIBE_CATALOG = Object.freeze([
  { value: "not_sure_today", label: "Not sure today", icon: null, badgeTone: "none", searchEligible: false, exclusive: true },
  { value: "open_for_lunch", label: "Open for lunch", icon: "🥪", badgeTone: "inviting", searchEligible: true, exclusive: false },
  { value: "coffee", label: "Open for coffee", icon: "☕", badgeTone: "warm", searchEligible: true, exclusive: false },
  { value: "open_for_dinner", label: "Open for dinner", icon: "🍝", badgeTone: "inviting", searchEligible: true, exclusive: false },
  { value: "hungry", label: "Hungry", icon: "🍽️", badgeTone: "warm", searchEligible: true, exclusive: false },
  { value: "eating_at_home", label: "Eating @home", icon: "🏠", badgeTone: "warm", searchEligible: false, exclusive: false },
  { value: "me_time", label: "Me time (not available)", icon: "🌙", badgeTone: "muted", searchEligible: false, exclusive: true },
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

/** Tap a chip: Not sure today / Me time stand alone; anything else toggles and clears them. */
export function toggleVibeSet(current, tapped, catalog) {
  const list = resolveCurrentVibeCatalog(catalog);
  const exclusive = new Set(list.filter((e) => e.exclusive).map((e) => e.value));
  if (exclusive.has(tapped)) return [tapped];
  const rest = (current || []).filter((v) => !exclusive.has(v));
  const next = rest.includes(tapped) ? rest.filter((v) => v !== tapped) : [...rest, tapped];
  const order = list.map((e) => e.value);
  return next.length ? next.sort((a, b) => order.indexOf(a) - order.indexOf(b)) : [DEFAULT_CURRENT_VIBE];
}

export function resolveCurrentVibeCatalog(catalog) {
  if (Array.isArray(catalog) && catalog.length) {
    return catalog.map((e) => ({
      value: String(e.value || "").trim(),
      label: String(e.label || e.value || "").trim(),
      icon: e.icon == null || e.icon === "" ? null : String(e.icon),
      badgeTone: String(e.badgeTone || e.badge_tone || "warm"),
      searchEligible: e.searchEligible === true || e.search_eligible === true,
      exclusive: e.exclusive === true || e.value === DEFAULT_CURRENT_VIBE || e.value === OPT_OUT_CURRENT_VIBE,
    }));
  }
  return FALLBACK_CURRENT_VIBE_CATALOG;
}

export function getCurrentVibeEntry(value, catalog) {
  const list = resolveCurrentVibeCatalog(catalog);
  const key = coerceCurrentVibe(value);
  return list.find((e) => e.value === key) || list.find((e) => e.value === DEFAULT_CURRENT_VIBE);
}

/** Not sure today shows no badge; every picked vibe (Me time included) does. */
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
