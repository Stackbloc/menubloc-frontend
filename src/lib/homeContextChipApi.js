import { API_BASE } from "./api.js";
import { parseLocation, buildSearchLocationParams } from "./locationUtils.js";

const LOCAL_RADIUS_MILES = 8;
const DEFAULT_MARKET = { city: "Los Angeles", state: "CA" };

export async function fetchHomeContextChip({
  appliedLocation = "",
  autoLocation = null,
  shouldUseGeoBrowse = false,
  mealPeriod = null,
  signal,
} = {}) {
  const params = new URLSearchParams();
  params.set("limit", "14");

  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    params.set("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles");
  }
  if (mealPeriod) params.set("context", mealPeriod);

  if (appliedLocation) {
    const loc = parseLocation(appliedLocation);
    if (loc.city) params.set("city", loc.city);
    if (loc.state) params.set("state", loc.state);
  } else if (shouldUseGeoBrowse && autoLocation?.lat != null && autoLocation?.lng != null) {
    params.set("lat", String(autoLocation.lat));
    params.set("lng", String(autoLocation.lng));
    params.set("radius", String(LOCAL_RADIUS_MILES));
  } else {
    params.set("city", DEFAULT_MARKET.city);
    params.set("state", DEFAULT_MARKET.state);
  }

  const res = await fetch(`${API_BASE}/api/home/context-chip?${params.toString()}`, {
    credentials: "include",
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error || json?.detail || `HTTP ${res.status}`);
  }
  return json;
}

export function flattenHomeContextChipResults(results = []) {
  const rows = [];
  for (const group of results) {
    for (const item of group.menu_items || []) {
      rows.push({
        menu_item_id: item.menu_item_id,
        menu_item_name: item.name,
        item_name: item.name,
        search_display_name: item.name,
        price_cents: item.price_minor_units ?? null,
        restaurant_id: group.restaurant_id,
        restaurant_slug: group.slug,
        restaurant_name: group.restaurant_name,
        cuisine: group.cuisine,
        city: group.city,
        state: group.state,
        distance_miles: group.distance_miles,
        image_url: group.image_url,
        matched_term: item.matched_term,
        recommendationReasons: item.recommendationReasons || [],
        context_chip: true,
        item: {
          id: item.menu_item_id,
          menu_item_id: item.menu_item_id,
          name: item.name,
          menu_item_name: item.name,
          price_cents: item.price_minor_units ?? null,
        },
        restaurant: {
          id: group.restaurant_id,
          restaurant_id: group.restaurant_id,
          slug: group.slug,
          name: group.restaurant_name,
          restaurant_name: group.restaurant_name,
          cuisine: group.cuisine,
          city: group.city,
          state: group.state,
          distance_miles: group.distance_miles,
        },
      });
    }
  }
  return rows;
}

export function buildHomeContextChipSearchUrl(entry, payload, locationContext) {
  const query = entry?.query || payload?.query_terms?.[0] || "lunch";
  const params = buildSearchLocationParams({
    query,
    explicitLocationValue:
      locationContext?.shouldUseGeoBrowse && !locationContext?.appliedLocation
        ? ""
        : locationContext?.appliedLocation || "",
    autoLocation: locationContext?.shouldUseGeoBrowse ? locationContext?.autoLocation : null,
    radiusMiles: LOCAL_RADIUS_MILES,
  });
  params.set("source", "home_context_chip");
  const mealPeriod =
    payload?.normalized_context?.mealPeriod ||
    payload?.context ||
    entry?.mealPeriod ||
    entry?.context?.mealPeriod;
  if (mealPeriod) {
    params.set("context", mealPeriod);
    params.set("meal_period", mealPeriod);
  }
  return `/search?${params.toString()}`;
}
