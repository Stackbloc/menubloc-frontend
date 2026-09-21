import { formatRestaurantCuisineLabel } from "./clusterRestaurantDisplay.js";

const CK_CUISINE_GROUP_RULES = [
  {
    id: "american",
    label: "American",
    match: (restaurant) => {
      const text = cuisineText(restaurant);
      return /american|southern|soul|bbq|barbecue|burger/.test(text);
    },
  },
  {
    id: "asian",
    label: "Asian",
    match: (restaurant) => {
      const text = cuisineText(restaurant);
      return /asian|chinese|japanese|korean|thai|sushi|vietnamese|indian/.test(text);
    },
  },
  {
    id: "mexican",
    label: "Mexican",
    match: (restaurant) => /mexican|tex-mex|tex mex|latin/.test(cuisineText(restaurant)),
  },
  {
    id: "italian",
    label: "Italian",
    match: (restaurant) => /italian|pizza|pasta/.test(cuisineText(restaurant)),
  },
  {
    id: "coffee_bakery",
    label: "Coffee & Bakery",
    match: (restaurant) => matchesCoffeeBakery(restaurant),
  },
  {
    id: "bars_lounges",
    label: "Bars & Lounges",
    match: (restaurant) => {
      const text = `${cuisineText(restaurant)} ${String(restaurant?.restaurant_type || "").toLowerCase()} ${String(restaurant?.restaurant_name || "").toLowerCase()}`;
      return /bar|lounge|cocktail|pub|grill & bar/.test(text);
    },
  },
];

function cuisineText(restaurant) {
  return String(restaurant?.cuisine || restaurant?.category || "").trim().toLowerCase();
}

function restaurantNameText(restaurant) {
  return String(restaurant?.restaurant_name || restaurant?.name || "").trim().toLowerCase();
}

/**
 * Coffee / cafe / bakery / donut / tea shops.
 * Cluster restaurant payloads often omit cuisine/category (null) — match names too.
 * Do not treat frozen-yogurt / ice-cream dessert shops as coffee & bakery.
 */
function matchesCoffeeBakery(restaurant) {
  const name = restaurantNameText(restaurant);
  const cuisine = cuisineText(restaurant);
  const category = String(restaurant?.category || "").trim().toLowerCase();
  const haystack = `${cuisine} ${category} ${name}`;

  if (
    /yogurtland|frozen\s*yogurt|ice\s*cream|gelato|soft\s*serve/.test(haystack)
  ) {
    return false;
  }

  return /coffee|caf[eé]|bakery|donut|doughnut|pastry|bagel|espresso|starbucks|dunkin|spudnuts|\btea\b|\bboba\b|\bcha\b|matcha/.test(
    haystack
  );
}

export function resolveRestaurantCuisineGroup(restaurant) {
  for (const rule of CK_CUISINE_GROUP_RULES) {
    if (rule.match(restaurant)) return rule;
  }
  return { id: "other", label: "Other Restaurants" };
}

export function groupClusterRestaurantsByCuisine(restaurants = []) {
  const buckets = new Map();

  for (const restaurant of restaurants) {
    const group = resolveRestaurantCuisineGroup(restaurant);
    if (!buckets.has(group.id)) {
      buckets.set(group.id, { id: group.id, label: group.label, restaurants: [] });
    }
    buckets.get(group.id).restaurants.push({
      ...restaurant,
      cuisine_display: formatRestaurantCuisineLabel(restaurant),
    });
  }

  const order = [...CK_CUISINE_GROUP_RULES.map((row) => row.id), "other"];
  return order
    .map((id) => buckets.get(id))
    .filter(Boolean)
    .filter((group) => group.restaurants.length > 0);
}

export { matchesCoffeeBakery };
