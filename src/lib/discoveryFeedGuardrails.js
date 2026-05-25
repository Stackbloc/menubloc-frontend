import { parseLocation } from "./locationUtils.js";

export function buildDiscoveryLocationKey({
  shouldUseAutoGeo = false,
  autoLocation = null,
  appliedLocation = "",
}) {
  if (shouldUseAutoGeo) {
    const city = String(autoLocation?.city || "").trim().toLowerCase();
    const state = String(autoLocation?.state || "").trim().toLowerCase();
    const lat = Number(autoLocation?.lat);
    const lng = Number(autoLocation?.lng);
    if (city && state) return `city:${city}|state:${state}`;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return `coords:${lat.toFixed(4)},${lng.toFixed(4)}`;
  }

  const parsedApplied = parseLocation(appliedLocation);
  if (parsedApplied.zip) return `zip:${String(parsedApplied.zip).trim().toLowerCase()}`;
  if (parsedApplied.city || parsedApplied.state) {
    return `city:${String(parsedApplied.city || "").trim().toLowerCase()}|state:${String(parsedApplied.state || "").trim().toLowerCase()}`;
  }
  const normalizedApplied = String(appliedLocation || "").trim().toLowerCase();
  if (normalizedApplied) return `label:${normalizedApplied}`;
  return "location:none";
}

export function buildDiscoveryFilterKey(filters = {}) {
  return Object.entries(filters)
    .filter(([, value]) => Boolean(value))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key]) => key)
    .join("|");
}

export function buildDiscoveryFeedScopeKey({ locationKey, filters = {} }) {
  return `${locationKey}::${buildDiscoveryFilterKey(filters)}`;
}

export function dedupeDiscoveryMenus(menus) {
  const seen = new Set();
  const deduped = [];

  for (const menu of Array.isArray(menus) ? menus : []) {
    const id =
      menu?.menu_id ??
      menu?.id ??
      menu?.restaurant_id ??
      `${String(menu?.restaurant_name || "").trim().toLowerCase()}|${String(menu?.name || "").trim().toLowerCase()}`;
    const key = String(id || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(menu);
  }

  return deduped;
}

export function createInitialDiscoveryFeedState() {
  return {
    activeScopeKey: "",
    latestRequestId: 0,
    menus: [],
    loading: false,
    cache: {},
  };
}

export function reduceDiscoveryFeedState(state, action) {
  switch (action.type) {
    case "start": {
      return {
        ...state,
        activeScopeKey: action.scopeKey,
        latestRequestId: action.requestId,
        loading: true,
        menus: Array.isArray(action.cachedMenus) ? action.cachedMenus : [],
      };
    }
    case "success": {
      if (action.scopeKey !== state.activeScopeKey || action.requestId !== state.latestRequestId) {
        return state;
      }
      const nextMenus = dedupeDiscoveryMenus(action.menus);
      return {
        ...state,
        loading: false,
        menus: nextMenus,
        cache: {
          ...state.cache,
          [action.scopeKey]: nextMenus,
        },
      };
    }
    case "error": {
      if (action.scopeKey !== state.activeScopeKey || action.requestId !== state.latestRequestId) {
        return state;
      }
      return {
        ...state,
        loading: false,
      };
    }
    default:
      return state;
  }
}
