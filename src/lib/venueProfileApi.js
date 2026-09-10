/**
 * Public campus Venue profile API (§1.20 destination_venues).
 * Uses API_BASE via api.js — never same-origin alone.
 */

import { apiGet } from "./api.js";

export async function fetchCampusVenues(
  { city = null, state = null, limit = 50, signal } = {}
) {
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (state) params.set("state", state);
  if (limit != null) params.set("limit", String(limit));
  const qs = params.toString();
  return apiGet(`/public/venues${qs ? `?${qs}` : ""}`, { signal });
}

export async function fetchVenueProfile(slug, { signal } = {}) {
  return apiGet(`/public/venues/${encodeURIComponent(slug)}`, { signal });
}
