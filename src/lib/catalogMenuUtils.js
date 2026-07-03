import { getClientPreferenceDisplaySections } from "./menuClientPreferenceFilter.js";
import { restaurantPath } from "./canonicalUrl.js";

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

/** Maps search URL from coordinates or address parts. */
export function buildGoogleMapsUrlForRestaurant({
  addressLine = "",
  addressLine1 = "",
  addressLine2 = "",
  city = "",
  state = "",
  zip = "",
  lat = null,
  lng = null,
} = {}) {
  const latN = asFiniteNumber(lat);
  const lngN = asFiniteNumber(lng);
  if (latN != null && lngN != null && !(latN === 0 && lngN === 0)) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latN},${lngN}`)}`;
  }
  const line = asStr(addressLine).trim()
    || [asStr(addressLine1).trim(), asStr(addressLine2).trim()].filter(Boolean).join(", ");
  if (!line) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(line)}`;
}

export function resolveRestaurantProfileHref({
  data = {},
  entry = {},
  restaurantId = null,
  isFoodTruck = false,
} = {}) {
  const slug = asStr(data?.slug || entry?.slug || entry?.restaurant_slug).trim() || null;
  const city = asStr(data?.city || entry?.city).trim() || null;
  const state = asStr(data?.state || entry?.state).trim() || null;
  const id = asStr(data?.restaurant_id || entry?.restaurant_id || restaurantId).trim() || null;

  if (isFoodTruck) {
    const target = slug || id;
    return target ? `/foodtrucks/${encodeURIComponent(target)}` : null;
  }

  const canonical = restaurantPath({ slug, city, state });
  if (canonical) return canonical;
  if (slug) return `/restaurants/${encodeURIComponent(slug)}`;
  if (id) return `/restaurants/${encodeURIComponent(id)}`;
  return null;
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

/** @deprecated Use getClientPreferenceDisplaySections from menuClientPreferenceFilter.js */
export function getFilteredDisplaySections(sections, dietPrefs, enabledAllergenKeys) {
  return getClientPreferenceDisplaySections(sections, dietPrefs, enabledAllergenKeys);
}

export { getClientPreferenceDisplaySections };

export function getCartItemState(cartItems, menuItemId) {
  const matchingLines = (Array.isArray(cartItems) ? cartItems : []).filter(
    (line) => Number(line?.menuItemId) === Number(menuItemId)
  );
  const simpleLine = matchingLines.find(
    (line) =>
      (!Array.isArray(line?.modifiers) || line.modifiers.length === 0) &&
      !asStr(line?.preparationInstructions || line?.specialInstructions).trim()
  ) || null;

  return {
    matchingLines,
    simpleLine,
    totalQuantity: matchingLines.reduce((sum, line) => sum + Number(line?.quantity || 0), 0),
    simpleQuantity: simpleLine ? Number(simpleLine.quantity || 0) : 0,
  };
}
