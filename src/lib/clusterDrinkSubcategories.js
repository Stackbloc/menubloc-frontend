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
