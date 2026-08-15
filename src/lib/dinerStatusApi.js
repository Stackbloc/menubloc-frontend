/**
 * Public Diner Status API (reads).
 * Authenticated create/list/delete live on consumerApi.
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

export async function listPublicRestaurantDinerStatuses(
  restaurantId,
  { limit = 20, hours, menuItemId } = {}
) {
  const rid = restaurantId != null ? String(restaurantId).trim() : "";
  if (!rid) return { statuses: [] };
  const data = await apiGet(
    `/public/diner-statuses/restaurants/${encodeURIComponent(rid)}${buildQuery({
      limit,
      hours,
      menu_item_id: menuItemId,
    })}`
  );
  return {
    restaurant_id: data?.restaurant_id != null ? Number(data.restaurant_id) : Number(rid),
    window_hours: data?.window_hours ?? null,
    statuses: Array.isArray(data?.statuses) ? data.statuses : [],
  };
}

export async function listPublicMenuItemDinerStatuses(menuItemId, { limit = 20, hours } = {}) {
  const mid = menuItemId != null ? String(menuItemId).trim() : "";
  if (!mid) return { statuses: [] };
  const data = await apiGet(
    `/public/diner-statuses/menu-items/${encodeURIComponent(mid)}${buildQuery({
      limit,
      hours,
    })}`
  );
  return {
    menu_item_id: data?.menu_item_id != null ? Number(data.menu_item_id) : Number(mid),
    window_hours: data?.window_hours ?? null,
    statuses: Array.isArray(data?.statuses) ? data.statuses : [],
  };
}

export async function listPublicClusterDinerStatuses(clusterId, { limit = 20, hours } = {}) {
  const cid = clusterId != null ? String(clusterId).trim() : "";
  if (!cid) return { statuses: [] };
  const data = await apiGet(
    `/public/diner-statuses/clusters/${encodeURIComponent(cid)}${buildQuery({
      limit,
      hours,
    })}`
  );
  return {
    cluster_id: data?.cluster_id != null ? Number(data.cluster_id) : Number(cid),
    window_hours: data?.window_hours ?? null,
    statuses: Array.isArray(data?.statuses) ? data.statuses : [],
  };
}

export async function listPublicClusterDinerStatusSignals(clusterId, { limit = 10, hours } = {}) {
  const cid = clusterId != null ? String(clusterId).trim() : "";
  if (!cid) return { signals: [] };
  const data = await apiGet(
    `/public/diner-statuses/clusters/${encodeURIComponent(cid)}/signals${buildQuery({
      limit,
      hours,
    })}`
  );
  return {
    cluster_id: data?.cluster_id != null ? Number(data.cluster_id) : Number(cid),
    window_hours: data?.window_hours ?? null,
    signals: Array.isArray(data?.signals) ? data.signals : [],
  };
}
