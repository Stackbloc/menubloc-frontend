/**
 * Public restaurant profile videos (franchise fan-out + deals).
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

export async function listRestaurantProfileVideos(restaurantId, { limit = 24 } = {}) {
  const rid = restaurantId != null ? String(restaurantId).trim() : "";
  if (!rid) return { restaurant_id: null, videos: [] };
  const data = await apiGet(
    `/public/restaurants/${encodeURIComponent(rid)}/videos${buildQuery({ limit })}`
  );
  return {
    restaurant_id: data?.restaurant_id != null ? Number(data.restaurant_id) : Number(rid),
    chain_id: data?.chain_id != null ? Number(data.chain_id) : null,
    videos: Array.isArray(data?.videos) ? data.videos : [],
  };
}
