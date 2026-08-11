/**
 * Cluster Food → Drinks subcategory chips (Yellow Browser taxonomy).
 * Alcohol free = non_alcoholic, excluding typical soda brands (server-side).
 */

import { MENU_CATALOG_DRINK_TABS } from "./menuCatalogDrinkCategories.js";

export const CLUSTER_DRINK_SUBCATEGORY_ALL = "all";

export const CLUSTER_DRINK_SUBCATEGORY_CHIPS = [
  { id: CLUSTER_DRINK_SUBCATEGORY_ALL, label: "All" },
  ...MENU_CATALOG_DRINK_TABS.map((tab) =>
    tab.id === "non_alcoholic"
      ? { id: tab.id, label: "Alcohol free" }
      : { id: tab.id, label: tab.label }
  ),
];

/**
 * Yellow Browser drink chips present in this cluster only.
 * Hides empty subcategory chips; hides the whole set when nothing beyond All would show.
 * @param {string[]|null|undefined} availableIds from API available_drink_categories
 */
export function visibleClusterDrinkSubcategoryChips(availableIds) {
  const ids = Array.isArray(availableIds)
    ? availableIds.map((id) => String(id || "").trim().toLowerCase()).filter(Boolean)
    : null;
  if (!ids || ids.length === 0) return [];
  const present = new Set(ids);
  const typed = CLUSTER_DRINK_SUBCATEGORY_CHIPS.filter(
    (chip) => chip.id !== CLUSTER_DRINK_SUBCATEGORY_ALL && present.has(chip.id)
  );
  if (typed.length === 0) return [];
  return [
    CLUSTER_DRINK_SUBCATEGORY_CHIPS.find((chip) => chip.id === CLUSTER_DRINK_SUBCATEGORY_ALL),
    ...typed,
  ].filter(Boolean);
}

/**
 * Prefer membership-scoped available_drink_categories.
 * Never trust legacy full drink_categories advertising lists alone.
 * Fall back to categories present on returned menu items.
 */
export function resolveAvailableDrinkCategoriesFromResponse(data) {
  const typed = Array.isArray(data?.available_drink_categories)
    ? data.available_drink_categories
        .map((id) => String(id || "").trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (typed.length > 0) return typed;

  const fromItems = new Set();
  const items = Array.isArray(data?.menu_items) ? data.menu_items : [];
  for (const item of items) {
    const cats = Array.isArray(item?.drinks_browser_categories)
      ? item.drinks_browser_categories
      : [];
    for (const id of cats) {
      const key = String(id || "").trim().toLowerCase();
      if (key && CLUSTER_DRINK_SUBCATEGORY_CHIPS.some((chip) => chip.id === key)) {
        fromItems.add(key);
      }
    }
  }
  return Array.from(fromItems);
}

export function isClusterBeveragesCategory(category) {
  return String(category?.code || category || "").trim().toUpperCase() === "BEVERAGES";
}

export function normalizeClusterDrinkSubcategory(value) {
  const id = String(value || "").trim().toLowerCase();
  if (!id || id === CLUSTER_DRINK_SUBCATEGORY_ALL) return CLUSTER_DRINK_SUBCATEGORY_ALL;
  return CLUSTER_DRINK_SUBCATEGORY_CHIPS.some((chip) => chip.id === id)
    ? id
    : CLUSTER_DRINK_SUBCATEGORY_ALL;
}
