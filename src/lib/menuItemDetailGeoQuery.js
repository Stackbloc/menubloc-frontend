/**
 * Query string for GET /menu-items/:id franchise geo resolution.
 * Search often has city/state without lat/lng; BE accepts all four
 * (lat/lng preferred when present; city/state alone avoids national default location).
 */
export function buildMenuItemDetailApiQuery({
  lat = null,
  lng = null,
  city = null,
  state = null,
} = {}) {
  const params = new URLSearchParams();
  const latText = lat == null || lat === "" ? "" : String(lat).trim();
  const lngText = lng == null || lng === "" ? "" : String(lng).trim();
  if (latText && lngText) {
    params.set("lat", latText);
    params.set("lng", lngText);
  }
  const cityText = city == null ? "" : String(city).trim();
  const stateText = state == null ? "" : String(state).trim();
  if (cityText) params.set("city", cityText);
  if (stateText) params.set("state", stateText);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
