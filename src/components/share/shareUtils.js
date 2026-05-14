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

const DEFAULT_PUBLIC_ORIGIN = "https://menuply.com";
const DEFAULT_SHARE_IMAGE_PATH = "/menuply-share-default.svg";

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

function getWindowOrigin() {
  if (typeof window === "undefined" || !window.location?.origin) return "";
  return String(window.location.origin).trim();
}

export function getPublicOrigin() {
  const envOrigin = asText(import.meta.env.VITE_PUBLIC_APP_URL);
  const origin = envOrigin || getWindowOrigin() || DEFAULT_PUBLIC_ORIGIN;
  return origin.replace(/\/$/, "");
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

export function buildCanonicalMenuPath({ restaurantSlug, restaurantId }) {
  const preferredTarget = pickFirstText(restaurantSlug, restaurantId);
  if (!preferredTarget) return "/menus";
  return `/restaurants/${encodeURIComponent(preferredTarget)}/menu`;
}

export function buildCanonicalMenuUrl({ restaurantSlug, restaurantId, origin = getPublicOrigin() }) {
  return toAbsoluteUrl(buildCanonicalMenuPath({ restaurantSlug, restaurantId }), origin);
}

export function getCanonicalMenuUrl(restaurant, origin = getPublicOrigin()) {
  return buildCanonicalMenuUrl({
    restaurantSlug: restaurant?.slug || restaurant?.restaurant_slug || restaurant?.restaurantSlug || null,
    restaurantId: restaurant?.id || restaurant?.restaurant_id || restaurant?.restaurantId || null,
    origin,
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
  logoUrl,
  origin = getPublicOrigin(),
}) {
  const safeRestaurantName = pickFirstText(restaurantName, "this restaurant");
  const title = `Check out the menu for ${safeRestaurantName} on Menuply`;
  const text = `Explore the menu, deals, and nutrition insights for ${safeRestaurantName} on Menuply.`;
  const url = buildCanonicalMenuUrl({ restaurantSlug, restaurantId, origin });
  const image = resolveShareImageUrl({ imageUrl: logoUrl, origin });

  return { title, text, url, image, restaurantName: safeRestaurantName };
}

export function getCanonicalMenuItemPath({ restaurant, menuItem }) {
  const restaurantTarget = pickFirstText(
    restaurant?.slug,
    restaurant?.restaurant_slug,
    restaurant?.restaurantSlug,
    restaurant?.id,
    restaurant?.restaurant_id,
    restaurant?.restaurantId
  );
  const menuItemId = pickFirstText(
    menuItem?.id,
    menuItem?.menu_item_id,
    menuItem?.menuItemId
  );

  if (!restaurantTarget || !menuItemId) {
    return menuItemId ? `/menu-items/${encodeURIComponent(menuItemId)}` : "/menu-items";
  }

  return `/restaurants/${encodeURIComponent(restaurantTarget)}/menu-items/${encodeURIComponent(menuItemId)}`;
}

export function getCanonicalMenuItemUrl({ restaurant, menuItem, origin = getPublicOrigin() }) {
  return toAbsoluteUrl(getCanonicalMenuItemPath({ restaurant, menuItem }), origin);
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
  const dishName = pickFirstText(
    menuItem?.name,
    menuItem?.menu_item_name,
    menuItem?.item_name,
    menuItem?.title,
    "this dish"
  );
  const canonicalUrl = asText(url) || getCanonicalMenuItemUrl({ restaurant, menuItem, origin });
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

export function buildShareLinks({ title, text, url }) {
  const safeTitle = asText(title);
  const safeText = asText(text);
  const safeUrl = asText(url);
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
