/** Food-first conversation starters — navigate to search, not rigid categories. */
export const FOOD_ENTRY_POINTS = [
  { id: "chicken", icon: "🍗", label: "Chicken", query: "chicken" },
  { id: "pizza", icon: "🍕", label: "Pizza", query: "pizza" },
  { id: "burgers", icon: "🍔", label: "Burgers", query: "burgers" },
  { id: "breakfast", icon: "🍳", label: "Breakfast", query: "breakfast" },
  { id: "asian", icon: "🥡", label: "Asian", query: "asian" },
  { id: "mexican", icon: "🌮", label: "Mexican", query: "mexican" },
  { id: "comfort", icon: "🍲", label: "Comfort Food", query: "comfort food" },
  { id: "something-else", icon: "✨", label: "Something Else", to: "/waiter" },
];

/** Health-oriented first-class entry points into Food Navigation / search. */
export const HEALTH_GOAL_ENTRY_POINTS = [
  { id: "high-protein", icon: "💪", label: "High Protein", query: "high protein" },
  { id: "low-carb", icon: "🥦", label: "Low Carb", query: "low carb", filterKey: "keto" },
  { id: "low-sodium", icon: "🧂", label: "Low Sodium", query: "low sodium", filterKey: "low_sodium" },
  { id: "vegetarian", icon: "🥗", label: "Vegetarian", query: "vegetarian", filterKey: "vegetarian" },
  { id: "high-fiber", icon: "🌾", label: "High Fiber", query: "high fiber" },
  { id: "under-700", icon: "🔥", label: "Under 700 Calories", query: "under 700 calories" },
];
