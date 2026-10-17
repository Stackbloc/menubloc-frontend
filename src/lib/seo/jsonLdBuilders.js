/**
 * Shared schema.org JSON-LD builders for Edge Middleware SEO injection.
 * Edge-safe: no Node APIs, no DOM.
 */

import {
  CANONICAL_ORIGIN,
  absoluteCanonicalUrl,
  restaurantMenuPath,
  restaurantPath,
} from "../canonicalUrlCore.js";

function trimStr(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function absoluteUrl(pathOrUrl) {
  const raw = trimStr(pathOrUrl);
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return absoluteCanonicalUrl(raw.startsWith("/") ? raw : `/${raw}`);
}

export function restaurantCanonicalPath(restaurant) {
  return restaurantPath(restaurant);
}

export function menuItemCanonicalPath(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return `/menu-items/${n}`;
}

export function destinationVenueCanonicalPath(slug) {
  const s = trimStr(slug);
  return s ? `/destination-venues/${encodeURIComponent(s)}` : null;
}

const VIDEO_KINDS = new Set([
  "ate",
  "want",
  // plan / Join Me / Ask Me Out = coordination logistics — not SEO content
  "event",
  "deal",
  "managed",
  "cooking",
]);

export function videoWatchPath(kind, id) {
  const k = trimStr(kind)?.toLowerCase();
  const n = Number(id);
  if (!k || !VIDEO_KINDS.has(k) || !Number.isInteger(n) || n <= 0) return null;
  return `/videos/${k}/${n}`;
}

/** Map destination_venues.venue_type → schema.org @type */
export function venueSchemaType(venueType) {
  switch (String(venueType || "").toLowerCase()) {
    case "stadium":
    case "arena":
      return "StadiumOrArena";
    case "airport":
      return "Airport";
    case "casino":
      return "Casino";
    case "university":
      return "CollegeOrUniversity";
    case "concert_venue":
      return "MusicVenue";
    case "entertainment_complex":
      return "EntertainmentBusiness";
    default:
      return "Place";
  }
}

function postalAddress({ address_line_1, city, state, postal_code, country } = {}) {
  const street = trimStr(address_line_1);
  const locality = trimStr(city);
  const region = trimStr(state);
  const postal = trimStr(postal_code);
  const ctry = trimStr(country) || "US";
  if (!street && !locality && !region) return undefined;
  return {
    "@type": "PostalAddress",
    ...(street ? { streetAddress: street } : {}),
    ...(locality ? { addressLocality: locality } : {}),
    ...(region ? { addressRegion: region } : {}),
    ...(postal ? { postalCode: postal } : {}),
    addressCountry: ctry,
  };
}

export function buildRestaurantJsonLd(restaurant) {
  if (!restaurant?.name && !restaurant?.slug && !restaurant?.id) return null;
  const path = restaurantCanonicalPath(restaurant);
  const url = absoluteUrl(path);
  if (!url) return null;
  const address = postalAddress({
    address_line_1: restaurant.address_line_1 || restaurant.address,
    city: restaurant.city,
    state: restaurant.state,
    postal_code: restaurant.postal_code || restaurant.zip,
    country: restaurant.country,
  });
  const telephone = trimStr(restaurant.phone);
  const cuisine = trimStr(restaurant.cuisine);
  return {
    "@type": "Restaurant",
    "@id": `${url}#restaurant`,
    name: trimStr(restaurant.name) || trimStr(restaurant.slug),
    url,
    ...(address ? { address } : {}),
    ...(telephone ? { telephone } : {}),
    ...(cuisine ? { servesCuisine: cuisine } : {}),
  };
}

// Caps keep the injected <script> small for very large menus.
const MENU_JSONLD_MAX_SECTIONS = 60;
const MENU_JSONLD_MAX_ITEMS = 300;

/** "2.85" from price_cents (preferred) or a "$2.85" display string; null when unknown/zero. */
export function menuItemPriceString(item) {
  const cents = Number(item?.price_cents);
  if (Number.isInteger(cents) && cents > 0) return (cents / 100).toFixed(2);
  const m = /^\$?\s*(\d+(?:\.\d{1,2})?)$/.exec(trimStr(item?.price) || "");
  if (m && Number(m[1]) > 0) return Number(m[1]).toFixed(2);
  return null;
}

/**
 * schema.org Menu → MenuSection → MenuItem (+ Offer) from the public menu payload
 * (GET /public/restaurants/:id/menu `sections`), so markup matches what the page shows.
 */
export function buildMenuJsonLd(sections, restaurant) {
  const menuUrl = absoluteUrl(restaurantMenuPath(restaurant || {}));
  if (!menuUrl || !Array.isArray(sections)) return null;
  let itemBudget = MENU_JSONLD_MAX_ITEMS;
  const sectionNodes = [];
  for (const section of sections.slice(0, MENU_JSONLD_MAX_SECTIONS)) {
    if (itemBudget <= 0) break;
    const items = [];
    for (const item of Array.isArray(section?.items) ? section.items : []) {
      if (itemBudget <= 0) break;
      const name = trimStr(item?.name);
      if (!name) continue;
      const node = { "@type": "MenuItem", name };
      const description = trimStr(item.description);
      if (description) node.description = description;
      const price = menuItemPriceString(item);
      if (price) node.offers = { "@type": "Offer", price, priceCurrency: "USD" };
      items.push(node);
      itemBudget -= 1;
    }
    if (!items.length) continue;
    sectionNodes.push({
      "@type": "MenuSection",
      name: trimStr(section.title) || trimStr(section.name) || "Menu",
      hasMenuItem: items,
    });
  }
  if (!sectionNodes.length) return null;
  const restaurantName = trimStr(restaurant?.name);
  return {
    "@type": "Menu",
    "@id": `${menuUrl}#menu`,
    name: restaurantName ? `${restaurantName} Menu` : "Menu",
    url: menuUrl,
    hasMenuSection: sectionNodes,
  };
}

export function buildMenuItemJsonLd(item, { restaurant } = {}) {
  if (!item?.id && !item?.name) return null;
  const path = menuItemCanonicalPath(item.id);
  const url = absoluteUrl(path);
  if (!url) return null;
  const node = {
    "@type": "MenuItem",
    "@id": `${url}#menuitem`,
    name: trimStr(item.name) || `Menu item ${item.id}`,
    url,
  };
  const desc = trimStr(item.description);
  if (desc) node.description = desc;
  const restaurantLd = restaurant ? buildRestaurantJsonLd(restaurant) : null;
  if (restaurantLd?.["@id"]) {
    node.isRelatedTo = { "@id": restaurantLd["@id"] };
  }
  return node;
}

export function buildDestinationVenueJsonLd(venue) {
  if (!venue?.slug && !venue?.name) return null;
  const path = destinationVenueCanonicalPath(venue.slug);
  const url = absoluteUrl(path);
  if (!url) return null;
  const name = trimStr(venue.official_name) || trimStr(venue.name);
  const address = postalAddress(venue);
  const node = {
    "@type": venueSchemaType(venue.venue_type),
    "@id": `${url}#venue`,
    name,
    url,
  };
  if (address) node.address = address;
  const website = absoluteUrl(venue.website_url);
  if (website) node.sameAs = website;
  return node;
}

export function buildClusterRelationJsonLd(cluster) {
  if (!cluster) return null;
  const path = trimStr(cluster.path);
  const url = absoluteUrl(path);
  if (!url) return null;
  return {
    "@type": "Place",
    "@id": `${url}#cluster`,
    name: trimStr(cluster.name) || trimStr(cluster.slug),
    url,
  };
}

function isoDurationFromMs(durationMs) {
  const ms = Number(durationMs);
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  const totalSec = Math.round(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  let out = "PT";
  if (h) out += `${h}H`;
  if (m) out += `${m}M`;
  if (s || (!h && !m)) out += `${s}S`;
  return out;
}

/**
 * VideoObject with all confirmed tags referenced via @id (not mutually exclusive).
 */
export function buildVideoObjectJsonLd(video, refs = {}) {
  if (!video) return null;
  const path = trimStr(video.path) || videoWatchPath(video.kind, video.id);
  const url = absoluteUrl(path);
  if (!url) return null;

  const contentUrl = absoluteUrl(video.video_url || video.contentUrl);
  const thumbnailUrl = absoluteUrl(video.photo_url || video.thumbnailUrl);
  const name = trimStr(video.title) || "Menuply video";
  const description = trimStr(video.description || video.comment);
  const embedUrl = absoluteUrl(video.embed_path || video.embedUrl || path);
  const keywordsRaw = video.keywords;
  const keywords = Array.isArray(keywordsRaw)
    ? keywordsRaw.map((k) => trimStr(k)).filter(Boolean).slice(0, 8)
    : typeof keywordsRaw === "string"
      ? keywordsRaw
          .split(/[,;]+/)
          .map((k) => trimStr(k))
          .filter(Boolean)
          .slice(0, 8)
      : [];

  const node = {
    "@type": "VideoObject",
    "@id": `${url}#video`,
    name,
    url,
  };
  if (description) node.description = description;
  if (thumbnailUrl) node.thumbnailUrl = thumbnailUrl;
  if (video.created_at || video.uploadDate) {
    node.uploadDate = String(video.created_at || video.uploadDate).slice(0, 10);
  }
  const duration = isoDurationFromMs(video.duration_ms ?? video.durationMs);
  if (duration) node.duration = duration;
  if (contentUrl) node.contentUrl = contentUrl;
  if (embedUrl) node.embedUrl = embedUrl;
  if (keywords.length === 1) node.keywords = keywords[0];
  else if (keywords.length > 1) node.keywords = keywords;

  const contentLocation = video.content_location || video.contentLocation || null;
  if (contentLocation && typeof contentLocation === "object") {
    node.contentLocation = contentLocation;
  } else {
    const restaurant = refs.restaurant || video.restaurant;
    if (restaurant?.city || restaurant?.address_line_1 || restaurant?.address) {
      const address = postalAddress({
        address_line_1: restaurant.address_line_1 || restaurant.address,
        city: restaurant.city,
        state: restaurant.state,
        postal_code: restaurant.postal_code,
        country: restaurant.country || "US",
      });
      if (address || restaurant.name) {
        node.contentLocation = {
          "@type": "Place",
          ...(trimStr(restaurant.name) ? { name: trimStr(restaurant.name) } : {}),
          ...(address ? { address } : {}),
        };
      }
    }
  }

  const restaurant = refs.restaurant || video.restaurant;
  const menuItem = refs.menuItem || video.menu_item;
  const venue = refs.venue || video.destination_venue;
  const cluster = refs.cluster || video.cluster;

  const restaurantLd = restaurant ? buildRestaurantJsonLd(restaurant) : null;
  const menuItemLd = menuItem ? buildMenuItemJsonLd(menuItem, { restaurant }) : null;
  const venueLd = venue ? buildDestinationVenueJsonLd(venue) : null;
  const clusterLd = cluster ? buildClusterRelationJsonLd(cluster) : null;

  const about = [];
  if (restaurantLd) about.push({ "@id": restaurantLd["@id"] });
  if (menuItemLd) about.push({ "@id": menuItemLd["@id"] });
  if (venueLd) about.push({ "@id": venueLd["@id"] });
  if (clusterLd) about.push({ "@id": clusterLd["@id"] });
  if (about.length === 1) node.about = about[0];
  else if (about.length > 1) node.about = about;

  return {
    video: node,
    entities: [restaurantLd, menuItemLd, venueLd, clusterLd].filter(Boolean),
  };
}

export function buildJsonLdGraph(nodes) {
  const list = (Array.isArray(nodes) ? nodes : [nodes]).filter(Boolean);
  if (!list.length) return null;
  if (list.length === 1) {
    return { "@context": "https://schema.org", ...list[0] };
  }
  return {
    "@context": "https://schema.org",
    "@graph": list,
  };
}

export function toJsonLdScriptTag(graph) {
  if (!graph) return "";
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Restaurant profile / menu page graph. Restaurant.hasMenu is always the menu page URL;
 * when `menuSections` is given (menu page, crawler request) the full Menu node is
 * added to the graph and hasMenu references it by @id instead.
 */
export function restaurantPageJsonLd(restaurant, videos = [], { menuSections } = {}) {
  const restaurantLd = buildRestaurantJsonLd(restaurant);
  if (!restaurantLd) return null;
  const menuLd = menuSections ? buildMenuJsonLd(menuSections, restaurant) : null;
  const menuUrl = absoluteUrl(restaurantMenuPath(restaurant));
  if (menuLd) restaurantLd.hasMenu = { "@id": menuLd["@id"] };
  else if (menuUrl) restaurantLd.hasMenu = menuUrl;
  const list = Array.isArray(videos) ? videos : [];
  const videoNodes = [];
  for (const video of list) {
    if (!video || video.indexable === false) continue;
    const built = buildVideoObjectJsonLd(video, { restaurant });
    if (built?.video) {
      // Link video about restaurant via @id when not already set
      if (!built.video.about && restaurantLd["@id"]) {
        built.video.about = { "@id": restaurantLd["@id"] };
      }
      videoNodes.push(built.video);
    }
  }
  return buildJsonLdGraph([restaurantLd, menuLd, ...videoNodes]);
}

export function menuItemPageJsonLd(item, restaurant) {
  const restaurantLd = restaurant ? buildRestaurantJsonLd(restaurant) : null;
  const itemLd = buildMenuItemJsonLd(item, { restaurant });
  return buildJsonLdGraph([restaurantLd, itemLd].filter(Boolean));
}

export function destinationVenuePageJsonLd(venue) {
  return buildJsonLdGraph(buildDestinationVenueJsonLd(venue));
}

export function videoWatchPageJsonLd(video) {
  if (!video || video.indexable === false) return null;
  const built = buildVideoObjectJsonLd(video);
  if (!built) return null;
  return buildJsonLdGraph([built.video, ...built.entities]);
}

export { CANONICAL_ORIGIN };
