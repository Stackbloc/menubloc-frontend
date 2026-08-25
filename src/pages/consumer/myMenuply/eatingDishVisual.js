/**
 * Visual priority for diner dish cards:
 * diner photo/video → menu item photo → restaurant logo → restaurant billboard → text.
 */

import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import { stripMediaUrlFragment } from "../../../lib/menuplyLiveFeedControl.js";

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
    return {
      kind: "video",
      url: absolute,
      source: "dish",
      fit: "cover",
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
