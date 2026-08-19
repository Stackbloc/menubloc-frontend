import { apiGet } from "./api.js";

export function fetchPublicEventsNear(lat, lng, { radiusMiles = 30, limit = 24 } = {}) {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius_miles: String(radiusMiles),
    limit: String(limit),
  });
  return apiGet(`/public/events?${params.toString()}`);
}
