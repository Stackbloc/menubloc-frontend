export const WAITER_INITIAL_MIN_RESULTS = 16;
export const WAITER_CONTINUATION_MIN_RESULTS = 6;
export const WAITER_MIN_OPTIONS = 2;
export const WAITER_MIN_ITEMS_PER_OPTION = 3;
const PRICE_MIN_RESULTS = 24;
const MIN_REMOVED_ITEMS = 2;
const PRICE_MIN_REDUCTION_RATIO = 0.25;
const PRICE_WIDE_SPREAD = 10;

const TEMPLATE_RULES = [
  { key: "salad", label: "salads", patterns: [/\bsalad(s)?\b/] },
  { key: "taco", label: "tacos", patterns: [/\btaco(s)?\b/] },
  { key: "sandwich", label: "sandwiches", patterns: [/\bsandwich(es)?\b/, /\bhandheld(s)?\b/] },
  { key: "bowl", label: "bowls", patterns: [/\bbowl(s)?\b/] },
  { key: "burger", label: "burgers", patterns: [/\bburger(s)?\b/] },
  { key: "pizza", label: "pizza", patterns: [/\bpizza\b/] },
  { key: "pasta", label: "pasta", patterns: [/\bpasta\b/, /\bspaghetti\b/, /\bpenne\b/, /\bfettuccine\b/] },
  { key: "wrap", label: "wraps", patterns: [/\bwrap(s)?\b/] },
  { key: "burrito", label: "burritos", patterns: [/\bburrito(s)?\b/] },
];

const PREPARATION_RULES = [
  { key: "grilled", label: "Grilled", patterns: [/\bgrilled\b/, /\bblackened\b/] },
  { key: "fried", label: "Fried", patterns: [/\bfried\b/, /\bcrispy\b/, /\bbreaded\b/] },
  { key: "baked", label: "Baked", patterns: [/\bbaked\b/] },
  { key: "roasted", label: "Roasted", patterns: [/\broasted\b/] },
  { key: "smoked", label: "Smoked", patterns: [/\bsmoked\b/] },
  { key: "spicy", label: "Spicy", patterns: [/\bspicy\b/, /\bbuffalo\b/, /\bnashville hot\b/] },
];

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function singularize(value) {
  const normalized = normalizeText(value);
  if (normalized.endsWith("ies")) return `${normalized.slice(0, -3)}y`;
  if (normalized.endsWith("s") && !normalized.endsWith("ss")) return normalized.slice(0, -1);
  return normalized;
}

function titleCase(value) {
  return String(value || "").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getItemName(item) {
  return (
    item?.search_display_name ||
    item?.menu_item_name ||
    item?.item_name ||
    item?.name ||
    item?.item?.name ||
    ""
  );
}

function getDescription(item) {
  return (
    item?.description ||
    item?.menu_item_description ||
    item?.item_description ||
    item?.item?.description ||
    ""
  );
}

function getSection(item) {
  return item?.section_name || item?.section || item?.category || item?.restaurant_category || "";
}

function getTags(item) {
  return Array.isArray(item?.tags) ? item.tags.join(" ") : "";
}

function getPriceDollars(item) {
  const direct = Number(item?.price);
  if (Number.isFinite(direct)) return direct;
  const cents = Number(item?.price_cents);
  if (Number.isFinite(cents)) return cents / 100;
  const minor = Number(item?.price_minor_units);
  if (Number.isFinite(minor)) return minor / 100;
  return null;
}

function getDistanceMiles(item) {
  const value = Number(item?.distance_miles ?? item?.restaurant_distance_miles);
  return Number.isFinite(value) ? value : null;
}

function getNutritionValue(item, key) {
  const direct = Number(item?.[key]);
  if (Number.isFinite(direct)) return direct;
  const chip = Number(item?.chips?.nutrition_chip?.[key]);
  if (Number.isFinite(chip)) return chip;
  return null;
}

function getDietaryPassed(item, key) {
  return item?.chips?.dietary_filters?.[key]?.passed === true;
}

function normalizeAllergenValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function buildAllergenFlags(item) {
  const nutritionChip = item?.chips?.nutrition_chip || {};
  const allergens = [
    ...(Array.isArray(nutritionChip.allergens) ? nutritionChip.allergens : []),
    ...(Array.isArray(nutritionChip.contains_allergens) ? nutritionChip.contains_allergens : []),
    ...(Array.isArray(nutritionChip.may_contain_allergens) ? nutritionChip.may_contain_allergens : []),
  ]
    .map(normalizeAllergenValue)
    .filter(Boolean);

  const hasGlutenSignal = allergens.some((value) =>
    value.includes("gluten") || value.includes("wheat")
  );
  const hasSoySignal = allergens.some((value) => value.includes("soy"));

  return {
    isGlutenFree: getDietaryPassed(item, "gluten_free") === true && !hasGlutenSignal,
    isSoyFree: getDietaryPassed(item, "soy_free") === true && !hasSoySignal,
  };
}

function itemText(item) {
  return normalizeText([getItemName(item), getDescription(item), getSection(item), getTags(item)].join(" "));
}

function searchToken(searchTerm) {
  return singularize(String(searchTerm || "").split(/\s+/)[0] || "");
}

function hasSelectedRefinement(selectedRefinements, type, key) {
  return selectedRefinements.some((entry) => entry?.type === type && entry?.key === key);
}

function makeOption(type, key, label, count, predicateDescription) {
  return { id: `${type}:${key}`, type, key, label, count, predicateDescription };
}

function optionIsMeaningful(count, totalCount) {
  return (
    count >= WAITER_MIN_ITEMS_PER_OPTION &&
    count < totalCount &&
    totalCount - count >= MIN_REMOVED_ITEMS
  );
}

function buildOptionList(entries, type, selectedRefinements, candidates) {
  const totalCount = entries.length;
  return candidates
    .filter((candidate) => !hasSelectedRefinement(selectedRefinements, type, candidate.key))
    .map((candidate) => {
      const count = entries.filter(candidate.test).length;
      return makeOption(type, candidate.key, candidate.label, count, candidate.predicateDescription);
    })
    .filter((option) => optionIsMeaningful(option.count, totalCount))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function scoreGroup(group) {
  if (!Array.isArray(group?.options) || group.options.length < WAITER_MIN_OPTIONS) return -1;
  const totalCoverage = group.options.reduce((sum, option) => sum + option.count, 0);
  const totalNarrowing = group.options.reduce((sum, option) => sum + (group.totalCount - option.count), 0);
  return group.options.length * 1000 + totalCoverage * 10 + totalNarrowing + (group.clarityScore || 0);
}

export function normalizeSearchTerm(q) {
  return singularize(String(q || "").replace(/\+/g, " ").replace(/[^\w\s-]/g, " "));
}

export function classifyMenuItemForRefinement(item, searchTerm) {
  const token = searchToken(searchTerm);
  const name = normalizeText(getItemName(item));
  const text = itemText(item);
  return {
    templateKeys: TEMPLATE_RULES
      .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
      .map((rule) => rule.key),
    preparationKeys: PREPARATION_RULES
      .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
      .map((rule) => rule.key),
    direct: {
      token,
      standalone: token
        ? (name === token || name.startsWith(`${token} `) || name.endsWith(` ${token}`))
        : false,
    },
    nutrition: {
      protein: getNutritionValue(item, "protein_g"),
      calories: getNutritionValue(item, "calories_kcal"),
      sodium: getNutritionValue(item, "sodium_mg"),
      lowFatPassed: getDietaryPassed(item, "low_fat"),
      diabeticFriendlyPassed: getDietaryPassed(item, "diabetic_friendly"),
    },
    allergens: buildAllergenFlags(item),
    commerce: {
      hasDeal: item?.has_active_deal === true,
      distanceMiles: getDistanceMiles(item),
      priceDollars: getPriceDollars(item),
    },
  };
}

function buildTemplateGroup(entries, searchTerm, selectedRefinements) {
  const prefix = searchTerm ? `${titleCase(searchTerm)} ` : "";
  const options = buildOptionList(
    entries,
    "template",
    selectedRefinements,
    TEMPLATE_RULES.map((rule) => ({
      key: rule.key,
      label: `${prefix}${rule.label}`,
      predicateDescription: `Items classified as ${rule.key}`,
      test: (entry) => entry.classification.templateKeys.includes(rule.key),
    }))
  );
  return { type: "template", options, totalCount: entries.length, clarityScore: 40 };
}

function buildPreparationGroup(entries, selectedRefinements) {
  const options = buildOptionList(
    entries,
    "preparation",
    selectedRefinements,
    PREPARATION_RULES.map((rule) => ({
      key: rule.key,
      label: rule.label,
      predicateDescription: `Items prepared ${rule.key}`,
      test: (entry) => entry.classification.preparationKeys.includes(rule.key),
    }))
  );
  return { type: "preparation", options, totalCount: entries.length, clarityScore: 30 };
}

function buildNutritionGroup(entries, selectedRefinements) {
  const options = buildOptionList(entries, "nutrition", selectedRefinements, [
    {
      key: "high_protein",
      label: "High protein",
      predicateDescription: "Items with at least 25g protein",
      test: (entry) => entry.classification.nutrition.protein != null && entry.classification.nutrition.protein >= 25,
    },
    {
      key: "low_fat",
      label: "Low fat",
      predicateDescription: "Items marked low fat",
      test: (entry) => entry.classification.nutrition.lowFatPassed === true,
    },
    {
      key: "low_sodium",
      label: "Low sodium",
      predicateDescription: "Items with sodium at or below 600mg",
      test: (entry) => entry.classification.nutrition.sodium != null && entry.classification.nutrition.sodium <= 600,
    },
    {
      key: "lower_calorie",
      label: "Lower calorie",
      predicateDescription: "Items with calories at or below 500",
      test: (entry) => entry.classification.nutrition.calories != null && entry.classification.nutrition.calories <= 500,
    },
    {
      key: "diabetic_friendly",
      label: "Diabetic-friendly",
      predicateDescription: "Items marked diabetic-friendly",
      test: (entry) => entry.classification.nutrition.diabeticFriendlyPassed === true,
    },
  ]);
  return { type: "nutrition", options, totalCount: entries.length, clarityScore: 25 };
}

function buildDealDistanceGroup(entries, selectedRefinements) {
  const options = buildOptionList(entries, "deal", selectedRefinements, [
    {
      key: "deals_only",
      label: "Deals only",
      predicateDescription: "Items with active deals",
      test: (entry) => entry.classification.commerce.hasDeal === true,
    },
    {
      key: "nearby",
      label: "Nearby",
      predicateDescription: "Items within 3 miles",
      test: (entry) => entry.classification.commerce.distanceMiles != null && entry.classification.commerce.distanceMiles <= 3,
    },
  ]);
  return { type: "deal", options, totalCount: entries.length, clarityScore: 20 };
}

function buildDirectGroup(entries, searchTerm, selectedRefinements) {
  const token = searchToken(searchTerm);
  if (!token) return { type: "direct", options: [], totalCount: entries.length, clarityScore: 0 };
  const options = buildOptionList(entries, "direct", selectedRefinements, [
    {
      key: `just:${token}`,
      label: `Just ${titleCase(token)}`,
      predicateDescription: `Standalone ${token} items`,
      test: (entry) => entry.classification.direct.standalone === true,
    },
    {
      key: `mixed:${token}`,
      label: `${titleCase(token)} in composed dishes`,
      predicateDescription: `Non-standalone ${token} dishes`,
      test: (entry) => entry.classification.direct.standalone !== true,
    },
  ]);
  return { type: "direct", options, totalCount: entries.length, clarityScore: 15 };
}

function buildPriceGroup(entries, selectedRefinements) {
  if (entries.length < PRICE_MIN_RESULTS) return { type: "price", options: [], totalCount: entries.length, clarityScore: 0 };
  const pricedEntries = entries.filter((entry) => entry.classification.commerce.priceDollars != null);
  if (pricedEntries.length < PRICE_MIN_RESULTS) return { type: "price", options: [], totalCount: entries.length, clarityScore: 0 };

  const prices = pricedEntries.map((entry) => entry.classification.commerce.priceDollars).sort((a, b) => a - b);
  const wideSpread = prices[prices.length - 1] - prices[0] >= PRICE_WIDE_SPREAD;

  const options = buildOptionList(pricedEntries, "price", selectedRefinements, [
    {
      key: "under_10",
      label: "Under $10",
      predicateDescription: "Items priced under $10",
      test: (entry) => entry.classification.commerce.priceDollars < 10,
    },
    {
      key: "under_15",
      label: "Under $15",
      predicateDescription: "Items priced under $15",
      test: (entry) => entry.classification.commerce.priceDollars < 15,
    },
    {
      key: "under_20",
      label: "Under $20",
      predicateDescription: "Items priced under $20",
      test: (entry) => entry.classification.commerce.priceDollars < 20,
    },
    {
      key: "20_plus",
      label: "$20+",
      predicateDescription: "Items priced at $20 or above",
      test: (entry) => entry.classification.commerce.priceDollars >= 20,
    },
  ]).filter((option) => {
    const reductionRatio = (pricedEntries.length - option.count) / pricedEntries.length;
    return reductionRatio >= PRICE_MIN_REDUCTION_RATIO || wideSpread;
  });

  return { type: "price", options, totalCount: entries.length, clarityScore: 5 };
}

export function buildInventoryRefinementOptions(entries, searchTerm, selectedRefinements = []) {
  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  if (safeEntries.length < WAITER_CONTINUATION_MIN_RESULTS) return [];

  const candidateGroups = [
    buildTemplateGroup(safeEntries, searchTerm, selectedRefinements),
    buildPreparationGroup(safeEntries, selectedRefinements),
    buildNutritionGroup(safeEntries, selectedRefinements),
    buildDealDistanceGroup(safeEntries, selectedRefinements),
    buildDirectGroup(safeEntries, searchTerm, selectedRefinements),
  ].filter((group) => group.options.length >= WAITER_MIN_OPTIONS);

  if (candidateGroups.length > 0) {
    return candidateGroups.sort((a, b) => scoreGroup(b) - scoreGroup(a))[0].options;
  }

  const priceGroup = buildPriceGroup(safeEntries, selectedRefinements);
  return priceGroup.options.length >= WAITER_MIN_OPTIONS ? priceGroup.options : [];
}

export function applyInventoryRefinement(entries, selectedRefinement) {
  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  if (!selectedRefinement?.type || !selectedRefinement?.key) return safeEntries;

  switch (selectedRefinement.type) {
    case "template":
      return safeEntries.filter((entry) => entry.classification.templateKeys.includes(selectedRefinement.key));
    case "preparation":
      return safeEntries.filter((entry) => entry.classification.preparationKeys.includes(selectedRefinement.key));
    case "nutrition":
      if (selectedRefinement.key === "high_protein") return safeEntries.filter((entry) => entry.classification.nutrition.protein != null && entry.classification.nutrition.protein >= 25);
      if (selectedRefinement.key === "low_fat") return safeEntries.filter((entry) => entry.classification.nutrition.lowFatPassed === true);
      if (selectedRefinement.key === "low_sodium") return safeEntries.filter((entry) => entry.classification.nutrition.sodium != null && entry.classification.nutrition.sodium <= 600);
      if (selectedRefinement.key === "lower_calorie") return safeEntries.filter((entry) => entry.classification.nutrition.calories != null && entry.classification.nutrition.calories <= 500);
      if (selectedRefinement.key === "diabetic_friendly") return safeEntries.filter((entry) => entry.classification.nutrition.diabeticFriendlyPassed === true);
      return safeEntries;
    case "deal":
      if (selectedRefinement.key === "deals_only") return safeEntries.filter((entry) => entry.classification.commerce.hasDeal === true);
      if (selectedRefinement.key === "nearby") return safeEntries.filter((entry) => entry.classification.commerce.distanceMiles != null && entry.classification.commerce.distanceMiles <= 3);
      return safeEntries;
    case "direct":
      if (selectedRefinement.key.startsWith("just:")) return safeEntries.filter((entry) => entry.classification.direct.standalone === true);
      if (selectedRefinement.key.startsWith("mixed:")) return safeEntries.filter((entry) => entry.classification.direct.standalone !== true);
      return safeEntries;
    case "price":
      if (selectedRefinement.key === "under_10") return safeEntries.filter((entry) => entry.classification.commerce.priceDollars != null && entry.classification.commerce.priceDollars < 10);
      if (selectedRefinement.key === "under_15") return safeEntries.filter((entry) => entry.classification.commerce.priceDollars != null && entry.classification.commerce.priceDollars < 15);
      if (selectedRefinement.key === "under_20") return safeEntries.filter((entry) => entry.classification.commerce.priceDollars != null && entry.classification.commerce.priceDollars < 20);
      if (selectedRefinement.key === "20_plus") return safeEntries.filter((entry) => entry.classification.commerce.priceDollars != null && entry.classification.commerce.priceDollars >= 20);
      return safeEntries;
    case "allergen":
      if (selectedRefinement.key === "gluten_free") {
        return safeEntries.filter((entry) =>
          entry.classification?.allergens?.isGlutenFree === true
        );
      }
      if (selectedRefinement.key === "soy_free") {
        return safeEntries.filter((entry) =>
          entry.classification?.allergens?.isSoyFree === true
        );
      }
      return safeEntries;
    default:
      return safeEntries;
  }
}

export function shouldShowWaiter(filteredEntries, refinementOptions, selectedRefinements = []) {
  const count = Array.isArray(filteredEntries) ? filteredEntries.length : 0;
  const hasPriorRefinements = Array.isArray(selectedRefinements) && selectedRefinements.length > 0;

  if (!hasPriorRefinements && count < WAITER_INITIAL_MIN_RESULTS) return false;

  if (hasPriorRefinements && count < WAITER_CONTINUATION_MIN_RESULTS) {
    return true;
  }

  if (!Array.isArray(refinementOptions) || refinementOptions.length < WAITER_MIN_OPTIONS) {
    return hasPriorRefinements;
  }

  return refinementOptions.some((option) => option.count >= WAITER_MIN_ITEMS_PER_OPTION);
}
