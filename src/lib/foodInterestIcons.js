/**
 * Food interest icons — presentation only. Stored values are taxonomy keys.
 */

export const FOOD_INTEREST_ICONS = Object.freeze({
  burger: "🍔",
  taco: "🌮",
  pizza: "🍕",
  sushi: "🍣",
  noodles: "🍜",
  chicken: "🍗",
  steak: "🥩",
  seafood: "🍤",
  salad: "🥗",
  sandwich: "🥪",
  bbq: "🍖",
  dessert: "🍰",
  coffee: "☕",
  breakfast: "🥞",
  mexican: "🌮",
  italian: "🍝",
  chinese: "🥡",
  japanese: "🍣",
  korean: "🍲",
  thai: "🍛",
  vietnamese: "🍜",
  indian: "🍛",
  american: "🍔",
  mediterranean: "🫒",
});

export function iconForFoodInterest(key) {
  const k = String(key || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  return FOOD_INTEREST_ICONS[k] || "🍽️";
}

/** Infer icon from free-text food name (presentation only). */
export function iconForFoodText(text) {
  const raw = String(text || "").toLowerCase();
  if (!raw) return "🍽️";
  const keys = Object.keys(FOOD_INTEREST_ICONS);
  for (const key of keys) {
    const needle = key.replace(/_/g, " ");
    if (raw.includes(needle) || raw.includes(key)) {
      return FOOD_INTEREST_ICONS[key];
    }
  }
  if (/\btaco/.test(raw)) return "🌮";
  if (/\bburger|smash/.test(raw)) return "🍔";
  if (/\bpizza/.test(raw)) return "🍕";
  if (/\bsushi|sashimi/.test(raw)) return "🍣";
  if (/\bnoodle|ramen|pho|udon/.test(raw)) return "🍜";
  if (/\bchicken|wings/.test(raw)) return "🍗";
  if (/\bsteak|ribeye/.test(raw)) return "🥩";
  if (/\bshrimp|seafood|fish|salmon/.test(raw)) return "🍤";
  return "🍽️";
}

export function labelWithFoodIcon(key, label) {
  return `${iconForFoodInterest(key)} ${String(label || key || "").trim() || key}`;
}
