/**
 * FE mirror of menubloc-backend/src/lib/restaurantProfileStyleRecommendation.js
 * Keep mappings identical.
 */

import {
  DEFAULT_PROFILE_STYLE_KEY,
  isValidProfileStyleKey,
} from "./restaurantProfileStyles.js";

export function normalizeStyleTaxonomyToken(raw) {
  if (raw == null) return "";
  let s = String(raw)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (s.endsWith("_restaurant")) {
    s = s.slice(0, -"_restaurant".length);
  }
  return s;
}

const CATEGORY_TO_STYLE = Object.freeze({
  fine_dining: "fine_dining",
  sports_bar: "sports_bar",
  bar_and_grill: "wood_and_steel",
  pub: "neighborhood_pub",
  tavern: "neighborhood_pub",
  gastropub: "neighborhood_pub",
  bbq: "rustic_bbq",
  barbecue: "rustic_bbq",
  seafood: "coastal",
  italian: "tuscan_stone",
  mexican: "tile",
  latin: "tile",
  latin_american: "tile",
  japanese: "minimal_bamboo",
  sushi: "minimal_bamboo",
  ramen: "minimal_bamboo",
  chinese: "silk",
  indian: "warm_textile",
  mediterranean: "white_stone",
  greek: "white_stone",
  cafe: "coffee_house",
  coffee: "coffee_house",
  coffee_shop: "coffee_house",
  bakery: "parchment",
  donut: "parchment",
  donut_shop: "parchment",
  pizza: "brick_oven",
  pizzeria: "brick_oven",
  food_truck: "industrial",
  brewery: "copper_and_oak",
  brewpub: "copper_and_oak",
  wine_bar: "vineyard",
  dessert: "soft_pastel",
  dessert_shop: "soft_pastel",
  ice_cream: "soft_pastel",
  ice_cream_shop: "soft_pastel",
  breakfast: "sunrise",
  brunch: "sunrise",
  diner: "sunrise",
  fast_casual: "modern_minimal",
  casual_dining: "modern_minimal",
  fast_food: "modern_minimal",
  qsr: "modern_minimal",
  restaurant: "modern_minimal",
  family: "modern_minimal",
  family_restaurant: "modern_minimal",
  bar: "wood_and_steel",
  cocktail_bar: "wood_and_steel",
  lounge: "wood_and_steel",
  nightclub: "industrial",
  bistro: "modern_minimal",
  deli: "modern_minimal",
  sandwich: "modern_minimal",
  sandwich_shop: "modern_minimal",
  steakhouse: "fine_dining",
  thai: "silk",
  vietnamese: "silk",
  korean: "minimal_bamboo",
  middle_eastern: "warm_textile",
  burger: "modern_minimal",
  chicken: "modern_minimal",
  buffet: "modern_minimal",
  buffet_restaurant: "modern_minimal",
  ghost_kitchen: "industrial",
  juice_bar: "soft_pastel",
  smoothie_shop: "soft_pastel",
  tea_house: "minimal_bamboo",
  boba_shop: "minimal_bamboo",
  food_hall: "industrial",
  catering_company: "modern_minimal",
  catering: "modern_minimal",
});

const CUISINE_TO_STYLE = Object.freeze({
  italian: "tuscan_stone",
  italian_american: "tuscan_stone",
  mexican: "tile",
  tex_mex: "tile",
  latin_american: "tile",
  cuban: "tile",
  japanese: "minimal_bamboo",
  sushi: "minimal_bamboo",
  korean: "minimal_bamboo",
  chinese: "silk",
  thai: "silk",
  vietnamese: "silk",
  indian: "warm_textile",
  mediterranean: "white_stone",
  greek: "white_stone",
  middle_eastern: "warm_textile",
  seafood: "coastal",
  barbecue: "rustic_bbq",
  pizza: "brick_oven",
  breakfast: "sunrise",
  french: "fine_dining",
  cajun: "rustic_bbq",
  caribbean: "jamaican",
  jamaican: "jamaican",
  soul_food: "rustic_bbq",
  southern: "rustic_bbq",
  american: "modern_minimal",
  vegan: "modern_minimal",
  vegetarian: "modern_minimal",
});

const GENERIC_CATEGORY_TOKENS = new Set([
  "restaurant",
  "casual_dining",
  "fast_casual",
  "fast_food",
  "qsr",
  "family",
  "family_restaurant",
  "bistro",
  "deli",
  "sandwich",
  "sandwich_shop",
  "burger",
  "chicken",
  "buffet",
  "buffet_restaurant",
  "catering",
  "catering_company",
]);

function lookupStyle(map, token) {
  if (!token) return null;
  const direct = map[token];
  if (direct && isValidProfileStyleKey(direct)) return direct;
  return null;
}

export function getRecommendedProfileStyle(category, cuisine) {
  const cat = normalizeStyleTaxonomyToken(category);
  const cui = normalizeStyleTaxonomyToken(cuisine);
  const fromCuisine = lookupStyle(CUISINE_TO_STYLE, cui);
  const fromCategory = lookupStyle(CATEGORY_TO_STYLE, cat);

  if (fromCategory) {
    if (!GENERIC_CATEGORY_TOKENS.has(cat) || !fromCuisine) {
      return fromCategory;
    }
    return fromCuisine;
  }
  if (fromCuisine) return fromCuisine;
  return DEFAULT_PROFILE_STYLE_KEY;
}

export function resolveEffectiveProfileStyle(restaurant = {}) {
  const manual = restaurant.profile_style_key;
  if (manual != null && String(manual).trim() !== "") {
    const key = String(manual).trim();
    if (isValidProfileStyleKey(key)) return key;
  }
  return getRecommendedProfileStyle(restaurant.category, restaurant.cuisine);
}
