/**
 * Public food activity API — derive restaurant/cluster surfaces from canonical food_activity.
 * Uses api.js (Railway production fallback) — never same-origin /menuply.com HTML.
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

export async function listPublicRestaurantFoodActivity(restaurantId, { limit = 30, hours } = {}) {
  const rid = restaurantId != null ? String(restaurantId).trim() : "";
  if (!rid) return { activities: [], wording: "people shared this" };
  const data = await apiGet(
    `/public/food-activity/restaurants/${encodeURIComponent(rid)}${buildQuery({
      limit,
      hours,
    })}`
  );
  return {
    restaurant_id: data?.restaurant_id != null ? Number(data.restaurant_id) : Number(rid),
    window_hours: data?.window_hours ?? null,
    wording: data?.wording || "people shared this",
    activities: Array.isArray(data?.activities) ? data.activities : [],
  };
}

export async function listPublicClusterFoodActivity(clusterId, { limit = 20, hours } = {}) {
  const cid = clusterId != null ? String(clusterId).trim() : "";
  if (!cid) return { items: [], wording: "people shared this" };
  const data = await apiGet(
    `/public/food-activity/clusters/${encodeURIComponent(cid)}${buildQuery({
      limit,
      hours,
    })}`
  );
  return {
    cluster_id: data?.cluster_id != null ? Number(data.cluster_id) : Number(cid),
    window_hours: data?.window_hours ?? null,
    wording: data?.wording || "people shared this",
    items: Array.isArray(data?.items) ? data.items : [],
  };
}
