/**
 * Current Vibe presentation helpers (FE).
 * Machine values/labels prefer backend catalog when provided.
 *
 * Default: open_for_suggestions (search-eligible with Connects).
 * Opt-out: im_good (I'm Good) — removes suggestion/invitation search surfaces.
 */

export const DEFAULT_CURRENT_VIBE = "open_for_suggestions";
export const OPT_OUT_CURRENT_VIBE = "im_good";

/** Fallback catalog if profile payload has no catalog yet (offline / stale session). */
export const FALLBACK_CURRENT_VIBE_CATALOG = Object.freeze([
  {
    value: "open_for_suggestions",
    label: "Open for suggestions",
    icon: "💬",
    badgeTone: "inviting",
    searchEligible: true,
  },
  { value: "im_good", label: "I'm good", icon: null, badgeTone: "none", searchEligible: false },
  { value: "hungry", label: "Hungry", icon: "🍽️", badgeTone: "warm", searchEligible: true },
  { value: "craving", label: "Craving something", icon: "😋", badgeTone: "warm", searchEligible: true },
  { value: "coffee", label: "Coffee", icon: "☕", badgeTone: "warm", searchEligible: true },
  { value: "drinks", label: "Drinks", icon: "🍹", badgeTone: "warm", searchEligible: true },
  { value: "going_out", label: "Going out", icon: "🎉", badgeTone: "inviting", searchEligible: true },
  { value: "me_time", label: "Me time", icon: "🌙", badgeTone: "muted", searchEligible: false },
  {
    value: "looking_for_company",
    label: "Looking for company",
    icon: "👋",
    badgeTone: "inviting",
    searchEligible: true,
  },
  {
    value: "eating_at_home",
    label: "Eating at home",
    icon: "🏠",
    badgeTone: "warm",
    searchEligible: false,
  },
  { value: "cheap_eats", label: "Cheap eats", icon: "💵", badgeTone: "warm", searchEligible: true },
  { value: "treat_myself", label: "Treat myself", icon: "✨", badgeTone: "warm", searchEligible: true },
]);

export function coerceCurrentVibe(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  if (!key) return DEFAULT_CURRENT_VIBE;
  const hit = FALLBACK_CURRENT_VIBE_CATALOG.find((e) => e.value === key);
  return hit ? key : DEFAULT_CURRENT_VIBE;
}

export function resolveCurrentVibeCatalog(catalog) {
  if (Array.isArray(catalog) && catalog.length) {
    return catalog.map((e) => ({
      value: String(e.value || "").trim(),
      label: String(e.label || e.value || "").trim(),
      icon: e.icon == null || e.icon === "" ? null : String(e.icon),
      badgeTone: String(e.badgeTone || e.badge_tone || "warm"),
      searchEligible: e.searchEligible === true || e.search_eligible === true,
    }));
  }
  return FALLBACK_CURRENT_VIBE_CATALOG;
}

export function getCurrentVibeEntry(value, catalog) {
  const list = resolveCurrentVibeCatalog(catalog);
  const key = coerceCurrentVibe(value);
  return list.find((e) => e.value === key) || list.find((e) => e.value === DEFAULT_CURRENT_VIBE);
}

/** I'm Good (opt-out) shows no badge. Open for suggestions and other vibes do. */
export function showsCurrentVibeBadge(value) {
  return coerceCurrentVibe(value) !== OPT_OUT_CURRENT_VIBE;
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
