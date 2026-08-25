/**
 * Visual priority for diner dish cards:
 * diner photo/video → menu item photo → restaurant logo → restaurant billboard → text.
 * Videos keep a playable url plus optional still fallback when the codec won't paint a frame.
 */

import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { stripMediaUrlFragment } from "../../../lib/menuplyLiveFeedControl.js";

function firstResolvedUrl(...candidates) {
  for (const raw of candidates) {
    const value = String(raw || "").trim();
    if (!value) continue;
    return resolveConsumerMediaUrl(value);
  }
  return "";
}

/** Still image when video frame capture fails (encoding / browser decode). */
export function resolveVideoPosterFallback(item) {
  const url = firstResolvedUrl(
    item?.item_photo_url,
    item?.restaurant_logo_url,
    item?.logo_url,
    item?.restaurant_billboard_image_url,
    item?.billboard_image_url
  );
  if (!url) return null;
  const fromLogo = Boolean(
    String(item?.restaurant_logo_url || item?.logo_url || "").trim() &&
      url === resolveConsumerMediaUrl(item?.restaurant_logo_url || item?.logo_url)
  );
  return {
    url,
    source: fromLogo
      ? "logo"
      : String(item?.item_photo_url || "").trim() &&
          url === resolveConsumerMediaUrl(item.item_photo_url)
        ? "dish"
        : "billboard",
    fit: fromLogo ? "contain" : "cover",
  };
}

export function resolveEatingDishVisual(item) {
  const dinerPhoto = String(item?.photo_url || "").trim();
  const video = String(item?.video_url || "").trim();
  const menuItemPhoto = String(item?.item_photo_url || "").trim();
  const logo = String(item?.restaurant_logo_url || item?.logo_url || "").trim();
  const billboard = String(
    item?.restaurant_billboard_image_url || item?.billboard_image_url || ""
  ).trim();

  if (video) {
    // Clean play URL — never attach #t= here (poster seek is VideoStillPreview-only).
    const absolute = stripMediaUrlFragment(resolveConsumerMediaUrl(video));
    const posterFallback = resolveVideoPosterFallback(item);
    return {
      kind: "video",
      url: absolute,
      source: "dish",
      fit: "cover",
      posterFallbackUrl: posterFallback?.url || "",
      posterFallbackFit: posterFallback?.fit || "cover",
      posterFallbackSource: posterFallback?.source || "",
    };
  }
  if (dinerPhoto) {
    return {
      kind: "image",
      url: resolveConsumerMediaUrl(dinerPhoto),
      source: "dish",
      fit: "cover",
    };
  }
  if (menuItemPhoto) {
    return {
      kind: "image",
      url: resolveConsumerMediaUrl(menuItemPhoto),
      source: "dish",
      fit: "cover",
    };
  }
  if (logo) {
    return {
      kind: "image",
      url: resolveConsumerMediaUrl(logo),
      source: "logo",
      fit: "contain",
    };
  }
  if (billboard) {
    return {
      kind: "image",
      url: resolveConsumerMediaUrl(billboard),
      source: "billboard",
      fit: "cover",
    };
  }
  return null;
}

export function planHasSpecificRestaurant(plan) {
  return Boolean(plan?.restaurant_id);
}

/** Logo → billboard → null (caller shows restaurant name text). Restaurant-bound plans only. */
export function resolveEatingPlanVisual(plan) {
  if (!planHasSpecificRestaurant(plan)) return null;
  return resolveEatingDishVisual({
    restaurant_logo_url: plan?.restaurant_logo_url,
    restaurant_billboard_image_url: plan?.restaurant_billboard_image_url,
  });
}
