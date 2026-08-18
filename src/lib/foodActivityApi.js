/**
 * Public food activity API — derive restaurant/cluster surfaces from canonical food_activity.
 * Uses api.js (Railway production fallback) — never same-origin /menuply.com HTML.
 */
import { apiGet, apiPost } from "./api.js";
import { getOrCreateGuestReporterKey } from "./guestReporterSession.js";

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

export async function getRestaurantUpcomingEatingPlans(restaurantId) {
  const rid = restaurantId != null ? String(restaurantId).trim() : "";
  if (!rid) return { diner_count: 0, window_days: 7, line: null };
  const data = await apiGet(
    `/public/food-activity/restaurants/${encodeURIComponent(rid)}/upcoming-plans`
  );
  const dinerCount = Number(data?.diner_count) || 0;
  return {
    diner_count: dinerCount,
    window_days: data?.window_days ?? 7,
    line: data?.line || null,
  };
}

export function restaurantLabel(row) {
  return String(
    row?.restaurant_name || row?.label || row?.name || row?.location_label || ""
  ).trim();
}

export function dishLabel(row) {
  return String(row?.item_name || row?.label || row?.name || "").trim();
}

function positiveId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function coerceMenuItemId(value) {
  const n = positiveId(value);
  if (n) return n;
  const s = String(value || "").trim();
  if (/^cmi:/i.test(s)) return s;
  return null;
}

export function asRestaurantPlace(row) {
  if (!row) return null;
  const restaurant_id = positiveId(row.restaurant_id) || positiveId(row.id);
  if (!restaurant_id) return null;
  return {
    ...row,
    restaurant_id,
    restaurant_name: restaurantLabel(row),
    restaurant_slug: row.restaurant_slug || row.slug || null,
    address_line1: row.address_line1 || row.address || null,
    city: row.city || null,
    state: row.state || null,
  };
}

export function asDishPlace(row) {
  if (!row) return null;
  const menu_item_id = coerceMenuItemId(row.menu_item_id) || coerceMenuItemId(row.id);
  if (!menu_item_id) return null;
  return {
    ...row,
    menu_item_id,
    item_name: dishLabel(row),
    restaurant_id: positiveId(row.restaurant_id),
    menu_id: positiveId(row.menu_id),
  };
}

/** Prefill I'm Eating At from a selected restaurant and/or dish. */
export async function resolveEatingPrefill({ restaurantId = null, menuItemId = null } = {}) {
  const mid = menuItemId != null ? String(menuItemId).trim() : "";
  const rid = restaurantId != null ? String(restaurantId).trim() : "";
  let restaurant = null;
  let menuItem = null;
  if (mid) {
    const data = await apiGet(`/menu-items/${encodeURIComponent(mid)}`);
    const item = data?.item || data?.menu_item || data || {};
    menuItem = asDishPlace({
      menu_item_id: item.menu_item_id || item.id || mid,
      item_name: item.item_name || item.name,
      name: item.name,
      restaurant_id: item.restaurant_id || item.restaurant?.id,
      menu_id: item.menu_id,
    });
    restaurant = asRestaurantPlace({
      restaurant_id: item.restaurant_id || item.restaurant?.id,
      restaurant_name: item.restaurant_name || item.restaurant?.restaurant_name || item.restaurant?.name,
      restaurant_slug: item.restaurant_slug || item.restaurant?.slug,
      address_line1: item.address_line1 || item.restaurant?.address_line1,
      city: item.city || item.restaurant?.city,
      state: item.state || item.restaurant?.state,
    });
  }
  if (!restaurant && rid) {
    const data = await apiGet(`/public/restaurants/${encodeURIComponent(rid)}`);
    const r = data?.restaurant || data || {};
    restaurant = asRestaurantPlace({
      restaurant_id: r.id || r.restaurant_id || rid,
      restaurant_name: r.restaurant_name || r.name,
      restaurant_slug: r.slug,
      address_line1: r.address_line1 || r.address,
      city: r.city,
      state: r.state,
    });
  }
  return { restaurant, menuItem };
}

export async function searchReportPlaces({ type, q = "", restaurant_id = null, limit = 8 } = {}) {
  const data = await apiGet(
    `/public/food-activity/places${buildQuery({ type, q, restaurant_id, limit })}`
  );
  return { results: Array.isArray(data?.results) ? data.results : [] };
}

export async function createPublicFoodActivity(body = {}) {
  const payload = {
    ...body,
    guest_key: body.guest_key || getOrCreateGuestReporterKey(),
  };
  return apiPost("/public/food-activity", payload);
}
