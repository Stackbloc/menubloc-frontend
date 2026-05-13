const GA_DEBUG_QUERY_PARAM = "ga_debug";
const GA_DEBUG_STORAGE_KEY = "grubbid.analytics.debug";
const IS_PROD = Boolean(import.meta?.env?.PROD);

function isObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeString(value, maxLength = 120) {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function sanitizeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function sanitizeParams(params = {}) {
  const next = {};
  for (const [key, value] of Object.entries(isObject(params) ? params : {})) {
    if (value == null) continue;
    if (typeof value === "string") {
      const safe = sanitizeString(value);
      if (safe !== undefined) next[key] = safe;
      continue;
    }
    if (typeof value === "number") {
      const safe = sanitizeNumber(value);
      if (safe !== undefined) next[key] = safe;
      continue;
    }
    if (typeof value === "boolean") {
      next[key] = value;
    }
  }
  return next;
}

function isDebugEnabled() {
  if (typeof window === "undefined") return !IS_PROD;
  if (window.__grubbidAnalyticsDebug?.enabled) return true;
  if (!IS_PROD) return true;
  try {
    const params = new URLSearchParams(window.location.search || "");
    const queryValue = params.get(GA_DEBUG_QUERY_PARAM);
    if (queryValue === "1" || queryValue === "true") return true;
  } catch {
    // Ignore URL parsing errors.
  }
  try {
    return window.localStorage?.getItem(GA_DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function trackEvent(eventName, params = {}) {
  const safeEventName = sanitizeString(eventName, 40);
  if (!safeEventName) return false;
  const safeParams = sanitizeParams(params);

  if (isDebugEnabled() && typeof console !== "undefined") {
    console.info("[analytics]", safeEventName, safeParams);
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  try {
    window.gtag("event", safeEventName, safeParams);
    return true;
  } catch {
    return false;
  }
}

export function trackSearchPerformed({ searchTerm, source, resultCount, locationLabel } = {}) {
  return trackEvent("search_performed", {
    search_term: sanitizeString(searchTerm),
    source: sanitizeString(source),
    result_count: sanitizeNumber(resultCount),
    location_label: sanitizeString(locationLabel),
  });
}

export function trackRestaurantView({ restaurantId, restaurantName, slug, source } = {}) {
  return trackEvent("restaurant_view", {
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    restaurant_slug: sanitizeString(slug),
    source: sanitizeString(source),
  });
}

export function trackDealClick({ dealId, restaurantId, restaurantName, dealTitle } = {}) {
  return trackEvent("deal_click", {
    deal_id: sanitizeString(dealId),
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    deal_title: sanitizeString(dealTitle),
  });
}

export function trackRestaurantFollow({ restaurantId, restaurantName, source } = {}) {
  return trackEvent("restaurant_follow", {
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    source: sanitizeString(source),
  });
}

export function trackBillboardView({ restaurantId, restaurantName, billboardId } = {}) {
  return trackEvent("billboard_view", {
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    billboard_id: sanitizeString(billboardId),
  });
}

export function trackBillboardClick({ restaurantId, restaurantName, billboardId, target } = {}) {
  return trackEvent("billboard_click", {
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    billboard_id: sanitizeString(billboardId),
    target: sanitizeString(target),
  });
}

export function trackMenuShare({ restaurantId, restaurantName, menuId, shareMethod } = {}) {
  return trackEvent("menu_share", {
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    menu_id: sanitizeString(menuId),
    share_method: sanitizeString(shareMethod),
  });
}

export function trackCheckoutStarted({ restaurantId, restaurantName, cartValue, itemCount } = {}) {
  return trackEvent("begin_checkout", {
    currency: "USD",
    value: sanitizeNumber(cartValue),
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    item_count: sanitizeNumber(itemCount),
  });
}

export function trackCheckoutCompleted({ restaurantId, restaurantName, orderId, value, currency, itemCount } = {}) {
  return trackEvent("purchase", {
    transaction_id: sanitizeString(orderId),
    currency: sanitizeString(currency) || "USD",
    value: sanitizeNumber(value),
    restaurant_id: sanitizeString(restaurantId),
    restaurant_name: sanitizeString(restaurantName),
    item_count: sanitizeNumber(itemCount),
  });
}
