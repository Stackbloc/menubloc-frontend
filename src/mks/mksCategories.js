// menubloc-frontend/src/mks/mksCategories.js
// MKS 3.0 (menu-native ordering)

export const MKS_CATEGORIES = [
  { code: "SPECIALS", label: "Specials", order: 10 },

  { code: "BREAKFAST", label: "Breakfast", order: 20 },
  { code: "BRUNCH", label: "Brunch", order: 30 },

  { code: "APPETIZERS", label: "Appetizers", order: 40 },
  { code: "SOUPS", label: "Soups", order: 50 },
  { code: "SALADS", label: "Salads", order: 60 },

  { code: "BURGERS", label: "Burgers", order: 80 },
  { code: "SANDWICHES", label: "Sandwiches & Wraps", order: 90 },
  { code: "TACOS", label: "Tacos", order: 100 },
  { code: "PIZZA", label: "Pizza", order: 110 },
  { code: "PASTA", label: "Pasta", order: 120 },
  { code: "BOWLS", label: "Bowls", order: 130 },

  { code: "CHICKEN_ENTREES", label: "Chicken", order: 140 },
  { code: "BEEF_STEAK", label: "Steak & Beef", order: 150 },
  { code: "SEAFOOD", label: "Seafood", order: 160 },
  { code: "VEGETARIAN_ENTREES", label: "Vegetarian", order: 170 },
  { code: "VEGAN_ENTREES", label: "Vegan", order: 180 },

  { code: "SIDES", label: "Sides", order: 200 },
  { code: "KIDS", label: "Kids", order: 210 },

  { code: "DESSERTS", label: "Desserts", order: 220 },
  { code: "BEVERAGES", label: "Beverages", order: 230 },

  { code: "OTHER", label: "Other", order: 999 },
];

export function mapRawCategoryToMks(raw) {
  const x = String(raw || "").toLowerCase();
  if (!x) return "OTHER";

  if (x.includes("special")) return "SPECIALS";

  if (x.includes("breakfast")) return "BREAKFAST";
  if (x.includes("brunch")) return "BRUNCH";

  if (x.includes("app") || x.includes("starter")) return "APPETIZERS";
  if (x.includes("soup")) return "SOUPS";
  if (x.includes("salad")) return "SALADS";

  if (x.includes("burger")) return "BURGERS";
  if (x.includes("sandwich") || x.includes("wrap") || x.includes("panini")) return "SANDWICHES";
  if (x.includes("taco")) return "TACOS";
  if (x.includes("pizza")) return "PIZZA";
  if (x.includes("pasta")) return "PASTA";
  if (x.includes("bowl")) return "BOWLS";

  if (x.includes("chicken")) return "CHICKEN_ENTREES";
  if (x.includes("steak") || x.includes("beef")) return "BEEF_STEAK";
  if (x.includes("seafood") || x.includes("fish") || x.includes("shrimp") || x.includes("salmon") || x.includes("tuna") || x.includes("lobster"))
    return "SEAFOOD";

  if (x.includes("vegan")) return "VEGAN_ENTREES";
  if (x.includes("vegetarian") || x.includes("veggie")) return "VEGETARIAN_ENTREES";

  if (x.includes("side") || x.includes("fries") || x.includes("extras")) return "SIDES";
  if (x.includes("kid") || x.includes("children")) return "KIDS";

  // Desserts (expanded)
  if (
    x.includes("dessert") ||
    x.includes("cookie") ||
    x.includes("ice cream") ||
    x.includes("sundae") ||
    x.includes("brownie") ||
    x.includes("cake") ||
    x.includes("pie") ||
    x.includes("sweet") ||
    x.includes("treat") ||
    x.includes("gelato") ||
    x.includes("sorbet") ||
    x.includes("milkshake")
  ) {
    return "DESSERTS";
  }

  // Beverages (expanded)
  if (
    x.includes("drink") ||
    x.includes("beverage") ||
    x.includes("coffee") ||
    x.includes("tea") ||
    x.includes("soda") ||
    x.includes("juice") ||
    x.includes("smoothie")
  ) {
    return "BEVERAGES";
  }

  return "OTHER";
}