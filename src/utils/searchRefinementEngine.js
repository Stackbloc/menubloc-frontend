export const WAITER_INITIAL_MIN_RESULTS = 8;
export const WAITER_CONTINUATION_MIN_RESULTS = 6;
export const WAITER_MIN_OPTIONS = 2;
export const WAITER_MIN_ITEMS_PER_OPTION = 1;

const WAITER_MAX_OPTIONS = 3;
const MIN_REMOVED_ITEMS = 1;
const PRICE_MIN_RESULTS = WAITER_INITIAL_MIN_RESULTS;
const STRONG_UTILITY = 0.3;
const MIN_INFORMATION_GAIN = 0.55;
const MIN_OPTION_SHARE = 0.1;
const TIER_FOOD = 3;
const TIER_NUTRITION = 2;
const TIER_COMMERCE = 1;
const WAITER_STOP_WORDS = new Set([
  "the",
  "and",
  "with",
  "for",
  "to",
  "of",
  "a",
  "an",
  "in",
  "on",
  "our",
  "your",
  "special",
  "meal",
  "combo",
  "plate",
  "menu",
  "item",
  "items",
  "restaurant",
  "restaurants",
  "fresh",
  "classic",
  "style",
  "choice",
  "available",
  "served",
  "includes",
  "featuring",
  "made",
  "order",
]);

const ATTRIBUTE_KEY_PATTERNS = Object.freeze({
  preparation: /(^|_)(preparation|prep|cooking_method|cook_method|method|temperature|serving_temperature)(_|$)/i,
  ingredient: /(^|_)(ingredient|protein|base|filling|topping|sauce|flavor|bread_type|crust|cheese|common_knowledge|commonknowledge|mks|attribute|trait)(_|$)/i,
  modifier: /(^|_)(modifier|option|choice|addon|add_on|variant|customization)(_|$)/i,
  category: /(^|_)(strict_type|broad_category|category|section|primary_family|template|dish_type|item_type|course)(_|$)/i,
});

const PREPARATION_SIGNALS = [
  { key: "fried", label: "Fried", terms: ["fried", "crispy", "breaded", "battered", "tempura", "crunchy"] },
  { key: "grilled", label: "Grilled", terms: ["grilled", "chargrilled", "char-grilled", "blackened"] },
  { key: "roasted", label: "Roasted", terms: ["roasted", "roast"] },
  { key: "baked", label: "Baked", terms: ["baked", "oven baked", "oven-baked"] },
  { key: "smoked", label: "Smoked", terms: ["smoked", "smoky"] },
  { key: "steamed", label: "Steamed", terms: ["steamed"] },
  { key: "seared", label: "Seared", terms: ["seared"] },
  { key: "spicy", label: "Spicy", terms: ["spicy", "hot", "buffalo", "nashville hot", "cajun"] },
  { key: "iced", label: "Iced", terms: ["iced", "cold brew", "cold"] },
  { key: "hot", label: "Hot", terms: ["hot"] },
];

const PREPARATION_ALIASES = new Map(
  PREPARATION_SIGNALS.flatMap((signal) =>
    signal.terms.map((term) => [normalizeText(term), signal])
  )
);

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/[^\w\s$.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(value) {
  const normalized = normalizeText(value);
  if (normalized.endsWith("ies")) return `${normalized.slice(0, -3)}y`;
  if (normalized.endsWith("s") && !normalized.endsWith("ss")) return normalized.slice(0, -1);
  return normalized;
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
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
    item?.summary ||
    item?.short_description ||
    item?.item?.description ||
    ""
  );
}

function getSection(item) {
  return item?.section_name || item?.section || item?.category || item?.restaurant_category || "";
}

function getPriceDollars(item) {
  const direct = asNumber(item?.price);
  if (direct !== null) return direct;
  const cents = asNumber(item?.price_cents);
  if (cents !== null) return cents / 100;
  const minor = asNumber(item?.price_minor_units);
  if (minor !== null) return minor / 100;
  return null;
}

function getDistanceMiles(item) {
  const value = asNumber(item?.distance_miles ?? item?.restaurant_distance_miles);
  return value !== null ? value : null;
}

function getNutritionValue(item, key) {
  const direct = asNumber(item?.[key]);
  if (direct !== null) return direct;
  const chip = asNumber(item?.chips?.nutrition_chip?.[key]);
  return chip !== null ? chip : null;
}

function getDietaryPassed(item, key) {
  return item?.chips?.dietary_filters?.[key]?.passed === true;
}

function getTags(item) {
  return Array.isArray(item?.tags) ? item.tags.join(" ") : "";
}

function itemText(item) {
  return normalizeText([getItemName(item), getDescription(item), getSection(item), getTags(item)].join(" "));
}

function tokenize(value) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .map(singularize)
    .filter((token) => token && token.length >= 3 && !WAITER_STOP_WORDS.has(token));
}

function addValue(target, value) {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length < 3 || WAITER_STOP_WORDS.has(normalized)) return;
  if (/^\d+$/.test(normalized)) return;
  target.add(normalized);
}

function addValues(target, value) {
  if (Array.isArray(value)) {
    for (const entry of value) addValues(target, entry);
    return;
  }

  if (value && typeof value === "object") {
    const direct = value.label || value.name || value.value || value.key || value.attribute_id || value.attribute;
    if (direct) addValue(target, direct);
    return;
  }

  if (typeof value === "string" || typeof value === "number") {
    String(value)
      .split(/[|,;]+/)
      .forEach((part) => addValue(target, part));
  }
}

function collectAttributes(value, out, depth = 0) {
  if (!value || depth > 4) return;

  if (Array.isArray(value)) {
    for (const entry of value) collectAttributes(entry, out, depth + 1);
    return;
  }

  if (typeof value !== "object") return;

  for (const [key, nextValue] of Object.entries(value)) {
    for (const [group, pattern] of Object.entries(ATTRIBUTE_KEY_PATTERNS)) {
      if (pattern.test(key)) addValues(out[group], nextValue);
    }
    collectAttributes(nextValue, out, depth + 1);
  }
}

function canonicalPreparation(value) {
  const normalized = normalizeText(value);
  const alias = PREPARATION_ALIASES.get(normalized);
  if (alias) return { key: alias.key, label: alias.label };
  return { key: normalized, label: titleCase(normalized) };
}

function extractPreparationFromText(text) {
  const out = new Map();
  const haystack = normalizeText(text);

  for (const signal of PREPARATION_SIGNALS) {
    if (signal.terms.some((term) => haystack.includes(normalizeText(term)))) {
      out.set(signal.key, signal.label);
    }
  }

  return out;
}

function extractTextFeatures(item, searchTerm) {
  const queryTokens = new Set(tokenize(searchTerm));
  const tokens = tokenize(itemText(item)).filter((token) => !queryTokens.has(token));
  const features = new Set(tokens);

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const first = tokens[index];
    const second = tokens[index + 1];
    if (first && second && first !== second) features.add(`${first} ${second}`);
  }

  return features;
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

export function normalizeSearchTerm(q) {
  return singularize(String(q || "").replace(/\+/g, " "));
}

export function classifyMenuItemForRefinement(item, searchTerm = "") {
  const attributes = {
    preparation: new Set(),
    ingredient: new Set(),
    modifier: new Set(),
    category: new Set(),
  };
  collectAttributes(item, attributes);

  for (const [key] of extractPreparationFromText(itemText(item))) {
    attributes.preparation.add(key);
  }

  const textFeatures = extractTextFeatures(item, searchTerm);

  return {
    preparationKeys: Array.from(attributes.preparation).map((value) => canonicalPreparation(value).key),
    ingredientKeys: Array.from(attributes.ingredient),
    modifierKeys: Array.from(attributes.modifier),
    categoryKeys: Array.from(attributes.category),
    textKeys: Array.from(textFeatures),
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

function hasSelectedRefinement(selectedRefinements, type, key) {
  return selectedRefinements.some((entry) => entry?.type === type && entry?.key === key);
}

function makeOption(type, key, label, count, predicateDescription, metadata = {}) {
  return { id: `${type}:${key}`, type, key, label, count, predicateDescription, ...metadata };
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
      return makeOption(type, candidate.key, candidate.label, count, candidate.predicateDescription, {
        commerceType: candidate.commerceType || null,
      });
    })
    .filter((option) => optionIsMeaningful(option.count, totalCount))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function scoreGroup(group) {
  if (!Array.isArray(group?.options) || group.options.length < WAITER_MIN_OPTIONS) return -1;
  const totalCount = Math.max(group.totalCount || 0, 1);
  const optionCounts = group.options.map((option) => option.count).filter((count) => count > 0);
  if (optionCounts.length < WAITER_MIN_OPTIONS) return -1;

  const coveredCount = Math.min(optionCounts.reduce((sum, count) => sum + count, 0), totalCount);
  const residualCount = Math.max(totalCount - coveredCount, 0);
  const buckets = residualCount > 0 ? [...optionCounts, residualCount] : optionCounts;
  const bucketCount = buckets.length;
  const entropy = buckets.reduce((sum, count) => {
    const probability = count / totalCount;
    return probability > 0 ? sum - probability * Math.log2(probability) : sum;
  }, 0);
  const informationGain = bucketCount > 1 ? entropy / Math.log2(bucketCount) : 0;
  const coverageRatio = coveredCount / totalCount;
  const averageRemovalRatio =
    optionCounts.reduce((sum, count) => sum + ((totalCount - count) / totalCount), 0) /
    optionCounts.length;
  const smallestShare = Math.min(...optionCounts) / totalCount;
  const optionVariety = Math.min(optionCounts.length, WAITER_MAX_OPTIONS) / WAITER_MAX_OPTIONS;

  if (informationGain < MIN_INFORMATION_GAIN) return -1;
  if (smallestShare < MIN_OPTION_SHARE) return -1;

  return coverageRatio * (
    informationGain * 0.5 +
    averageRemovalRatio * 0.3 +
    optionVariety * 0.2
  );
}

function selectGroup(groups) {
  const ranked = groups
    .map((group) => ({
      ...group,
      utilityScore: scoreGroup(group),
    }))
    .filter((group) => group.utilityScore > 0)
    .sort((a, b) =>
      b.tier - a.tier ||
      b.utilityScore - a.utilityScore ||
      (b.priority || 0) - (a.priority || 0)
    );

  const foodAttributeGroup = ranked
    .filter((group) => (
      group.tier === TIER_FOOD &&
      group.type !== "text" &&
      group.utilityScore >= STRONG_UTILITY
    ))
    .sort((a, b) =>
      (b.priority || 0) - (a.priority || 0) ||
      b.utilityScore - a.utilityScore
    )[0];
  if (foodAttributeGroup) return foodAttributeGroup;

  const textFoodGroup = ranked.find(
    (group) => (
      group.tier === TIER_FOOD &&
      group.type === "text" &&
      group.utilityScore >= STRONG_UTILITY
    )
  );
  if (textFoodGroup) return textFoodGroup;

  const nutritionGroup = ranked.find(
    (group) => group.tier === TIER_NUTRITION && group.utilityScore >= STRONG_UTILITY
  );
  if (nutritionGroup) return nutritionGroup;

  const commerceGroup = ranked.find(
    (group) => group.tier === TIER_COMMERCE && group.utilityScore >= STRONG_UTILITY
  );
  if (commerceGroup) return commerceGroup;

  return null;
}

function buildKeyCandidates(entries, type, keysName, selectedRefinements, priority, searchTerm = "") {
  const keys = new Map();
  const queryTokens = new Set(tokenize(searchTerm));
  for (const entry of entries) {
    for (const rawKey of entry.classification?.[keysName] || []) {
      const key = normalizeText(rawKey);
      if (!key) continue;
      if (queryTokens.has(singularize(key))) {
        return {
          type,
          tier: TIER_FOOD,
          priority,
          totalCount: entries.length,
          options: [],
        };
      }
      const label = type === "preparation"
        ? canonicalPreparation(key).label
        : titleCase(key);
      keys.set(key, {
        key,
        label,
        predicateDescription: `${label} matches`,
        test: (candidate) => (candidate.classification?.[keysName] || []).includes(key),
      });
    }
  }

  return {
    type,
    tier: TIER_FOOD,
    priority,
    totalCount: entries.length,
    options: buildOptionList(entries, type, selectedRefinements, Array.from(keys.values())),
  };
}

function buildNutritionGroup(entries, selectedRefinements) {
  const proteins = entries
    .map((entry) => entry.classification?.nutrition?.protein)
    .filter((value) => value != null)
    .sort((a, b) => a - b);
  const candidates = [];

  if (proteins.length >= WAITER_INITIAL_MIN_RESULTS) {
    const median = proteins[Math.floor(proteins.length / 2)];
    if (Number.isFinite(median) && median > 0) {
      candidates.push({
        key: `protein_${Math.round(median)}g_plus`,
        label: "Higher Protein",
        predicateDescription: `Items with at least ${Math.round(median)}g protein`,
        test: (entry) => entry.classification?.nutrition?.protein != null && entry.classification.nutrition.protein >= median,
      });
    }
  }

  return {
    type: "nutrition",
    tier: TIER_NUTRITION,
    priority: 15,
    totalCount: entries.length,
    options: buildOptionList(entries, "nutrition", selectedRefinements, candidates),
  };
}

function buildPriceCommerceGroup(entries, selectedRefinements) {
  const pricedEntries = entries.filter((entry) => entry.classification?.commerce?.priceDollars != null);
  const candidates = [];

  if (pricedEntries.length >= PRICE_MIN_RESULTS) {
    const prices = pricedEntries.map((entry) => entry.classification.commerce.priceDollars).sort((a, b) => a - b);
    const midpointIndex = Math.floor(prices.length / 2);
    const threshold = prices.length % 2 === 0
      ? (prices[midpointIndex - 1] + prices[midpointIndex]) / 2
      : prices[midpointIndex];
    const displayThreshold = Math.ceil(threshold);
    if (Number.isFinite(threshold) && threshold > 0 && Number.isFinite(displayThreshold)) {
      candidates.push(
        {
          key: `under_${displayThreshold}`,
          label: `Under $${displayThreshold}`,
          predicateDescription: `Items under $${displayThreshold}`,
          commerceType: "price",
          test: (entry) => entry.classification?.commerce?.priceDollars != null && entry.classification.commerce.priceDollars < threshold,
        },
        {
          key: `${displayThreshold}_plus`,
          label: `$${displayThreshold}+`,
          predicateDescription: `Items $${displayThreshold} or above`,
          commerceType: "price",
          test: (entry) => entry.classification?.commerce?.priceDollars != null && entry.classification.commerce.priceDollars >= threshold,
        }
      );
    }
  }

  return {
    type: "commerce",
    commerceType: "price",
    tier: TIER_COMMERCE,
    priority: 10,
    totalCount: entries.length,
    options: buildOptionList(entries, "commerce", selectedRefinements, candidates),
  };
}

function buildDealCommerceGroup(entries, selectedRefinements) {
  const dealCount = entries.filter((entry) => entry.classification?.commerce?.hasDeal === true).length;
  const candidates = [];

  if (dealCount > 0 && dealCount < entries.length) {
    candidates.push(
      {
        key: "deals",
        label: "Deals",
        predicateDescription: "Items with active deals",
        commerceType: "deal",
        test: (entry) => entry.classification?.commerce?.hasDeal === true,
      },
      {
        key: "no_deals",
        label: "No deals",
        predicateDescription: "Items without active deals",
        commerceType: "deal",
        test: (entry) => entry.classification?.commerce?.hasDeal !== true,
      }
    );
  }

  return {
    type: "commerce",
    commerceType: "deal",
    tier: TIER_COMMERCE,
    priority: 9,
    totalCount: entries.length,
    options: buildOptionList(entries, "commerce", selectedRefinements, candidates),
  };
}

function buildDistanceCommerceGroup(entries, selectedRefinements) {
  const withDistance = entries.filter((entry) => entry.classification?.commerce?.distanceMiles != null);
  const candidates = [];

  if (withDistance.length >= WAITER_INITIAL_MIN_RESULTS) {
    const nearbyCount = withDistance.filter((entry) => entry.classification.commerce.distanceMiles <= 3).length;
    if (nearbyCount > 0 && nearbyCount < withDistance.length) {
      candidates.push(
        {
          key: "nearby",
          label: "Nearby",
          predicateDescription: "Items within 3 miles",
          commerceType: "distance",
          test: (entry) => entry.classification?.commerce?.distanceMiles != null && entry.classification.commerce.distanceMiles <= 3,
        },
        {
          key: "farther_out",
          label: "Farther out",
          predicateDescription: "Items more than 3 miles away",
          commerceType: "distance",
          test: (entry) => entry.classification?.commerce?.distanceMiles != null && entry.classification.commerce.distanceMiles > 3,
        }
      );
    }
  }

  return {
    type: "commerce",
    commerceType: "distance",
    tier: TIER_COMMERCE,
    priority: 8,
    totalCount: entries.length,
    options: buildOptionList(entries, "commerce", selectedRefinements, candidates),
  };
}

export function buildInventoryRefinementOptions(entries, searchTerm, selectedRefinements = []) {
  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  if (safeEntries.length < WAITER_CONTINUATION_MIN_RESULTS) return [];

  const classifiedEntries = safeEntries.map((entry) => ({
    ...entry,
    classification: entry.classification || classifyMenuItemForRefinement(entry.item || entry, searchTerm),
  }));

  const candidateGroups = [
    buildKeyCandidates(classifiedEntries, "preparation", "preparationKeys", selectedRefinements, 60, searchTerm),
    buildKeyCandidates(classifiedEntries, "ingredient", "ingredientKeys", selectedRefinements, 50, searchTerm),
    buildKeyCandidates(classifiedEntries, "modifier", "modifierKeys", selectedRefinements, 45, searchTerm),
    buildKeyCandidates(classifiedEntries, "category", "categoryKeys", selectedRefinements, 35, searchTerm),
    buildKeyCandidates(classifiedEntries, "text", "textKeys", selectedRefinements, 25, searchTerm),
    buildNutritionGroup(classifiedEntries, selectedRefinements),
    buildPriceCommerceGroup(classifiedEntries, selectedRefinements),
    buildDealCommerceGroup(classifiedEntries, selectedRefinements),
    buildDistanceCommerceGroup(classifiedEntries, selectedRefinements),
  ].filter((group) => group.options.length >= WAITER_MIN_OPTIONS);

  if (!candidateGroups.length) return [];

  const selectedGroup = selectGroup(candidateGroups);
  return selectedGroup ? selectedGroup.options.slice(0, WAITER_MAX_OPTIONS) : [];
}

export function applyInventoryRefinement(entries, selectedRefinement) {
  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];
  if (!selectedRefinement?.type || !selectedRefinement?.key) return safeEntries;

  const keyNameByType = {
    preparation: "preparationKeys",
    ingredient: "ingredientKeys",
    modifier: "modifierKeys",
    category: "categoryKeys",
    text: "textKeys",
  };

  const keyName = keyNameByType[selectedRefinement.type];
  if (keyName) {
    return safeEntries.filter((entry) =>
      (entry.classification?.[keyName] || []).includes(selectedRefinement.key)
    );
  }

  if (selectedRefinement.type === "nutrition") {
    const match = /^protein_(\d+)g_plus$/.exec(selectedRefinement.key);
    if (match) {
      const min = Number(match[1]);
      return safeEntries.filter((entry) => entry.classification?.nutrition?.protein != null && entry.classification.nutrition.protein >= min);
    }
  }

  if (selectedRefinement.type === "commerce") {
    if (selectedRefinement.key === "deals") {
      return safeEntries.filter((entry) => entry.classification?.commerce?.hasDeal === true);
    }

    if (selectedRefinement.key === "no_deals") {
      return safeEntries.filter((entry) => entry.classification?.commerce?.hasDeal !== true);
    }

    if (selectedRefinement.key === "nearby") {
      return safeEntries.filter((entry) => entry.classification?.commerce?.distanceMiles != null && entry.classification.commerce.distanceMiles <= 3);
    }

    if (selectedRefinement.key === "farther_out") {
      return safeEntries.filter((entry) => entry.classification?.commerce?.distanceMiles != null && entry.classification.commerce.distanceMiles > 3);
    }

    const under = /^under_(\d+)$/.exec(selectedRefinement.key);
    if (under) {
      const max = Number(under[1]);
      return safeEntries.filter((entry) => entry.classification?.commerce?.priceDollars != null && entry.classification.commerce.priceDollars < max);
    }

    const plus = /^(\d+)_plus$/.exec(selectedRefinement.key);
    if (plus) {
      const min = Number(plus[1]);
      return safeEntries.filter((entry) => entry.classification?.commerce?.priceDollars != null && entry.classification.commerce.priceDollars >= min);
    }
  }

  if (selectedRefinement.type === "allergen") {
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
  }

  return safeEntries;
}

export function shouldShowWaiter(filteredEntries, refinementOptions, selectedRefinements = []) {
  const count = Array.isArray(filteredEntries) ? filteredEntries.length : 0;
  const hasPriorRefinements = Array.isArray(selectedRefinements) && selectedRefinements.length > 0;

  if (hasPriorRefinements) return false;
  if (count < WAITER_INITIAL_MIN_RESULTS) return false;
  if (!Array.isArray(refinementOptions) || refinementOptions.length < WAITER_MIN_OPTIONS) return false;

  return refinementOptions.every((option) =>
    option.count >= WAITER_MIN_ITEMS_PER_OPTION &&
    option.count < count
  );
}
