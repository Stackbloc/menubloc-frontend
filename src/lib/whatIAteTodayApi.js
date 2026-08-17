/**
 * Public tagged What I Ate entries for restaurant profiles.
 */
import { apiGet } from "./api.js";

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : "";
}

export async function listPublicRestaurantWhatIAteToday(restaurantId, { limit = 20, days = 90 } = {}) {
  const rid = restaurantId != null ? String(restaurantId).trim() : "";
  if (!rid) return { restaurant_id: null, entries: [] };
  const data = await apiGet(
    `/public/what-i-ate-today/restaurants/${encodeURIComponent(rid)}${buildQuery({ limit, days })}`
  );
  return {
    restaurant_id: data?.restaurant_id != null ? Number(data.restaurant_id) : Number(rid),
    window_days: data?.window_days ?? null,
    entries: Array.isArray(data?.entries) ? data.entries : [],
  };
}
