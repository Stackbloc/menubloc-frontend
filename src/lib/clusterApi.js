import { apiGet, apiPost } from "./api.js";

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

export async function previewCommunityClusterCandidates(payload, { signal } = {}) {
  if (signal) {
    // apiPost does not support AbortSignal yet.
  }
  return apiPost("/public/clusters/community/preview-candidates", payload || {});
}

export async function createCommunityCluster(payload, { signal } = {}) {
  if (signal) {
    // apiPost does not support AbortSignal yet.
  }
  return apiPost("/public/clusters/community", payload || {});
}

export async function createCluster(payload, { signal } = {}) {
  if (signal) {
    // apiPost does not support AbortSignal yet.
  }
  return apiPost("/public/clusters/create", payload || {});
}

export async function fetchMyClusters({ signal } = {}) {
  return apiGet("/public/clusters/my", { signal });
}

export async function fetchFeaturedClusters({ signal } = {}) {
  return apiGet("/public/clusters/featured", { signal });
}

export async function fetchClusterByAccessKey(key, { signal } = {}) {
  return apiGet(`/public/clusters/access/${encodeURIComponent(key)}`, { signal });
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

export async function fetchClusterMenuItems(
  clusterSlug,
  { limit = 40, offset = 0, summary = false, mksCategory = null, signal } = {}
) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  if (summary) params.set("summary", "1");
  if (mksCategory) params.set("mks_category", String(mksCategory));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/menu-items${qs ? `?${qs}` : ""}`;
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

export async function fetchClusterCityPage(stateSlug, citySlug, { signal } = {}) {
  return apiGet(
    `/public/clusters/cities/${encodeURIComponent(stateSlug)}/${encodeURIComponent(citySlug)}`,
    { signal }
  );
}

export async function searchClusterCity(stateSlug, citySlug, { q, limit = 24, offset = 0, signal } = {}) {
  const params = new URLSearchParams();
  params.set("q", q);
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  return apiGet(
    `/public/clusters/cities/${encodeURIComponent(stateSlug)}/${encodeURIComponent(citySlug)}/search?${params.toString()}`,
    { signal }
  );
}

export async function submitClusterContribution(payload, { signal } = {}) {
  if (signal) {
    // apiPost does not support AbortSignal yet.
  }
  return apiPost("/public/clusters/contributions", payload || {});
}
