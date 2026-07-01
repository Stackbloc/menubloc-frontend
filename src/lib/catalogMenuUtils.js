import { itemPassesDietFilter } from "../hooks/useDietPreferences";

export function asStr(v) {
  return v === undefined || v === null ? "" : String(v);
}

export function asFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildGoogleMapsDirectionsUrl(destination) {
  const raw = asStr(destination).trim();
  if (!raw) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(raw)}`;
}

export function buildAddressLocalityLine(city, state, zip) {
  const locality = [asStr(city).trim(), asStr(state).trim()].filter(Boolean).join(", ");
  const postal = asStr(zip).trim();
  if (locality && postal) return `${locality} ${postal}`;
  return locality || postal;
}

export function isFoodTruckCategory(value) {
  const normalized = asStr(value).trim().toLowerCase();
  return normalized === "food truck" || normalized === "food_truck" || normalized === "foodtruck";
}

export function normalizeSections(data) {
  if (Array.isArray(data?.sections)) return data.sections;
  if (Array.isArray(data?.menu_sections)) return data.menu_sections;
  if (Array.isArray(data?.menu)) return data.menu;
  return [];
}

function isDisplayableMenuItem(item) {
  return asStr(item?.name).trim().length > 0;
}

const ALLERGEN_PROFILE_TO_EVIDENCE = {
  peanuts: ["peanuts"],
  tree_nuts: ["tree nuts"],
  dairy: ["dairy"],
  gluten: ["wheat", "gluten"],
  shellfish: ["shellfish"],
  soy: ["soy"],
  eggs: ["eggs", "egg"],
  fish: ["fish"],
  sesame: ["sesame"],
  wheat: ["wheat"],
};

function itemFailsAllergenFilter(item, enabledAllergenKeys) {
  if (!enabledAllergenKeys || enabledAllergenKeys.size === 0) return false;
  const chip = item?.chips?.nutrition_chip || {};
  const evidence = new Set([
    ...(Array.isArray(chip.allergens) ? chip.allergens : []),
    ...(Array.isArray(chip.contains_allergens) ? chip.contains_allergens : []),
  ].map((a) => String(a || "").toLowerCase().replace(/_/g, " ").trim()));
  if (evidence.size === 0) return false;
  for (const key of enabledAllergenKeys) {
    const matches = ALLERGEN_PROFILE_TO_EVIDENCE[key] || [key.replace(/_/g, " ")];
    if (matches.some((m) => evidence.has(m))) return true;
  }
  return false;
}

export function getFilteredDisplaySections(sections, dietPrefs, enabledAllergenKeys) {
  return (Array.isArray(sections) ? sections : [])
    .map((sec) => {
      const title = asStr(sec?.title || "Menu").trim() || "Menu";
      const rawItems = Array.isArray(sec?.items) ? sec.items : [];
      const items = rawItems.filter((it) => {
        if (!isDisplayableMenuItem(it)) return false;
        if (!itemPassesDietFilter(it, dietPrefs)) return false;
        if (itemFailsAllergenFilter(it, enabledAllergenKeys)) return false;
        return true;
      });
      return { ...sec, title, items };
    })
    .filter((sec) => sec.items.length > 0);
}

export function getCartItemState(cartItems, menuItemId) {
  const matchingLines = (Array.isArray(cartItems) ? cartItems : []).filter(
    (line) => Number(line?.menuItemId) === Number(menuItemId)
  );
  const simpleLine = matchingLines.find(
    (line) =>
      (!Array.isArray(line?.modifiers) || line.modifiers.length === 0) &&
      !asStr(line?.specialInstructions).trim()
  ) || null;

  return {
    matchingLines,
    simpleLine,
    totalQuantity: matchingLines.reduce((sum, line) => sum + Number(line?.quantity || 0), 0),
    simpleQuantity: simpleLine ? Number(simpleLine.quantity || 0) : 0,
  };
}
