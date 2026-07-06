import { getTimeAwareMealChip } from "./homeNextMealChip.js";

/** Large food chips — same visual contract as HomeNextFoodGrid. */
export const FOOD_CHIP_BUTTON_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  minHeight: 52,
  padding: "10px 14px",
  borderRadius: 14,
  border: "1.5px solid var(--gb-color-border)",
  background: "var(--gb-color-surface-strong)",
  color: "var(--gb-color-ink)",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "var(--gb-shadow-soft)",
  whiteSpace: "nowrap",
  flex: "0 0 auto",
};

/** Time-aware meal chip — visually distinct from static food chips. */
export const FOOD_CHIP_CONTEXT_AWARE_STYLE = {
  ...FOOD_CHIP_BUTTON_STYLE,
  border: "1.5px solid rgba(251, 191, 36, 0.55)",
  background: "linear-gradient(180deg, #3d2a06 0%, #5c3d0a 100%)",
  color: "#FEF3C7",
  boxShadow: "0 6px 18px rgba(180, 83, 9, 0.22)",
};

/** Split chips into two independently scrollable rows (preserves column pairing). */
export function splitFoodEntryPointRows(chips) {
  const list = Array.isArray(chips) ? chips : [];
  return [
    list.filter((_, index) => index % 2 === 0),
    list.filter((_, index) => index % 2 === 1),
  ];
}

/** Static food chips — meal slot filled at runtime by getFoodEntryPoints(). */
const FOOD_ENTRY_STATIC = [
  { id: "__meal__", slot: "meal" },
  { id: "pizza", icon: "🍕", label: "Pizza", query: "pizza" },
  { id: "burgers", icon: "🍔", label: "Burgers", query: "burgers" },
  { id: "chicken", icon: "🍗", label: "Chicken", query: "chicken" },
  { id: "salads", icon: "🥗", label: "Salads", query: "salads" },
  { id: "tacos", icon: "🌮", label: "Tacos", query: "tacos" },
  { id: "sandwiches", icon: "🥪", label: "Sandwiches", query: "sandwiches" },
  { id: "asian", icon: "🥡", label: "Asian", query: "asian food" },
  { id: "mexican", icon: "🌮", label: "Mexican", query: "mexican food", cuisine: "mexican" },
  { id: "comfort", icon: "🍲", label: "Comfort Food", query: "comfort food" },
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
        mealPeriod: meal.mealPeriod,
        contextAware: true,
      };
    }
    return { ...entry };
  });
}

/** @deprecated Use getFoodEntryPoints() — kept for tests importing a static list shape. */
export const FOOD_ENTRY_POINTS = getFoodEntryPoints();

/** Health goals — HomeNext set plus legacy intelligence chips (deduped). */
export const HEALTH_GOAL_ENTRY_POINTS = [
  { id: "high-protein", icon: "💪", label: "High Protein", query: "high protein" },
  { id: "low-carb", icon: "🥦", label: "Low Carb", query: "low carb", filterKey: "keto" },
  { id: "low-sodium", icon: "🧂", label: "Low Sodium", query: "low sodium", filterKey: "low_sodium" },
  { id: "vegetarian", icon: "🥗", label: "Vegetarian", query: "vegetarian", filterKey: "vegetarian" },
  { id: "high-fiber", icon: "🌾", label: "High Fiber", query: "high fiber" },
  { id: "under-700", icon: "🔥", label: "Under 700 Calories", query: "under 700 calories" },
  { id: "diabetic", icon: "🩺", label: "Diabetic Friendly", query: "diabetic friendly", filterKey: "diabetic_friendly" },
  { id: "glp1", icon: "🥗", label: "GLP-1 Friendly", query: "", filterKey: "glp1_friendly" },
  { id: "low-fat", icon: "🧈", label: "Low Fat", query: "low fat", filterKey: "low_fat" },
];
