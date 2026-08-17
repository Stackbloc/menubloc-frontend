/**
 * Public Join Me summaries. Authenticated activate/end live on consumerApi.
 * Uses api.js — never same-origin menuply.com HTML.
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

export async function listPublicRestaurantJoinMe(restaurantId, { limit = 3 } = {}) {
  const rid = restaurantId != null ? String(restaurantId).trim() : "";
  if (!rid) return { inviting_count: 0, summary: null, invites: [] };
  const data = await apiGet(
    `/public/join-me/restaurants/${encodeURIComponent(rid)}${buildQuery({ limit })}`
  );
  return {
    restaurant_id: data?.restaurant_id != null ? Number(data.restaurant_id) : Number(rid),
    inviting_count: Number(data?.inviting_count || 0),
    summary: data?.summary || null,
    invites: Array.isArray(data?.invites) ? data.invites : [],
  };
}

export async function listPublicClusterJoinMe(clusterId, { limit = 3 } = {}) {
  const cid = clusterId != null ? String(clusterId).trim() : "";
  if (!cid) return { inviting_count: 0, summary: null, invites: [] };
  const data = await apiGet(
    `/public/join-me/clusters/${encodeURIComponent(cid)}${buildQuery({ limit })}`
  );
  return {
    cluster_id: data?.cluster_id != null ? Number(data.cluster_id) : Number(cid),
    inviting_count: Number(data?.inviting_count || 0),
    summary: data?.summary || null,
    invites: Array.isArray(data?.invites) ? data.invites : [],
  };
}
