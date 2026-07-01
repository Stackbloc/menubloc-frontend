/**
 * Curated sidebar categories for the menu catalog reader (text-only list).
 * IDs map to backend browse_section values.
 */
export const MENU_CATALOG_SIDEBAR = [
  { id: "nearby", label: "Nearby" },
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "pizza", label: "Pizza" },
  { id: "mexican", label: "Mexican" },
  { id: "asian", label: "Asian" },
  { id: "burgers", label: "Burgers" },
  { id: "coffee", label: "Coffee" },
  { id: "desserts", label: "Desserts" },
];

export const MENU_CATALOG_DEFAULT_SECTION = "nearby";

export function toMenuCatalogTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}
