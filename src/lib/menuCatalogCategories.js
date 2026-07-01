/**
 * Top-tab categories for the menu catalog reader.
 * IDs map to backend browse_section values.
 */
export const MENU_CATALOG_TABS = [
  { id: "nearby", label: "Nearby" },
  { id: "trending", label: "Trending" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "pizza", label: "Pizza" },
  { id: "burgers", label: "Burgers" },
  { id: "mexican", label: "Mexican" },
  { id: "asian", label: "Asian" },
  { id: "italian", label: "Italian" },
  { id: "sushi", label: "Sushi" },
  { id: "bbq", label: "BBQ" },
  { id: "sandwiches", label: "Sandwiches" },
  { id: "coffee", label: "Coffee" },
  { id: "desserts", label: "Desserts" },
  { id: "happy_hour", label: "Deals" },
];

/** @deprecated use MENU_CATALOG_TABS */
export const MENU_CATALOG_SIDEBAR = MENU_CATALOG_TABS;

export const MENU_CATALOG_DEFAULT_SECTION = "nearby";

/** Show swipe coach on menus at index 0 … this value (inclusive). */
export const MENU_CATALOG_SWIPE_HINT_MAX_INDEX = 2;

export function toMenuCatalogTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}
