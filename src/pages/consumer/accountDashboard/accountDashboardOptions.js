export const ACCOUNT_TABS = [
  { id: "profile", label: "Profile" },
  { id: "social", label: "Social & Crew" },
  { id: "wallet", label: "Wallet & Activity" },
  { id: "security", label: "Security & Account" },
];

export const DIETARY_OPTIONS = [
  { key: "vegetarian", label: "Vegetarian" },
  { key: "vegan", label: "Vegan" },
  { key: "gluten_free", label: "Gluten-Free" },
  { key: "dairy_free", label: "Dairy-Free" },
  { key: "low_carb", label: "Low-Carb" },
  { key: "high_protein", label: "High protein" },
  { key: "low_sodium", label: "Low sodium" },
  { key: "diabetic_friendly", label: "Diabetic-friendly" },
  { key: "nut_free", label: "Nut-free" },
  { key: "keto", label: "Keto" },
];

export const ALLERGEN_OPTIONS = [
  { key: "peanuts", label: "Peanuts" },
  { key: "tree_nuts", label: "Tree nuts" },
  { key: "dairy", label: "Dairy" },
  { key: "gluten", label: "Gluten" },
  { key: "shellfish", label: "Shellfish" },
  { key: "soy", label: "Soy" },
  { key: "eggs", label: "Eggs" },
  { key: "fish", label: "Fish" },
  { key: "sesame", label: "Sesame" },
  { key: "wheat", label: "Wheat" },
];

export const ALLERGEN_NONE_KEY = "__none__";

export const FOODS_TO_AVOID_OPTIONS = [
  { key: "spicy_foods", label: "Spicy Foods" },
  { key: "mushrooms", label: "Mushrooms" },
  { key: "onions", label: "Onions" },
  { key: "tomatoes", label: "Tomatoes" },
  { key: "olives", label: "Olives" },
  { key: "cilantro", label: "Cilantro" },
  { key: "seafood", label: "Seafood" },
  { key: "anchovies", label: "Anchovies" },
  { key: "blue_cheese", label: "Blue Cheese" },
  { key: "coconut", label: "Coconut" },
  { key: "pickles", label: "Pickles" },
  { key: "organ_meats", label: "Organ Meats" },
  { key: "fried_foods", label: "Fried Foods" },
];

export function normalizeAccountTab(raw) {
  const value = String(raw || "").toLowerCase().trim();
  if (value === "social" || value === "crew") return "social";
  if (value === "wallet" || value === "activity") return "wallet";
  if (value === "security" || value === "account") return "security";
  return "profile";
}

export function selectedLabels(map, options) {
  return options.filter(({ key }) => Boolean(map[key])).map(({ label }) => label);
}

export function formatSummaryList(labels, emptyText = "None selected") {
  if (!labels.length) return emptyText;
  return labels.join(" · ");
}
