/**
 * Favorite foods — structured taxonomy keys (not emoji).
 * Mirrors backend dinerFavoriteFoods.js for offline/editor defaults.
 */

import { iconForFoodInterest, labelWithFoodIcon } from "./foodInterestIcons.js";

export const MAX_FAVORITES = 12;

export const FAVORITE_FOOD_TYPE_OPTIONS = Object.freeze([
  { key: "burger", label: "Burgers", kind: "food_type" },
  { key: "taco", label: "Tacos", kind: "food_type" },
  { key: "pizza", label: "Pizza", kind: "food_type" },
  { key: "sushi", label: "Sushi", kind: "food_type" },
  { key: "noodles", label: "Noodles", kind: "food_type" },
  { key: "chicken", label: "Chicken", kind: "food_type" },
  { key: "steak", label: "Steak", kind: "food_type" },
  { key: "seafood", label: "Seafood", kind: "food_type" },
  { key: "salad", label: "Salads", kind: "food_type" },
  { key: "sandwich", label: "Sandwiches", kind: "food_type" },
  { key: "bbq", label: "BBQ", kind: "food_type" },
  { key: "dessert", label: "Desserts", kind: "food_type" },
  { key: "coffee", label: "Coffee", kind: "food_type" },
  { key: "breakfast", label: "Breakfast", kind: "food_type" },
]);

export const FAVORITE_CUISINE_OPTIONS = Object.freeze([
  { key: "mexican", label: "Mexican", kind: "cuisine" },
  { key: "italian", label: "Italian", kind: "cuisine" },
  { key: "chinese", label: "Chinese", kind: "cuisine" },
  { key: "japanese", label: "Japanese", kind: "cuisine" },
  { key: "korean", label: "Korean", kind: "cuisine" },
  { key: "thai", label: "Thai", kind: "cuisine" },
  { key: "vietnamese", label: "Vietnamese", kind: "cuisine" },
  { key: "indian", label: "Indian", kind: "cuisine" },
  { key: "american", label: "American", kind: "cuisine" },
  { key: "mediterranean", label: "Mediterranean", kind: "cuisine" },
]);

export const ALL_FAVORITE_FOOD_OPTIONS = Object.freeze([
  ...FAVORITE_FOOD_TYPE_OPTIONS,
  ...FAVORITE_CUISINE_OPTIONS,
]);

export function normalizeFavoriteFoods(list) {
  if (!Array.isArray(list)) return [];
  const byKey = Object.fromEntries(ALL_FAVORITE_FOOD_OPTIONS.map((o) => [o.key, o]));
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key =
      typeof item === "string"
        ? item.trim().toLowerCase().replace(/[ -]+/g, "_")
        : String(item?.key || "")
            .trim()
            .toLowerCase()
            .replace(/[ -]+/g, "_");
    const opt = byKey[key];
    if (!opt || seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: opt.kind, key: opt.key, label: opt.label, icon: iconForFoodInterest(opt.key) });
    if (out.length >= MAX_FAVORITES) break;
  }
  return out;
}

export function summarizeFavoriteFoods(list) {
  const rows = normalizeFavoriteFoods(list);
  if (!rows.length) return "None yet — tap foods you love to unlock better discovery";
  return rows.map((r) => labelWithFoodIcon(r.key, r.label)).join(" · ");
}
