/**
 * Cluster Food filters that live in the URL so shared links reopen on the same view:
 *   ?q=<text>              food search
 *   ?category=<MKS code>   tapped food category (e.g. PASTA)
 *   ?drink=<chip id>       Drinks subcategory (only with category=BEVERAGES)
 *
 * Pure (no DOM) — shared by ClusterPage, shareUtils and the Vercel middleware.
 */

import { MKS_CATEGORIES } from "../mks/mksCategories.js";
import {
  CLUSTER_DRINK_SUBCATEGORY_ALL,
  CLUSTER_DRINK_SUBCATEGORY_CHIPS,
  normalizeClusterDrinkSubcategory,
} from "./clusterDrinkSubcategories.js";

export const CLUSTER_SEARCH_QUERY_KEY = "q";
export const CLUSTER_CATEGORY_QUERY_KEY = "category";
export const CLUSTER_DRINK_QUERY_KEY = "drink";

function clean(value, max = 80) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizeClusterCategoryCode(value) {
  const code = clean(value, 40).toUpperCase();
  return /^[A-Z0-9_]+$/.test(code) ? code : "";
}

export function clusterCategoryLabel(code) {
  const known = MKS_CATEGORIES.find((category) => category.code === code);
  if (known) return known.label;
  return code
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** { query, categoryCode, drink, label } from URLSearchParams; label is what the link is "about". */
export function readClusterShareFilters(searchParams) {
  const query = clean(searchParams?.get(CLUSTER_SEARCH_QUERY_KEY));
  if (query) return { query, categoryCode: "", drink: CLUSTER_DRINK_SUBCATEGORY_ALL, label: query };

  const categoryCode = normalizeClusterCategoryCode(searchParams?.get(CLUSTER_CATEGORY_QUERY_KEY));
  if (!categoryCode) return { query: "", categoryCode: "", drink: CLUSTER_DRINK_SUBCATEGORY_ALL, label: "" };

  const drink = normalizeClusterDrinkSubcategory(searchParams?.get(CLUSTER_DRINK_QUERY_KEY));
  const drinkChip =
    drink !== CLUSTER_DRINK_SUBCATEGORY_ALL
      ? CLUSTER_DRINK_SUBCATEGORY_CHIPS.find((chip) => chip.id === drink)
      : null;
  return {
    query: "",
    categoryCode,
    drink,
    label: drinkChip?.label || clusterCategoryLabel(categoryCode),
  };
}

/** Query string ("" or "?…") that reproduces the filters on a cluster path. */
export function clusterShareSearch(filters) {
  const params = new URLSearchParams();
  if (filters?.query) {
    params.set(CLUSTER_SEARCH_QUERY_KEY, filters.query);
  } else if (filters?.categoryCode) {
    params.set(CLUSTER_CATEGORY_QUERY_KEY, filters.categoryCode);
    if (filters.drink && filters.drink !== CLUSTER_DRINK_SUBCATEGORY_ALL) {
      params.set(CLUSTER_DRINK_QUERY_KEY, filters.drink);
    }
  }
  const qs = params.toString().replace(/\+/g, "%20");
  return qs ? `?${qs}` : "";
}
