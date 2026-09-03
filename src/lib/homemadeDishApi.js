import { API_BASE, apiGet, apiPost, apiDelete } from "./api.js";

const BASE = `${String(API_BASE || "").replace(/\/$/, "")}/api/consumer`;

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

export async function fetchHomemadeDish(id) {
  return apiGet(`/api/consumer/homemade-dishes/${encodeURIComponent(id)}`);
}

export async function createHomemadeDish(payload) {
  const res = await fetch(`${BASE}/homemade-dishes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson(res);
}

export async function fetchHomemadeByMenuItem(menuItemId) {
  return apiGet(`/api/consumer/homemade-dishes/by-menu-item/${encodeURIComponent(menuItemId)}`);
}

export async function fetchUserHomemadeDishes(userId) {
  return apiGet(`/api/consumer/homemade-dishes/users/${encodeURIComponent(userId)}`);
}

export async function uploadHomemadeDishPhoto(file) {
  const form = new FormData();
  form.append("photo", file);
  const res = await fetch(`${BASE}/homemade-dishes/photo`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return parseJson(res);
}

export async function deleteHomemadeDish(id) {
  const res = await fetch(`${BASE}/homemade-dishes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJson(res);
}

export async function setHomemadeDishMarketDiscoverable(id, marketDiscoverable) {
  const res = await fetch(
    `${BASE}/homemade-dishes/${encodeURIComponent(id)}/market-discoverable`,
    {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ market_discoverable: Boolean(marketDiscoverable) }),
    }
  );
  return parseJson(res);
}

export async function likeHomemadeDish(id) {
  const res = await fetch(`${BASE}/homemade-dishes/${encodeURIComponent(id)}/like`, {
    method: "POST",
    credentials: "include",
  });
  return parseJson(res);
}

export async function unlikeHomemadeDish(id) {
  const res = await fetch(`${BASE}/homemade-dishes/${encodeURIComponent(id)}/like`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJson(res);
}

export async function saveHomemadeDish(id) {
  const res = await fetch(`${BASE}/homemade-dishes/${encodeURIComponent(id)}/save`, {
    method: "POST",
    credentials: "include",
  });
  return parseJson(res);
}

export async function unsaveHomemadeDish(id) {
  const res = await fetch(`${BASE}/homemade-dishes/${encodeURIComponent(id)}/save`, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJson(res);
}

export async function listHomemadeDishComments(id) {
  return apiGet(`/api/consumer/homemade-dishes/${encodeURIComponent(id)}/comments`);
}

export async function postHomemadeDishComment(id, content, parentCommentId = null) {
  const res = await fetch(`${BASE}/homemade-dishes/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, parent_comment_id: parentCommentId }),
  });
  return parseJson(res);
}

export function homemadeDishPath(id) {
  return `/homemade-dishes/${encodeURIComponent(id)}`;
}

export function buildHomemadeDishShareData(dish) {
  const id = dish?.id || dish?.homemade_dish_id;
  const name = dish?.name || "Homemade dish";
  const path = homemadeDishPath(id);
  return {
    title: `${name} — Homemade on Menuply`,
    text: `Check out this homemade dish: ${name}`,
    url: `https://menuply.com${path}`,
    imageUrl: dish?.photo_url || null,
  };
}
