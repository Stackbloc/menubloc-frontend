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

/** University clusters only — empty for non-college clusters / before data exists. */
export async function fetchClusterCampusDining(clusterSlug, { limit = 24, signal } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/campus-dining${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

/**
 * Campus live indicators (Phase 1) — glance + per-venue Line/Food.
 * Pass guest_key so the Update sheet can show the viewer's own taps.
 */
export async function fetchClusterCampusLive(clusterSlug, { guestKey = null, signal } = {}) {
  const params = new URLSearchParams();
  if (guestKey) params.set("guest_key", String(guestKey));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/live${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

/** One-tap Line or Food report (or clear). Guests welcome. */
export async function postClusterCampusLiveReport(clusterSlug, payload = {}) {
  return apiPost(`/public/clusters/${encodeURIComponent(clusterSlug)}/live/report`, payload || {});
}

/** Campus posts (Phase 2) — recent window, newest first; optional venue filter. */
export async function fetchClusterLivePosts(
  clusterSlug,
  { guestKey = null, restaurantId = null, limit = null, signal } = {}
) {
  const params = new URLSearchParams();
  if (guestKey) params.set("guest_key", String(guestKey));
  if (restaurantId != null) params.set("restaurant_id", String(restaurantId));
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/live/posts${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

/** Create a campus post (comment). Guests welcome. */
export async function createClusterLivePost(clusterSlug, payload = {}) {
  return apiPost(`/public/clusters/${encodeURIComponent(clusterSlug)}/live/posts`, payload || {});
}

/** "I'm in" toggle on an eating invite. Guests welcome. */
export async function toggleClusterLivePostRsvp(clusterSlug, postId, payload = {}) {
  return apiPost(
    `/public/clusters/${encodeURIComponent(clusterSlug)}/live/posts/${encodeURIComponent(postId)}/rsvp`,
    payload || {}
  );
}

/** Hall Live clips (USC On campus): per-hall count + newest clip; recording flag state. */
export async function fetchClusterHallClipsSummary(clusterSlug, { signal } = {}) {
  return apiGet(`/public/clusters/${encodeURIComponent(clusterSlug)}/live/hall-clips`, { signal });
}

/** One hall's clips, newest first, inside the campus window. */
export async function fetchHallClips(clusterSlug, restaurantId, { guestKey = null, signal } = {}) {
  const params = new URLSearchParams();
  if (guestKey) params.set("guest_key", String(guestKey));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/live/hall-clips/${encodeURIComponent(
    restaurantId
  )}${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

/** Post an uploaded clip to a hall ({ video_url, duration_ms, body?, guest_key?, ...consent }). */
export async function createHallClip(clusterSlug, restaurantId, payload = {}) {
  return apiPost(
    `/public/clusters/${encodeURIComponent(clusterSlug)}/live/hall-clips/${encodeURIComponent(restaurantId)}`,
    payload || {}
  );
}

/** Report a campus post (hall clips use the same report; a clip hides on its first report). */
export async function reportClusterLivePost(clusterSlug, postId, payload = {}) {
  return apiPost(
    `/public/clusters/${encodeURIComponent(clusterSlug)}/live/posts/${encodeURIComponent(postId)}/report`,
    payload || {}
  );
}

/**
 * Public Cluster Feed — no auth, no subscription required.
 * Same underlying activity Waiter personalizes for followed clusters.
 */
export async function fetchClusterPublicFeed(clusterSlug, { hours = 72, limit = 24, signal } = {}) {
  const params = new URLSearchParams();
  if (hours != null) params.set("hours", String(hours));
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/feed${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

/**
 * Published venue events near this cluster (default 30 miles).
 * Landing overview only — not the food Cluster Feed.
 */
export async function fetchClusterNearbyEvents(
  clusterSlug,
  { radiusMiles = 30, limit = 16, signal } = {}
) {
  const params = new URLSearchParams();
  if (radiusMiles != null) params.set("radius_miles", String(radiusMiles));
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/events${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

export async function fetchClusterMenuItems(
  clusterSlug,
  { limit = 40, offset = 0, summary = false, mksCategory = null, drinkCategory = null, priceSort = null, signal } = {}
) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  if (summary) params.set("summary", "1");
  if (mksCategory) params.set("mks_category", String(mksCategory));
  if (drinkCategory && drinkCategory !== "all") {
    params.set("drink_category", String(drinkCategory));
  }
  // Server sorts the whole category before paging; sorting only the loaded page
  // hid cheaper items that sat beyond the first page.
  if (priceSort === "asc" || priceSort === "desc") params.set("price_sort", priceSort);
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/menu-items${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

export async function searchCluster(clusterSlug, { q, limit = 24, offset = 0, priceSort = null, signal } = {}) {
  const params = new URLSearchParams();
  params.set("q", q);
  if (limit != null) params.set("limit", String(limit));
  if (offset != null) params.set("offset", String(offset));
  // Server price-sorts every match before paging, so "Load more" continues the order.
  if (priceSort === "asc" || priceSort === "desc") params.set("price_sort", priceSort);
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

/**
 * Videos shown on this cluster's member restaurant profiles (same visibility rules),
 * merged: { videos, restaurants: { [restaurant_id]: video_key[] }, video_count }.
 */
export async function fetchClusterVideos(clusterSlug, { limit = 40, signal } = {}) {
  const params = new URLSearchParams();
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  const path = `/public/clusters/${encodeURIComponent(clusterSlug)}/videos${qs ? `?${qs}` : ""}`;
  return apiGet(path, { signal });
}

/** Member restaurant ids for public clusters (Feed clip → cluster badge). */
export async function fetchClusterMemberIds(slugs, { signal } = {}) {
  const list = (Array.isArray(slugs) ? slugs : []).map((s) => String(s || "").trim()).filter(Boolean);
  if (list.length === 0) return { ok: true, clusters: [] };
  const params = new URLSearchParams({ slugs: list.join(",") });
  return apiGet(`/public/clusters/member-ids?${params.toString()}`, { signal });
}
