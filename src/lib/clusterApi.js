import { apiGet } from "./api.js";

export async function fetchClustersDirectory({ q, state, city, type, limit = 100, offset = 0, signal } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (state) params.set("state", state);
  if (city) params.set("city", city);
  if (type) params.set("type", type);
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  const qs = params.toString();
  return apiGet(`/public/clusters${qs ? `?${qs}` : ""}`, { signal });
}

export async function fetchClusterMetadata(clusterSlug, { stateSlug, citySlug, signal } = {}) {
  const params = new URLSearchParams();
  if (stateSlug) params.set("stateSlug", stateSlug);
  if (citySlug) params.set("citySlug", citySlug);
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

export async function fetchClusterRestaurants(clusterSlug, { limit = 20, offset = 0, signal } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/restaurants${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

export async function searchCluster(clusterSlug, { q, limit = 24, offset = 0, signal } = {}) {
  const params = new URLSearchParams();
  params.set("q", q);
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  return apiGet(`/public/clusters/${encodeURIComponent(clusterSlug)}/search?${params.toString()}`, {
    signal,
  });
}
