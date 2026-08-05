/**
 * Alcoholic beverage detection + display fields for Menu Item Detail.
 * Data substitution only — does not invent nutrition or alcohol quantities.
 */

export const RESPONSIBLE_DRINKING_TITLE = "Drink Responsibly";

export const RESPONSIBLE_DRINKING_BULLETS = Object.freeze([
  "Must be 21 years of age or older to purchase alcoholic beverages.",
  "Please drink responsibly.",
  "Never drink and drive.",
  "According to the U.S. Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects.",
  "Consumption of alcoholic beverages may impair your ability to operate a vehicle or machinery.",
]);

const ALCOHOLIC_BEV_TYPES = new Set([
  "cocktail",
  "beer",
  "wine",
  "spirit",
  "spirits",
  "sake",
  "cider",
  "hard_seltzer",
]);

const NON_ALCOHOLIC_BEV_TYPES = new Set([
  "mocktail",
  "non_alcoholic",
  "non-alcoholic",
  "non alcoholic",
]);

const ALCOHOLIC_BROWSER_CATEGORIES = new Set(["cocktails", "beer", "wine", "spirits"]);

const ZERO_PROOF_RE =
  /\b(mocktail|virgin|non[-\s]?alcoholic|alcohol[-\s]?free|zero[-\s]?proof|spirit[-\s]?free|na\s+beer|0\.0)\b/i;
const SOFT_BEER_HOMONYM_RE = /\b(root\s*beer|ginger\s*ale|ginger\s*beer)\b/i;
const BAKERY_OR_FOOD_RE =
  /\b(donut|doughnut|munchkins|bagel|muffin|croissant|sandwich|burger|pizza|taco|salad|pasta|steak|soup|fries|nugget|wrap)\b/i;
const ALCOHOL_SECTION_RE =
  /\b(cocktail|cocktails|beer|beers|wine|wines|spirits?|liquor|sake|hard\s+seltzer|on\s+tap|draft|draught|signature\s+cocktails|bar\s+menu|drink\s+menu)\b/i;
const ALCOHOL_NAME_RE =
  /\b(cocktail|margarita|martini|mojito|daiquiri|mimosa|sangria|bloody\s+mary|old\s+fashioned|negroni|manhattan|whiskey|vodka|rum|gin|tequila|bourbon|scotch|ipa|lager|pilsner|stout|\bale\b|beer|wine|cabernet|chardonnay|pinot|merlot|champagne|prosecco|ros[eé]|sake)\b/i;

function asExplicitBoolean(value) {
  if (value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true") return true;
  if (value === false || value === 0 || value === "0" || String(value).toLowerCase() === "false") return false;
  return null;
}

function restaurantName(raw) {
  return String(raw?.restaurant?.name || raw?.restaurant_name || "").trim();
}

export function isDunkinRestaurantName(name) {
  return /\bdunkin\b/i.test(String(name || ""));
}

function itemText(raw = {}, detailSystem = null) {
  return [
    raw?.name,
    raw?.item_name,
    raw?.title,
    raw?.description,
    raw?.category,
    raw?.section_name,
    raw?.section,
    raw?.original_section_name,
    raw?.menu?.name,
    raw?.menu?.menu_type,
    raw?.menu?.service_label,
    detailSystem?.item_category,
    detailSystem?.presentation_model?.item_category,
  ]
    .filter(Boolean)
    .join(" ");
}

function collectBrowserCategories(raw) {
  const fromItem = Array.isArray(raw?.drinks_browser_categories) ? raw.drinks_browser_categories : [];
  const fromMeta = Array.isArray(raw?.drinks_browser?.categories)
    ? raw.drinks_browser.categories
    : Array.isArray(raw?.drinks_browser?.drinks_browser_categories)
      ? raw.drinks_browser.drinks_browser_categories
      : [];
  return [...fromItem, ...fromMeta].map((value) => String(value || "").trim().toLowerCase()).filter(Boolean);
}

/**
 * True when the detail item should use alcoholic-beverage data substitution.
 */
export function isAlcoholicBeverageItem(raw, detailSystem = null) {
  if (!raw && !detailSystem) return false;
  if (isDunkinRestaurantName(restaurantName(raw || {}))) return false;

  const explicit =
    asExplicitBoolean(raw?.is_alcoholic) ??
    asExplicitBoolean(raw?.contains_alcohol) ??
    asExplicitBoolean(raw?.drinks_browser?.is_alcoholic);
  if (explicit === false) return false;
  if (explicit === true) return true;

  const beverageType = String(raw?.beverage_type || raw?.drink_type || "").trim().toLowerCase();
  if (NON_ALCOHOLIC_BEV_TYPES.has(beverageType)) return false;
  if (ALCOHOLIC_BEV_TYPES.has(beverageType)) return true;

  const browserCategories = collectBrowserCategories(raw || {});
  if (browserCategories.some((id) => ALCOHOLIC_BROWSER_CATEGORIES.has(id))) return true;

  const intelligenceType = String(
    raw?.beverage_intelligence?.type || detailSystem?.beverage?.type || "",
  ).trim().toLowerCase();
  if (intelligenceType.startsWith("alcohol_")) return true;

  const text = itemText(raw || {}, detailSystem);
  if (ZERO_PROOF_RE.test(text) || SOFT_BEER_HOMONYM_RE.test(text)) return false;
  if (BAKERY_OR_FOOD_RE.test(text) && !ALCOHOL_SECTION_RE.test(text)) return false;

  const category = String(
    detailSystem?.presentation_model?.item_category ||
      detailSystem?.item_category ||
      raw?.item_category ||
      "",
  ).trim().toLowerCase();
  const presentationKind = String(detailSystem?.presentation_model?.kind || "").trim().toLowerCase();
  const drinkContext =
    category === "beverage" ||
    presentationKind === "drink_detail" ||
    ALCOHOL_SECTION_RE.test(text) ||
    /\b(drink|drinks|beverage|bar)\b/i.test(String(raw?.menu?.menu_type || raw?.menu?.name || ""));

  if (!drinkContext) return false;
  return ALCOHOL_NAME_RE.test(text) || ALCOHOL_SECTION_RE.test(text);
}

function trimText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function collectIngredientNames(source) {
  if (typeof source === "string") {
    return source
      .split(/[,;\n]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(source)) return [];
  return source
    .map((row) => {
      if (typeof row === "string") return row.trim();
      return String(row?.name || row?.ingredient_name || "").trim();
    })
    .filter(Boolean);
}

/**
 * Beverage copy for the nutrition-slot substitution. Empty fields are omitted by the caller.
 */
export function resolveAlcoholicBeverageContent(raw, detailSystem = null, localizedDescription = "") {
  const description = trimText(localizedDescription) || trimText(raw?.description);
  const recipe = trimText(
    raw?.recipe ||
      raw?.recipe_text ||
      raw?.drink_recipe ||
      detailSystem?.recipe ||
      detailSystem?.preparation?.recipe,
  );
  const ingredients = collectIngredientNames(
    raw?.ingredients?.length ? raw.ingredients : detailSystem?.ingredients,
  );

  return {
    description,
    recipe: recipe && recipe !== description ? recipe : null,
    ingredients,
  };
}

export function hasAlcoholicBeverageContent(content) {
  if (!content) return false;
  return Boolean(
    trimText(content.description) ||
      trimText(content.recipe) ||
      (Array.isArray(content.ingredients) && content.ingredients.length),
  );
}
