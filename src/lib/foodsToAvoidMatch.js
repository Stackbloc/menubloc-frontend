/**
 * Foods I Avoid — preference matching (NOT allergens).
 *
 * Allergens hard-hide conflicting menu items. Avoid keys stay on the menu and
 * surface a soft “may contain” advisory when the dish text (or type defaults)
 * suggests a match.
 */

/** Display labels keyed by avoid_key (Account Settings “Foods I Avoid”). */
export const FOODS_TO_AVOID_LABELS = Object.freeze({
  spicy_foods: "Spicy Foods",
  mushrooms: "Mushrooms",
  onions: "Onions",
  tomatoes: "Tomatoes",
  olives: "Olives",
  cilantro: "Cilantro",
  seafood: "Seafood",
  anchovies: "Anchovies",
  blue_cheese: "Blue Cheese",
  coconut: "Coconut",
  pickles: "Pickles",
  organ_meats: "Organ Meats",
  fried_foods: "Fried Foods",
});

/** Map avoid_key → ingredient display name(s) for type-default lists. */
export const AVOID_KEY_TO_INGREDIENTS = Object.freeze({
  onions: ["Onion", "Onions", "Caramelized Onions", "Red Onion"],
  tomatoes: ["Tomato", "Tomatoes"],
  pickles: ["Pickles", "Pickle"],
  cilantro: ["Cilantro"],
  mushrooms: ["Mushrooms", "Mushroom"],
  olives: ["Olives", "Olive"],
  anchovies: ["Anchovies", "Anchovy"],
  blue_cheese: ["Blue Cheese"],
  coconut: ["Coconut"],
  seafood: ["Seafood", "Shrimp", "Crab", "Lobster", "Clams"],
  organ_meats: ["Liver", "Kidneys", "Organ Meats"],
  spicy_foods: ["Jalapeño", "Hot Sauce", "Sriracha", "Chili", "Peppers"],
  fried_foods: [],
});

/** Keyword patterns against item name + description. */
const AVOID_KEY_TEXT_PATTERNS = Object.freeze({
  mushrooms: [/\bmushrooms?\b/i],
  onions: [/\bonions?\b/i, /\bshallots?\b/i],
  tomatoes: [/\btomatoes?\b/i],
  olives: [/\bolives?\b/i],
  cilantro: [/\bcilantro\b/i, /\bcoriander\b/i],
  seafood: [/\bseafood\b/i, /\bshrimp\b/i, /\bcrab\b/i, /\blobster\b/i, /\bclams?\b/i, /\bmussels?\b/i, /\bscallops?\b/i],
  anchovies: [/\banchov(?:y|ies)\b/i],
  blue_cheese: [/\bblue\s*cheese\b/i, /\bgorgonzola\b/i, /\broquefort\b/i],
  coconut: [/\bcoconut\b/i],
  pickles: [/\bpickles?\b/i],
  organ_meats: [/\bliver\b/i, /\bkidneys?\b/i, /\boxtail\b/i, /\btripe\b/i],
  spicy_foods: [/\bspicy\b/i, /\bjalape[nñ]o/i, /\bhot\s+sauce\b/i, /\bsriracha\b/i, /\bchili\b/i, /\bhabanero\b/i],
  fried_foods: [/\bfried\b/i, /\btempura\b/i, /\bbattered\b/i, /\bdeep[\s-]?fried\b/i],
});

const CUSTOMIZABLE_TYPES = new Set([
  "BURGERS",
  "SANDWICHES",
  "TACOS",
  "PIZZA",
  "BOWLS",
  "SALADS",
]);

const TYPE_KEYWORDS = [
  { pattern: /\bburger\b/i, type: "BURGERS" },
  { pattern: /\bcheeseburger\b/i, type: "BURGERS" },
  { pattern: /\bsandwich|sub\b|hoagie|grinder/i, type: "SANDWICHES" },
  { pattern: /\bwrap\b/i, type: "SANDWICHES" },
  { pattern: /\btaco\b/i, type: "TACOS" },
  { pattern: /\bburrito\b/i, type: "TACOS" },
  { pattern: /\bquesadilla\b/i, type: "TACOS" },
  { pattern: /\bpizza\b/i, type: "PIZZA" },
  { pattern: /\bowl\b/i, type: "BOWLS" },
  { pattern: /\bsalad\b/i, type: "SALADS" },
  { pattern: /\bhot dog\b/i, type: "SANDWICHES" },
];

const DEFAULT_INGREDIENTS = Object.freeze({
  BURGERS: ["Bun", "Beef Patty", "Lettuce", "Tomato", "Onion", "Pickles", "Sauce"],
  SANDWICHES: ["Bread", "Protein", "Lettuce", "Tomato", "Onion", "Mayo"],
  TACOS: ["Tortilla", "Protein", "Onion", "Cilantro", "Salsa"],
  PIZZA: ["Crust", "Sauce", "Cheese", "Toppings"],
  BOWLS: ["Base", "Protein", "Vegetables", "Sauce"],
  SALADS: ["Greens", "Toppings", "Dressing"],
});

/**
 * @param {object|null|undefined} item
 * @returns {string|null}
 */
export function detectCustomizableItemType(item) {
  const name = String(item?.name || item?.item_name || "").toLowerCase();
  const section = String(item?.section_name || item?.section_header || item?.category || "").toLowerCase();
  const mksCode = String(item?.mks_category || item?.mksCategory || "").toUpperCase();

  if (CUSTOMIZABLE_TYPES.has(mksCode)) return mksCode;

  for (const { pattern, type } of TYPE_KEYWORDS) {
    if (pattern.test(name) || pattern.test(section)) return type;
  }

  return null;
}

function itemTextBlob(item) {
  return [
    item?.name,
    item?.item_name,
    item?.description,
    item?.notes,
    item?.section_name,
    item?.section_header,
    item?.category,
  ]
    .map((v) => String(v || "").trim())
    .filter(Boolean)
    .join(" ");
}

/**
 * @param {object|null|undefined} item
 * @param {string[]|null|undefined} foodsToAvoidKeys
 * @param {{ includeTypeDefaults?: boolean }} [options]
 * @returns {{ key: string, label: string }[]}
 */
export function matchAvoidedIngredients(item, foodsToAvoidKeys, options = {}) {
  const includeTypeDefaults = options.includeTypeDefaults !== false;
  const keys = Array.isArray(foodsToAvoidKeys)
    ? foodsToAvoidKeys.map((k) => String(k || "").trim()).filter(Boolean)
    : [];
  if (!keys.length || !item) return [];

  const blob = itemTextBlob(item);
  const type = includeTypeDefaults ? detectCustomizableItemType(item) : null;
  const defaults = type ? DEFAULT_INGREDIENTS[type] || [] : [];
  const hits = [];
  const seen = new Set();

  for (const key of keys) {
    if (seen.has(key)) continue;
    const label = FOODS_TO_AVOID_LABELS[key];
    if (!label) continue;

    const patterns = AVOID_KEY_TEXT_PATTERNS[key] || [];
    const textHit = patterns.some((re) => re.test(blob));

    let defaultHit = false;
    if (!textHit && defaults.length) {
      const matchNames = AVOID_KEY_TO_INGREDIENTS[key] || [];
      defaultHit = defaults.some((ingredient) =>
        matchNames.some((m) => ingredient.toLowerCase().includes(m.toLowerCase())),
      );
    }

    if (textHit || defaultHit) {
      seen.add(key);
      hits.push({ key, label });
    }
  }

  return hits;
}

/**
 * @param {string[]|null|undefined} ingredients
 * @param {string[]|null|undefined} foodsToAvoidKeys
 * @returns {{ key: string, ingredient: string }[]}
 */
export function findAvoidedInIngredientList(ingredients, foodsToAvoidKeys) {
  const avoidedSet = new Set(
    Array.isArray(foodsToAvoidKeys) ? foodsToAvoidKeys.map((k) => String(k || "").trim()).filter(Boolean) : [],
  );
  const list = Array.isArray(ingredients) ? ingredients : [];
  const hits = [];
  for (const key of avoidedSet) {
    const matchNames = AVOID_KEY_TO_INGREDIENTS[key] || [];
    for (const ingredient of list) {
      if (matchNames.some((m) => String(ingredient).toLowerCase().includes(m.toLowerCase()))) {
        hits.push({ key, ingredient: String(ingredient) });
      }
    }
  }
  return hits;
}
