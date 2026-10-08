/**
 * Classify a clicked link on a restaurant profile / menu page for engagement analytics,
 * using only its href. Returns { event, fields, navigation } or null (not tracked).
 */

const ORDER_HOSTS = [
  "doordash.com",
  "ubereats.com",
  "grubhub.com",
  "seamless.com",
  "postmates.com",
  "toasttab.com",
  "chownow.com",
  "order.online",
  "slicelife.com",
  "square.site",
  "clover.com",
];

const MAP_HOSTS = ["maps.google.com", "maps.apple.com", "goo.gl", "maps.app.goo.gl"];

function parse(href) {
  try {
    return new URL(href, window.location.origin);
  } catch {
    return null;
  }
}

function hostMatches(host, list) {
  return list.some((h) => host === h || host.endsWith(`.${h}`));
}

function sameDestination(a, b) {
  if (!a || !b) return false;
  const strip = (u) => `${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "")}`.toLowerCase();
  return strip(a) === strip(b);
}

/**
 * @param {HTMLAnchorElement} anchor
 * @param {object} ctx { restaurantId, website, directionsUrl, pageType }
 */
export function classifyRestaurantLink(anchor, { restaurantId = null, website = null, directionsUrl = null, pageType = "profile" } = {}) {
  const raw = anchor?.getAttribute?.("href") || "";
  if (!raw || raw.startsWith("#") || raw.startsWith("javascript:")) return null;
  const rid = Number(restaurantId) || null;

  if (raw.toLowerCase().startsWith("tel:")) {
    return rid ? { event: "outbound_click", fields: { restaurant_id: rid, subtype: "phone" } } : null;
  }

  const url = parse(raw);
  if (!url || !/^https?:$/.test(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  const internal = url.origin === window.location.origin;

  if (!internal) {
    if (!rid) return null;
    const directions = directionsUrl ? parse(directionsUrl) : null;
    if ((directions && sameDestination(url, directions)) || hostMatches(host, MAP_HOSTS) ||
        (host.endsWith("google.com") && url.pathname.startsWith("/maps"))) {
      return { event: "outbound_click", fields: { restaurant_id: rid, subtype: "directions" } };
    }
    if (hostMatches(host, ORDER_HOSTS)) {
      return { event: "outbound_click", fields: { restaurant_id: rid, subtype: "order" } };
    }
    const site = website ? parse(website) : null;
    if (site && sameDestination(url, site)) {
      return { event: "outbound_click", fields: { restaurant_id: rid, subtype: "website" } };
    }
    return null;
  }

  const path = url.pathname;
  const deal = path.match(/^\/deals\/(\d+)(?:\/|$)/);
  if (deal) {
    const dealId = Number(deal[1]);
    return { event: "deal_click", fields: { deal_id: dealId }, navigation: { target_deal_id: dealId, href: raw } };
  }
  if (path.startsWith("/events/")) {
    return { event: "event_click", fields: { label: decodeURIComponent(path.slice("/events/".length)).slice(0, 120) } };
  }
  if (pageType === "profile" && rid && /\/menu\/?$/.test(path)) {
    return {
      event: "restaurant_click",
      fields: { restaurant_id: rid, subtype: "menu" },
      navigation: { target_restaurant_id: rid, href: raw },
    };
  }
  return null;
}
