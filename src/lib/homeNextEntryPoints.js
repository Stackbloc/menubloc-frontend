import { getTimeAwareMealChip } from "./homeNextMealChip.js";

/** Static food chips — meal slot filled at runtime by getFoodEntryPoints(). */
const FOOD_ENTRY_STATIC = [
  { id: "chicken", icon: "🍗", label: "Chicken", query: "chicken" },
  { id: "pizza", icon: "🍕", label: "Pizza", query: "pizza" },
  { id: "burgers", icon: "🍔", label: "Burgers", query: "burgers" },
  { id: "__meal__", slot: "meal" },
  { id: "salads", icon: "🥗", label: "Salads", query: "salads" },
  { id: "tacos", icon: "🌮", label: "Tacos", query: "tacos" },
  { id: "sandwiches", icon: "🥪", label: "Sandwiches", query: "sandwiches" },
  { id: "asian", icon: "🥡", label: "Asian", query: "asian food", cuisine: "asian" },
  { id: "mexican", icon: "🌮", label: "Mexican", query: "mexican food", cuisine: "mexican" },
  { id: "comfort", icon: "🍲", label: "Comfort Food", query: "comfort food" },
  { id: "something-else", icon: "✨", label: "Something Else", to: "/waiter" },
];

export function getFoodEntryPoints(now = new Date()) {
  const meal = getTimeAwareMealChip(now);
  return FOOD_ENTRY_STATIC.map((entry) => {
    if (entry.slot === "meal") {
      return {
        id: meal.id,
        icon: meal.icon,
        label: meal.label,
        query: meal.query,
      };
    }
    return { ...entry };
  });
}

/** Health-oriented first-class entry points into search / filters. */
export const HEALTH_GOAL_ENTRY_POINTS = [
  { id: "high-protein", icon: "💪", label: "High Protein", query: "high protein" },
  { id: "low-carb", icon: "🥦", label: "Low Carb", query: "low carb", filterKey: "keto" },
  { id: "low-sodium", icon: "🧂", label: "Low Sodium", query: "low sodium", filterKey: "low_sodium" },
  { id: "vegetarian", icon: "🥗", label: "Vegetarian", query: "vegetarian", filterKey: "vegetarian" },
  { id: "high-fiber", icon: "🌾", label: "High Fiber", query: "high fiber" },
  { id: "under-700", icon: "🔥", label: "Under 700 Calories", query: "under 700 calories" },
];

/** Documentation / audit table for chip routing. */
export const HOME_CHIP_ROUTING_TABLE = [
  ...getFoodEntryPoints().map((c) => ({
    chip: c.label,
    route: c.to || `/search?q=${encodeURIComponent(c.query || "")}${c.cuisine ? `&cuisine=${c.cuisine}` : ""}`,
    notes: c.to ? "Waiter guided navigation" : c.cuisine ? "Cuisine-scoped search" : "Dish intent search",
  })),
  ...HEALTH_GOAL_ENTRY_POINTS.map((c) => ({
    chip: c.label,
    route: `/search?q=${encodeURIComponent(c.query || "")}${c.filterKey ? `&${c.filterKey}=1` : ""}`,
    notes: c.filterKey ? "Query + dietary filter param" : "Nutrition intent search",
  })),
];
