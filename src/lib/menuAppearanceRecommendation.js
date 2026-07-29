/**
 * FE mirror of menubloc-backend-main/src/lib/menuAppearanceRecommendation.js
 * Keep mappings identical.
 */

import {
  DEFAULT_MENU_APPEARANCE_KEY,
  isValidMenuAppearanceKey,
} from "./menuAppearances.js";

export function normalizeAppearanceTaxonomyToken(raw) {
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

const CATEGORY_TO_APPEARANCE = Object.freeze({
  fine_dining: "elegant",
  steakhouse: "elegant",
  sports_bar: "industrial",
  bar_and_grill: "industrial",
  pub: "heritage",
  tavern: "heritage",
  gastropub: "heritage",
  bbq: "rustic",
  barbecue: "rustic",
  seafood: "coastal",
  italian: "stone",
  mexican: "warm_paper",
  latin: "warm_paper",
  latin_american: "warm_paper",
  japanese: "contemporary",
  sushi: "contemporary",
  ramen: "contemporary",
  chinese: "elegant",
  indian: "warm_paper",
  mediterranean: "stone",
  greek: "stone",
  cafe: "warm_paper",
  coffee: "warm_paper",
  coffee_shop: "warm_paper",
  bakery: "classic_paper",
  donut: "classic_paper",
  donut_shop: "classic_paper",
  pizza: "rustic",
  pizzeria: "rustic",
  food_truck: "industrial",
  brewery: "industrial",
  brewpub: "industrial",
  wine_bar: "elegant",
  dessert: "soft_texture",
  dessert_shop: "soft_texture",
  ice_cream: "soft_texture",
  ice_cream_shop: "soft_texture",
  breakfast: "warm_paper",
  brunch: "linen",
  diner: "classic_paper",
  fast_casual: "modern_minimal",
  casual_dining: "contemporary",
  fast_food: "modern_minimal",
  qsr: "modern_minimal",
  restaurant: "modern_minimal",
  family: "classic_paper",
  family_restaurant: "classic_paper",
  bar: "industrial",
  cocktail_bar: "executive",
  lounge: "executive",
  nightclub: "industrial",
  bistro: "contemporary",
  deli: "classic_paper",
  sandwich: "modern_minimal",
  sandwich_shop: "modern_minimal",
  thai: "contemporary",
  vietnamese: "contemporary",
  korean: "contemporary",
  middle_eastern: "warm_paper",
  burger: "modern_minimal",
  chicken: "modern_minimal",
  buffet: "modern_minimal",
  buffet_restaurant: "modern_minimal",
  ghost_kitchen: "industrial",
  juice_bar: "soft_texture",
  smoothie_shop: "soft_texture",
  tea_house: "linen",
  boba_shop: "contemporary",
  food_hall: "industrial",
  catering_company: "modern_minimal",
  catering: "modern_minimal",
});

const CUISINE_TO_APPEARANCE = Object.freeze({
  italian: "stone",
  italian_american: "stone",
  mexican: "warm_paper",
  tex_mex: "warm_paper",
  latin_american: "warm_paper",
  cuban: "warm_paper",
  japanese: "contemporary",
  sushi: "contemporary",
  korean: "contemporary",
  chinese: "elegant",
  thai: "contemporary",
  vietnamese: "contemporary",
  indian: "warm_paper",
  mediterranean: "stone",
  greek: "stone",
  middle_eastern: "warm_paper",
  seafood: "coastal",
  barbecue: "rustic",
  pizza: "rustic",
  breakfast: "warm_paper",
  french: "elegant",
  cajun: "rustic",
  caribbean: "coastal",
  jamaican: "coastal",
  soul_food: "heritage",
  southern: "heritage",
  american: "modern_minimal",
  vegan: "linen",
  vegetarian: "linen",
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

function lookupAppearance(map, token) {
  if (!token) return null;
  const direct = map[token];
  if (direct && isValidMenuAppearanceKey(direct)) return direct;
  return null;
}

export function getRecommendedMenuAppearance(category, cuisine) {
  const cat = normalizeAppearanceTaxonomyToken(category);
  const cui = normalizeAppearanceTaxonomyToken(cuisine);

  const fromCuisine = lookupAppearance(CUISINE_TO_APPEARANCE, cui);
  const fromCategory = lookupAppearance(CATEGORY_TO_APPEARANCE, cat);

  if (fromCategory) {
    if (!GENERIC_CATEGORY_TOKENS.has(cat) || !fromCuisine) {
      return fromCategory;
    }
    return fromCuisine;
  }

  if (fromCuisine) return fromCuisine;

  return DEFAULT_MENU_APPEARANCE_KEY;
}

export function resolveEffectiveMenuAppearance(restaurant = {}) {
  const manual = restaurant.menu_appearance_key;
  if (manual != null && String(manual).trim() !== "") {
    const key = String(manual).trim();
    if (isValidMenuAppearanceKey(key)) return key;
  }
  return getRecommendedMenuAppearance(restaurant.category, restaurant.cuisine);
}
