/**
 * Food discussions MVP API client.
 * Public reads via api.js; consumer writes via consumer session cookies;
 * owner/operator management via existing owner/operator bases.
 */
import { apiGet, apiPost, apiPatch, API_BASE } from "./api.js";

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

async function apiDelete(path) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await safeJson(res);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `DELETE ${url} failed (${res.status})`;
    const error = new Error(msg);
    if (data && typeof data === "object") Object.assign(error, data);
    throw error;
  }
  return data;
}

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });
  const serialized = qs.toString();
  return serialized ? `?${serialized}` : "";
}

export async function listPublicFoodComments({
  restaurantId = null,
  menuItemId = null,
  clusterId = null,
  featured = false,
  limit = 50,
} = {}) {
  const data = await apiGet(
    `/public/comments${buildQuery({
      restaurant_id: restaurantId,
      menu_item_id: menuItemId,
      cluster_id: clusterId,
      featured: featured ? "1" : undefined,
      limit,
    })}`
  );
  return Array.isArray(data?.comments) ? data.comments : [];
}

export async function createFoodComment(body) {
  return apiPost("/api/consumer/comments", body);
}

export async function updateFoodComment(commentId, content) {
  return apiPatch(`/api/consumer/comments/${encodeURIComponent(String(commentId))}`, {
    content,
  });
}

export async function deleteFoodComment(commentId) {
  return apiDelete(`/api/consumer/comments/${encodeURIComponent(String(commentId))}`);
}

export async function listOwnerRestaurantComments(restaurantId, params = {}) {
  const data = await apiGet(
    `/api/owner/restaurants/${encodeURIComponent(String(restaurantId))}/comments${buildQuery(params)}`
  );
  return Array.isArray(data?.comments) ? data.comments : [];
}

export async function replyOwnerRestaurantComment(restaurantId, commentId, content) {
  return apiPost(
    `/api/owner/restaurants/${encodeURIComponent(String(restaurantId))}/comments/${encodeURIComponent(String(commentId))}/replies`,
    { content }
  );
}

export async function featureOwnerRestaurantComment(restaurantId, commentId) {
  return apiPost(
    `/api/owner/restaurants/${encodeURIComponent(String(restaurantId))}/comments/${encodeURIComponent(String(commentId))}/feature`,
    {}
  );
}

export async function unfeatureOwnerRestaurantComment(restaurantId, commentId) {
  return apiDelete(
    `/api/owner/restaurants/${encodeURIComponent(String(restaurantId))}/comments/${encodeURIComponent(String(commentId))}/feature`
  );
}

export async function listOperatorRestaurantComments(restaurantId, params = {}) {
  const data = await apiGet(
    `/operator/restaurants/${encodeURIComponent(String(restaurantId))}/comments${buildQuery({
      scope: "all",
      ...params,
    })}`
  );
  return Array.isArray(data?.comments) ? data.comments : [];
}

export async function replyOperatorRestaurantComment(restaurantId, commentId, content) {
  return apiPost(
    `/operator/restaurants/${encodeURIComponent(String(restaurantId))}/comments/${encodeURIComponent(String(commentId))}/replies`,
    { content }
  );
}

export async function featureOperatorRestaurantComment(restaurantId, commentId) {
  return apiPost(
    `/operator/restaurants/${encodeURIComponent(String(restaurantId))}/comments/${encodeURIComponent(String(commentId))}/feature`,
    {}
  );
}

export async function unfeatureOperatorRestaurantComment(restaurantId, commentId) {
  return apiDelete(
    `/operator/restaurants/${encodeURIComponent(String(restaurantId))}/comments/${encodeURIComponent(String(commentId))}/feature`
  );
}
