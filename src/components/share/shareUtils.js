/**
 * ============================================================
 * Path: menubloc-frontend/src/components/share/shareUtils.js
 * File: shareUtils.js
 * Date: 2026-04-03
 * Purpose:
 *   Reusable share helpers for Menuply public pages.
 *
 *   Covers:
 *   - canonical public URL construction
 *   - native share payload generation
 *   - fallback channel URL generation
 *   - clipboard copy
 *   - lightweight analytics event tracking
 *   - dynamic Open Graph / Twitter Card metadata updates
 * ============================================================
 */

import { formatMenuItemName } from "../../utils/formatMenuItemName.js";
import {
  absoluteCanonicalUrl,
  CANONICAL_ORIGIN,
  menuItemPath,
  restaurantMenuPath,
  restaurantPath,
} from "../../lib/canonicalUrl.js";
import { clusterPath } from "../../lib/clusterUrl.js";
import {
  buildClusterShareDescription,
  buildClusterShareTitle,
} from "../../lib/clusterLegalCopy.js";

const DEFAULT_SHARE_IMAGE_PATH = "/menuply-share-default.svg";
const ALLOWED_SHARE_HOSTS = new Set(["menuply.com", "www.menuply.com"]);

function asText(value) {
  return value == null ? "" : String(value).trim();
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return "";
}

function isLocalDevOrigin(origin) {
  const raw = asText(origin).toLowerCase();
  if (!raw) return false;
  try {
    const host = new URL(raw).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

/**
 * Consumer share links always use https://menuply.com except local Vite smoke.
 * Never use window.location.origin (preview / share.google shells).
 */
export function getPublicOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    const live = String(window.location.origin).trim().replace(/\/$/, "");
    if (isLocalDevOrigin(live)) return live;
  }
  return CANONICAL_ORIGIN;
}

export function toAbsoluteUrl(value, origin = getPublicOrigin()) {
  const raw = asText(value);
  if (!raw) return "";

  try {
    return new URL(raw, origin).toString();
  } catch {
    return "";
  }
}

/**
 * Reject Google-wrapped / non-Menuply hosts before Copy Link or navigator.share.
 * Localhost absolute URLs are allowed only for local smoke.
 */
export function normalizeConsumerShareUrl(url) {
  const raw = asText(url);
  if (!raw) return "";

  try {
    const parsed = new URL(raw, CANONICAL_ORIGIN);
    const host = parsed.hostname.toLowerCase();
    if (ALLOWED_SHARE_HOSTS.has(host)) {
      parsed.protocol = "https:";
      parsed.hostname = "menuply.com";
      return parsed.toString();
    }
    if (isLocalDevOrigin(parsed.origin)) return parsed.toString();
    return "";
  } catch {
    return "";
  }
}

function toConsumerShareAbsolute(pathOrUrl) {
  const raw = asText(pathOrUrl);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return normalizeConsumerShareUrl(raw);
  const absolute = absoluteCanonicalUrl(raw.startsWith("/") ? raw : `/${raw}`);
  return normalizeConsumerShareUrl(absolute || "");
}

export function buildCanonicalMenuPath({ restaurantSlug, restaurantId, city, state }) {
  const path = restaurantMenuPath({ slug: restaurantSlug, city, state, id: restaurantId });
  return path || "/menus";
}

export const MENU_ITEM_HIGHLIGHT_QUERY_KEY = "highlightItem";

const HIGHLIGHT_PRESERVED_QUERY_KEYS = Object.freeze([
  "lat",
  "lng",
  "radius_miles",
  "city",
  "state",
  "location_label",
  "q",
  "near",
  "zip",
]);

/** Copy geo/search context onto a menu highlight link (not highlightItem/from). */
export function highlightMenuLinkExtrasFromSearch(searchOrParams) {
  const params = searchOrParams instanceof URLSearchParams
    ? searchOrParams
    : new URLSearchParams(String(searchOrParams || "").replace(/^\?/, ""));
  const extras = {};
  for (const key of HIGHLIGHT_PRESERVED_QUERY_KEYS) {
    const value = params.get(key);
    if (value != null && String(value).trim() !== "") extras[key] = value;
  }
  return extras;
}

/** Append ?highlightItem= so PublicMenuPage can scroll + flash the row. */
export function appendMenuHighlightQuery(path, { menuItemId, extraParams = {} } = {}) {
  if (!path) return "/menus";
  if (!menuItemId) return path;
  const [pathname, existingQuery = ""] = String(path).split("?");
  const params = new URLSearchParams(existingQuery);
  params.set(MENU_ITEM_HIGHLIGHT_QUERY_KEY, String(menuItemId));
  for (const [key, value] of Object.entries(extraParams)) {
    if (value != null && String(value).trim() !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function menuItemDomId(menuItemId) {
  if (menuItemId == null || menuItemId === "") return null;
  return `menu-item-${String(menuItemId)}`;
}

export function buildCanonicalMenuUrl({ restaurantSlug, restaurantId, city, state }) {
  return toConsumerShareAbsolute(
    buildCanonicalMenuPath({ restaurantSlug, restaurantId, city, state })
  );
}

export function getCanonicalMenuUrl(restaurant) {
  return buildCanonicalMenuUrl({
    restaurantSlug: restaurant?.slug || restaurant?.restaurant_slug || restaurant?.restaurantSlug || null,
    restaurantId: restaurant?.id || restaurant?.restaurant_id || restaurant?.restaurantId || null,
    city: restaurant?.city || restaurant?.restaurant_city || null,
    state: restaurant?.state || restaurant?.restaurant_state || null,
  });
}

export function resolveShareImageUrl({ imageUrl, origin = getPublicOrigin() }) {
  const resolved = toAbsoluteUrl(imageUrl, origin);
  if (resolved) return resolved;
  return toAbsoluteUrl(DEFAULT_SHARE_IMAGE_PATH, origin);
}

export function buildMenuShareMetadata({
  restaurantName,
  restaurantSlug,
  restaurantId,
  city,
  state,
  logoUrl,
  origin = getPublicOrigin(),
}) {
  const safeRestaurantName = pickFirstText(restaurantName, "this restaurant");
  const title = `Check out the menu for ${safeRestaurantName} on Menuply`;
  const text = `Explore the menu, deals, and nutrition insights for ${safeRestaurantName} on Menuply.`;
  const url = buildCanonicalMenuUrl({ restaurantSlug, restaurantId, city, state });
  const image = resolveShareImageUrl({ imageUrl: logoUrl, origin });

  return { title, text, url, image, restaurantName: safeRestaurantName };
}

export function getCanonicalMenuItemPath({ restaurant, menuItem }) {
  const itemId = pickFirstText(menuItem?.menu_item_id, menuItem?.id, menuItem?.menuItemId);
  if (!itemId) return "/menu-items";
  const slug = pickFirstText(restaurant?.slug, restaurant?.restaurant_slug);
  const city = pickFirstText(restaurant?.city, restaurant?.restaurant_city);
  const state = pickFirstText(restaurant?.state, restaurant?.restaurant_state);
  const path = menuItemPath({ restaurantSlug: slug, city, state, itemId });
  return path || `/menu-items/${encodeURIComponent(itemId)}`;
}

export function getCanonicalMenuItemUrl({ restaurant, menuItem }) {
  return toConsumerShareAbsolute(getCanonicalMenuItemPath({ restaurant, menuItem }));
}

export function buildDishShareData({
  restaurant,
  menuItem,
  url,
  origin = getPublicOrigin(),
}) {
  const restaurantName = pickFirstText(
    restaurant?.name,
    restaurant?.restaurant_name,
    restaurant?.restaurantName,
    menuItem?.restaurant_name,
    menuItem?.restaurant?.name,
    menuItem?.restaurant?.restaurant_name,
    "this restaurant"
  );
  const dishName = formatMenuItemName(
    pickFirstText(
      menuItem?.name,
      menuItem?.menu_item_name,
      menuItem?.item_name,
      menuItem?.title,
      "this dish"
    )
  );
  const canonicalUrl =
    normalizeConsumerShareUrl(asText(url)) || getCanonicalMenuItemUrl({ restaurant, menuItem });
  const image = resolveShareImageUrl({
    imageUrl: pickFirstText(
      menuItem?.itemPhotoUrl,
      menuItem?.item_photo_url,
      menuItem?.itemPhotoURL,
      menuItem?.photo_url,
      menuItem?.image_url,
      menuItem?.imageUrl,
      restaurant?.logoUrl,
      restaurant?.logo_url,
      restaurant?.restaurant_logo_url,
      menuItem?.restaurant_logo_url,
      menuItem?.logo_url
    ),
    origin,
  });

  return {
    title: `Check out ${dishName} at ${restaurantName} on Menuply`,
    text: `See price, nutrition insights, and menu details for ${dishName} at ${restaurantName} on Menuply.`,
    url: canonicalUrl,
    image,
    restaurantName,
    dishName,
  };
}

export const buildMenuShareData = buildMenuShareMetadata;

export function buildRestaurantShareData({
  restaurantName,
  restaurantSlug,
  restaurantId,
  city,
  state,
  logoUrl,
  origin = getPublicOrigin(),
}) {
  const safeRestaurantName = pickFirstText(restaurantName, "this restaurant");
  const title = `${safeRestaurantName} on Menuply`;
  const text = `Check out ${safeRestaurantName} on Menuply — view the menu, nutrition insights, and deals.`;
  const path = restaurantPath({ slug: restaurantSlug, city, state });
  const url = toConsumerShareAbsolute(
    path || (restaurantId ? `/public/restaurants/${encodeURIComponent(String(restaurantId))}` : "/")
  );
  const image = resolveShareImageUrl({ imageUrl: logoUrl, origin });
  return { title, text, url, image, restaurantName: safeRestaurantName };
}

export function buildClusterShareData({ cluster, origin = getPublicOrigin() }) {
  const name = pickFirstText(cluster?.area_name, cluster?.name, "this area");
  const city = pickFirstText(cluster?.city);
  const state = pickFirstText(cluster?.state);
  const slug = pickFirstText(cluster?.slug);
  const path = clusterPath({ state, city, slug });
  const url = toConsumerShareAbsolute(path || "/");
  const image = resolveShareImageUrl({
    imageUrl: pickFirstText(cluster?.og_image_url),
    origin,
  });
  const title = buildClusterShareTitle(cluster);
  const description = buildClusterShareDescription(cluster);
  const text = description;
  return { title, text, url, image, description, clusterName: name };
}

export function buildShareLinks({ title, text, url }) {
  const safeTitle = asText(title);
  const safeText = asText(text);
  const safeUrl = normalizeConsumerShareUrl(url) || asText(url);
  const combinedText = [safeText, safeUrl].filter(Boolean).join(" ");
  const emailBody = [safeText, "", safeUrl].filter(Boolean).join("\n");

  return {
    sms: `sms:?&body=${encodeURIComponent(combinedText)}`,
    email: `mailto:?subject=${encodeURIComponent(safeTitle)}&body=${encodeURIComponent(emailBody)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(safeUrl)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(safeText)}&url=${encodeURIComponent(safeUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(combinedText)}`,
  };
}

export async function copyText(value) {
  const text = asText(value);
  if (!text) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }

  return copied;
}

export function trackShareEvent(eventName, {
  restaurantId = null,
  restaurantSlug = null,
  menuItemId = null,
  menuItemName = null,
  pageType = null,
  shareTarget = null,
} = {}) {
  if (typeof window === "undefined") return;

  const payload = {
    restaurant_id: restaurantId || null,
    restaurant_slug: restaurantSlug || null,
    menu_item_id: menuItemId || null,
    menu_item_name: menuItemName || null,
    page_type: pageType || null,
    share_target: shareTarget || null,
  };

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...payload });
  }
}

function upsertManagedTag(tagName, attributes) {
  if (typeof document === "undefined") return null;

  const selector = Object.entries(attributes)
    .filter(([key]) => key === "name" || key === "property" || key === "rel")
    .map(([key, value]) => `${tagName}[${key}="${String(value).replace(/"/g, '\\"')}"]`)
    .join("");

  let element = selector ? document.head.querySelector(selector) : null;
  const created = !element;
  const previousAttributes = element ? {
    content: element.getAttribute("content"),
    href: element.getAttribute("href"),
  } : {
    content: null,
    href: null,
  };

  if (!element) {
    element = document.createElement(tagName);
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null) return;
    element.setAttribute(key, value);
  });

  element.setAttribute("data-menuply-managed", "true");
  return { element, created, previousAttributes };
}

export function applyDocumentSocialMetadata({
  title,
  description,
  url,
  image,
  twitterCard = "summary_large_image",
}) {
  if (typeof document === "undefined") return () => {};

  const previousTitle = document.title;
  document.title = asText(title) || previousTitle;

  const managed = [
    upsertManagedTag("meta", { name: "description", content: asText(description) }),
    upsertManagedTag("link", { rel: "canonical", href: asText(url) }),
    upsertManagedTag("meta", { property: "og:title", content: asText(title) }),
    upsertManagedTag("meta", { property: "og:description", content: asText(description) }),
    upsertManagedTag("meta", { property: "og:url", content: asText(url) }),
    upsertManagedTag("meta", { property: "og:image", content: asText(image) }),
    upsertManagedTag("meta", { name: "twitter:card", content: asText(twitterCard) }),
    upsertManagedTag("meta", { name: "twitter:title", content: asText(title) }),
    upsertManagedTag("meta", { name: "twitter:description", content: asText(description) }),
    upsertManagedTag("meta", { name: "twitter:image", content: asText(image) }),
  ].filter(Boolean);

  const snapshot = managed.map(({ element, created, previousAttributes }) => ({
    element,
    created,
    attributes: previousAttributes,
  }));

  return () => {
    document.title = previousTitle;

    snapshot.forEach(({ element, created, attributes }) => {
      if (!element) return;
      if (created) {
        element.remove();
        return;
      }

      if (attributes.content == null) element.removeAttribute("content");
      else element.setAttribute("content", attributes.content);

      if (attributes.href == null) element.removeAttribute("href");
      else element.setAttribute("href", attributes.href);
    });
  };
}
