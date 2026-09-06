/**
 * Map Yellow Browse free-text / chip intent to an existing browse_section
 * or fall through to global /search — no new search engine.
 */

import { MENU_CATALOG_BROWSE_SECTION_IDS } from "./menuCatalogCategories.js";

/** Cuisine / food aliases → backend browse_section ids already supported by /menus/browse. */
export const MENU_BROWSER_INTENT_ALIASES = Object.freeze({
  italian: "italian",
  pasta: "italian",
  mexican: "mexican",
  mexico: "mexican",
  tacos: "mexican",
  taco: "mexican",
  burrito: "mexican",
  burritos: "mexican",
  sushi: "sushi",
  japanese: "sushi",
  burger: "burgers",
  burgers: "burgers",
  pizza: "pizza",
  korean: "asian",
  asian: "asian",
  chinese: "asian",
  thai: "asian",
  vietnamese: "asian",
  vegetarian: "vegetarian",
  vegan: "vegan",
  steak: "american",
  steaks: "american",
  bbq: "bbq",
  barbecue: "bbq",
  seafood: "seafood",
  coffee: "coffee",
  dessert: "desserts",
  desserts: "desserts",
  sandwich: "sandwiches",
  sandwiches: "sandwiches",
  breakfast: "breakfast",
  brunch: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  nearby: "nearby",
  qsr: "qsr",
  "fast food": "qsr",
  "dine in": "dine_in",
  american: "american",
});

export const MENU_BROWSER_EXPLORE_CHIPS = Object.freeze([
  { label: "Italian", query: "Italian" },
  { label: "Mexican", query: "Mexican" },
  { label: "Sushi", query: "sushi" },
  { label: "Burgers", query: "burgers" },
  { label: "Pizza", query: "pizza" },
  { label: "Korean", query: "Korean" },
  { label: "Tacos", query: "tacos" },
  { label: "Steak", query: "steak" },
  { label: "Vegetarian", query: "vegetarian" },
]);

function normalizeIntentQuery(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * @returns {{ kind: "section", sectionId: string, q: string } | { kind: "search", q: string }}
 */
export function resolveMenuBrowserSearchIntent(rawQuery) {
  const q = String(rawQuery || "").trim();
  const key = normalizeIntentQuery(q);
  if (!key) {
    return { kind: "section", sectionId: "nearby", q: "" };
  }

  const aliased = MENU_BROWSER_INTENT_ALIASES[key];
  if (aliased && MENU_CATALOG_BROWSE_SECTION_IDS.has(aliased)) {
    return { kind: "section", sectionId: aliased, q };
  }

  const first = key.split(" ")[0];
  const firstAlias = MENU_BROWSER_INTENT_ALIASES[first];
  if (firstAlias && MENU_CATALOG_BROWSE_SECTION_IDS.has(firstAlias) && key.split(" ").length <= 2) {
    return { kind: "section", sectionId: firstAlias, q };
  }

  return { kind: "search", q };
}
