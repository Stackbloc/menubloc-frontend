/**
 * Drinks-mode category tabs for the Yellow Browser.
 * Kept separate from food categories so the Food browser stays locked.
 */

export const MENU_CATALOG_DRINK_TABS = [
  { id: "cocktails", label: "Cocktails", accent: "#9333ea" },
  { id: "beer", label: "Beer", accent: "#ca8a04" },
  { id: "wine", label: "Wine", accent: "#be123c" },
  { id: "spirits", label: "Spirits", accent: "#92400e" },
  { id: "coffee", label: "Coffee", accent: "#78716c" },
  { id: "tea", label: "Tea", accent: "#16a34a" },
  { id: "smoothies", label: "Smoothies", accent: "#f97316" },
  { id: "juice", label: "Juice", accent: "#eab308" },
  { id: "mocktails", label: "Mocktails", accent: "#ec4899" },
  { id: "non_alcoholic", label: "Non-Alcoholic", accent: "#0ea5e9" },
  { id: "happy_hour", label: "Happy Hour", accent: "#f59e0b" },
];

export const MENU_CATALOG_DRINKS_DEFAULT_SECTION = "cocktails";

export function getDrinkCatalogTab(sectionId) {
  return MENU_CATALOG_DRINK_TABS.find((tab) => tab.id === sectionId) || null;
}

export function isDrinksCatalogSection(sectionId) {
  return MENU_CATALOG_DRINK_TABS.some((entry) => entry.id === sectionId);
}

export function toDrinkCatalogTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}
