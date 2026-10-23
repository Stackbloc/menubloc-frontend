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

/** Alcoholic drink chips; everything else (coffee, tea, juice…) is non-alcoholic. */
const ALCOHOLIC_DRINK_CATEGORY_IDS = new Set(["cocktails", "beer", "wine", "spirits"]);

/** College clusters (USC, UCLA, any type "university") list non-alcoholic drinks first. */
export function isUniversityCluster(cluster) {
  return String(cluster?.type || cluster?.cluster_type || "")
    .trim()
    .toLowerCase() === "university";
}

function isAlcoholicDrinkItem(item) {
  const cats = Array.isArray(item?.drinks_browser_categories) ? item.drinks_browser_categories : [];
  if (cats.includes("mocktails")) return false;
  return cats.some((id) => ALCOHOLIC_DRINK_CATEGORY_IDS.has(id));
}

/** Stable: coffee / tea / other non-alcoholic drinks before alcohol, price order kept in each group. */
export function sortNonAlcoholicDrinksFirst(items) {
  if (!Array.isArray(items)) return items;
  const nonAlcoholic = [];
  const alcoholic = [];
  for (const item of items) (isAlcoholicDrinkItem(item) ? alcoholic : nonAlcoholic).push(item);
  return [...nonAlcoholic, ...alcoholic];
}

function isAlcoholicChip(chip) {
  return ALCOHOLIC_DRINK_CATEGORY_IDS.has(chip.id) || chip.id === "happy_hour";
}

/**
 * Yellow Browser drink chips present in this cluster only.
 * Hides empty subcategory chips; hides the whole set when nothing beyond All would show.
 * @param {string[]|null|undefined} availableIds from API available_drink_categories
 * @param {{ nonAlcoholicFirst?: boolean }} [options] college clusters: Coffee, Tea… before Cocktails, Beer…
 */
export function visibleClusterDrinkSubcategoryChips(availableIds, { nonAlcoholicFirst = false } = {}) {
  const ids = Array.isArray(availableIds)
    ? availableIds.map((id) => String(id || "").trim().toLowerCase()).filter(Boolean)
    : null;
  if (!ids || ids.length === 0) return [];
  const present = new Set(ids);
  const typed = CLUSTER_DRINK_SUBCATEGORY_CHIPS.filter(
    (chip) => chip.id !== CLUSTER_DRINK_SUBCATEGORY_ALL && present.has(chip.id)
  );
  if (typed.length === 0) return [];
  const ordered = nonAlcoholicFirst
    ? [...typed.filter((chip) => !isAlcoholicChip(chip)), ...typed.filter(isAlcoholicChip)]
    : typed;
  return [
    CLUSTER_DRINK_SUBCATEGORY_CHIPS.find((chip) => chip.id === CLUSTER_DRINK_SUBCATEGORY_ALL),
    ...ordered,
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
