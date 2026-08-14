/**
 * CSS object-position for billboard/splash/Windows frames.
 * Landscape In-N-Out storefront puts the neon logo on the left; portrait splash
 * crop keeps the logo near the top — center crops cut it off.
 */
export function resolveBillboardImageObjectPosition(postOrUrl) {
  const fromPost =
    postOrUrl && typeof postOrUrl === "object"
      ? String(postOrUrl.image_position || postOrUrl.object_position || "").trim()
      : "";
  if (fromPost) return fromPost;

  const url = String(
    (postOrUrl && typeof postOrUrl === "object"
      ? postOrUrl.image_url || postOrUrl.photo_url
      : postOrUrl) || ""
  )
    .trim()
    .toLowerCase();

  if (url.includes("in-n-out-building-splash")) return "center top";
  if (url.includes("in-n-out-building")) return "left center";
  return "center";
}
