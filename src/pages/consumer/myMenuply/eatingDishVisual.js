/**
 * Visual priority for diner dish cards:
 * diner/menu photo or video → restaurant logo → restaurant billboard → text template.
 */

import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";

export function resolveEatingDishVisual(item) {
  const photo = String(item?.photo_url || "").trim();
  const video = String(item?.video_url || "").trim();
  const logo = String(item?.restaurant_logo_url || item?.logo_url || "").trim();
  const billboard = String(
    item?.restaurant_billboard_image_url || item?.billboard_image_url || ""
  ).trim();

  if (video) {
    return {
      kind: "video",
      url: resolveConsumerMediaUrl(video),
      source: "dish",
      fit: "cover",
    };
  }
  if (photo) {
    return {
      kind: "image",
      url: resolveConsumerMediaUrl(photo),
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
