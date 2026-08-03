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
