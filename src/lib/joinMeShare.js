/**
 * Join Me share copy — spontaneous "I'm here now".
 * Share URLs are always https://menuply.com/join-me/:token
 */

import { CANONICAL_ORIGIN, absoluteCanonicalUrl } from "./canonicalUrlCore.js";

export function joinMePath(token) {
  const t = String(token || "").trim();
  return t ? `/join-me/${encodeURIComponent(t)}` : null;
}

export function joinMeAbsoluteUrl(token) {
  const path = joinMePath(token);
  return path ? absoluteCanonicalUrl(path) : "";
}

export function formatJoinMeLocationLabel({
  restaurant_name,
  address_line1,
  city,
  state,
  location_label,
} = {}) {
  if (String(location_label || "").trim()) return String(location_label).trim();
  const name = String(restaurant_name || "").trim() || "this restaurant";
  const street = String(address_line1 || "").trim();
  if (street) {
    const withoutNumber = street.replace(/^\d+[A-Za-z]?\s+/, "").trim();
    const first = (withoutNumber.split(",")[0] || withoutNumber).trim();
    if (first.length >= 3) return `${name} — ${first}`;
    return `${name} — ${street}`;
  }
  const cityState = [city, state].map((p) => String(p || "").trim()).filter(Boolean).join(", ");
  return cityState ? `${name} — ${cityState}` : name;
}

export function buildJoinMeShareData({
  token,
  url,
  organizerName,
  restaurantName,
  addressLine1,
  city,
  state,
  locationLabel,
} = {}) {
  const place = formatJoinMeLocationLabel({
    restaurant_name: restaurantName,
    address_line1: addressLine1,
    city,
    state,
    location_label: locationLabel,
  });
  const who = String(organizerName || "").trim() || "me";
  const pathUrl = url || joinMeAbsoluteUrl(token);
  const canonical = String(pathUrl || "").replace(/^https?:\/\/www\.menuply\.com/i, CANONICAL_ORIGIN);
  const shareUrl = canonical.startsWith(CANONICAL_ORIGIN)
    ? canonical
    : joinMeAbsoluteUrl(token);
  return {
    title: `Join ${who} at ${place}`,
    text: `I'm here now at ${place}. Come join me.`,
    url: shareUrl,
  };
}
