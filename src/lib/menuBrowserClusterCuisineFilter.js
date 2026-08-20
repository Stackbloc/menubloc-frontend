/**
 * Client-side Yellow Browser food chip matching for cluster membership decks.
 * Mirrors backend menuBrowserService.rowMatchesCategory for the 7 FE food tabs.
 */

const FOOD_SECTION_MATCH = Object.freeze({
  nearby: null,
  american: {
    cuisines: [
      "american",
      "burger",
      "burgers",
      "bbq",
      "barbecue",
      "barbeque",
      "southern",
      "soul",
      "soul food",
      "steak",
      "steakhouse",
      "diner",
      "grill",
      "wings",
      "sandwich",
      "sandwiches",
      "comfort food",
    ],
    categories: ["american", "diner", "bbq", "southern", "steakhouse"],
    name_hints: ["fixins", "smashburger", "lazy dog"],
    exclude_name_hints: [
      "emmy squared",
      "emmy square",
      "olive garden",
      "carrabba",
      "maggiano",
      "north italia",
    ],
  },
  asian: {
    cuisines: [
      "asian",
      "chinese",
      "japanese",
      "korean",
      "thai",
      "vietnamese",
      "indian",
      "filipino",
    ],
    name_hints: [
      "panda express",
      "peking",
      "sushi",
      "ramen",
      "thai",
      "pho",
      "hibachi",
      "northern cafe",
      "chinatown",
    ],
  },
  italian: {
    cuisines: ["italian", "pasta", "pizza", "italian american", "italian-american"],
    name_hints: [
      "emmy squared",
      "emmy square",
      "olive garden",
      "carrabba",
      "maggiano",
      "north italia",
      "savoca",
    ],
  },
  mexican: {
    cuisines: ["mexican", "tex mex", "tex-mex", "tacos", "burrito", "burritos"],
    categories: ["mexican", "tex mex", "tex-mex"],
    name_hints: [
      "taco bell",
      "chipotle",
      "la parilla",
      "del taco",
      "qdoba",
      "el pollo loco",
    ],
  },
  dine_in: {
    cuisines: [
      "steakhouse",
      "steak",
      "seafood",
      "american",
      "italian",
      "mexican",
      "southern",
      "bbq",
    ],
    categories: [
      "casual dining",
      "casual_dining",
      "full service",
      "full_service",
      "dine in",
      "dine_in",
      "sit down",
      "sit_down",
      "steakhouse",
      "family dining",
      "family_dining",
    ],
    restaurant_types: [
      "casual dining",
      "casual_dining",
      "full service",
      "full_service",
      "dine in",
      "dine_in",
      "sit down",
      "sit_down",
      "family dining",
      "family_dining",
    ],
    name_hints: ["olive garden", "applebee", "chili", "outback", "yard house"],
  },
  qsr: {
    restaurant_types: [
      "qsr",
      "fast food",
      "fast_food",
      "fast casual",
      "fast_casual",
      "quick service",
      "quick_service",
    ],
    categories: [
      "qsr",
      "fast food",
      "fast_food",
      "fast casual",
      "fast_casual",
      "quick service",
      "quick_service",
    ],
    name_hints: [
      "mcdonald",
      "burger king",
      "wendy",
      "taco bell",
      "panda express",
      "chipotle",
      "subway",
      "kfc",
      "dunkin",
      "starbucks",
      "in n out",
      "chick fil",
    ],
  },
});

function normalizeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[_/\-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesList(value, list) {
  if (!value || !Array.isArray(list) || !list.length) return false;
  const normalized = normalizeToken(value);
  return list.some((candidate) => {
    const token = normalizeToken(candidate);
    return token && (normalized === token || normalized.includes(token) || token.includes(normalized));
  });
}

/**
 * @param {object} row
 * @param {string} sectionId
 * @returns {boolean}
 */
export function clusterEntryMatchesFoodSection(row, sectionId) {
  const section = String(sectionId || "").trim().toLowerCase();
  if (!section || section === "nearby") return true;
  const match = FOOD_SECTION_MATCH[section];
  if (!match) return true;

  const cuisine = normalizeToken(row?.cuisine || row?.restaurant_cuisine);
  const category = normalizeToken(row?.category || row?.restaurant_category);
  const restaurantType = normalizeToken(row?.restaurant_type);
  const name = normalizeToken(row?.restaurant_name || row?.name);

  const cuisines = match.cuisines || [];
  const categories = match.categories || [];
  const restaurantTypes = match.restaurant_types || [];
  const nameHints = match.name_hints || [];
  const excludeNameHints = match.exclude_name_hints || [];

  if (excludeNameHints.length && matchesList(name, excludeNameHints)) return false;
  if (nameHints.length && matchesList(name, nameHints)) return true;
  if (restaurantTypes.length && matchesList(restaurantType, restaurantTypes)) return true;
  if (matchesList(cuisine, cuisines) || matchesList(category, categories)) return true;
  return false;
}

/**
 * @param {object[]} entries
 * @param {string} sectionId
 * @returns {object[]}
 */
export function filterClusterEntriesByFoodSection(entries, sectionId) {
  const list = Array.isArray(entries) ? entries : [];
  const section = String(sectionId || "").trim().toLowerCase();
  if (!section || section === "nearby") return list;
  return list.filter((entry) => clusterEntryMatchesFoodSection(entry, section));
}

export { FOOD_SECTION_MATCH };
