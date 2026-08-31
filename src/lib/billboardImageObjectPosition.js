/**
 * CSS object-position / asset pick for billboard/splash/Windows frames.
 *
 * Landscape In-N-Out storefront (`in-n-out-building.jpg`) puts the neon logo
 * left-of-center — fine on wide desktop crops with `left center`, but on tall
 * mobile cover crops the logo sits off-center. Prefer the portrait splash crop
 * (`in-n-out-building-splash.jpg`) on narrow viewports so the logo stays centered.
 */

export { resolveBillboardMediaUrl } from "./billboardMediaUrl.js";

export const IN_N_OUT_BUILDING_LANDSCAPE_MARKER = "in-n-out-building.jpg";
export const IN_N_OUT_BUILDING_SPLASH_MARKER = "in-n-out-building-splash.jpg";
/** Portrait designed banner — keep logo/face in frame on narrow hero + splash crops. */
export const KLAUDETTES_KITCHEN_BANNER_MARKER = "klaudettes-kitchen-banner.jpg";
/** Owner-uploaded Tom's Watch Bar billboards — blue logo sits high in the art. */
export const TOMS_WATCH_BAR_BILLBOARD_MARKER = "restaurant-3684";
/** Durable Tom's LA Live brand banner on menuply.com. */
export const TOMS_WATCH_BAR_BANNER_MARKER = "toms-watch-bar-banner";
/** Fixins LA Live brand banner (wide logo art). */
export const FIXINS_SOUL_KITCHEN_BANNER_MARKER = "fixins-soul-kitchen-banner";
/** Emmy Squared LA Live brand banner. */
export const EMMY_SQUARED_BANNER_MARKER = "emmy-squared-pizza-banner";

function asUrl(postOrUrl) {
  return String(
    (postOrUrl && typeof postOrUrl === "object"
      ? postOrUrl.image_url || postOrUrl.photo_url
      : postOrUrl) || ""
  ).trim();
}

/**
 * On narrow viewports, swap landscape In-N-Out building → portrait splash crop.
 * @param {string|object|null|undefined} postOrUrl
 * @param {{ narrow?: boolean }} [opts]
 * @returns {string}
 */
export function resolveBillboardDisplayImageUrl(postOrUrl, opts = {}) {
  const url = asUrl(postOrUrl);
  if (!url) return "";
  const narrow = Boolean(opts.narrow);
  const lower = url.toLowerCase();
  if (
    narrow &&
    lower.includes(IN_N_OUT_BUILDING_LANDSCAPE_MARKER) &&
    !lower.includes(IN_N_OUT_BUILDING_SPLASH_MARKER)
  ) {
    return url.replace(/in-n-out-building\.jpg/i, "in-n-out-building-splash.jpg");
  }
  return url;
}

/**
 * @param {string|object|null|undefined} postOrUrl
 * @param {{ narrow?: boolean }} [opts]
 * @returns {string}
 */
export function resolveBillboardImageObjectPosition(postOrUrl, opts = {}) {
  const fromPost =
    postOrUrl && typeof postOrUrl === "object"
      ? String(postOrUrl.image_position || postOrUrl.object_position || "").trim()
      : "";
  if (fromPost) return fromPost;

  const narrow = Boolean(opts.narrow);
  const displayUrl = resolveBillboardDisplayImageUrl(postOrUrl, { narrow });
  const url = displayUrl.toLowerCase();

  if (url.includes(IN_N_OUT_BUILDING_SPLASH_MARKER)) {
    // Portrait splash: logo centered horizontally; bias top so bottom scrim does not cover it.
    return "center top";
  }
  if (url.includes(KLAUDETTES_KITCHEN_BANNER_MARKER)) {
    // Portrait marketing banner — mobile hero/splash are wide + short; anchor top so branding stays visible.
    return narrow ? "center top" : "center center";
  }
  if (url.includes(TOMS_WATCH_BAR_BILLBOARD_MARKER) || url.includes(TOMS_WATCH_BAR_BANNER_MARKER)) {
    // Tom's entrance art — blue logo is above center; default cover crop hides it.
    return "center top";
  }
  if (url.includes(FIXINS_SOUL_KITCHEN_BANNER_MARKER)) {
    return "center top";
  }
  if (url.includes(EMMY_SQUARED_BANNER_MARKER)) {
    return "center center";
  }
  if (url.includes(IN_N_OUT_BUILDING_LANDSCAPE_MARKER.replace(".jpg", ""))) {
    // Landscape storefront — keep neon logo in frame on wide crops.
    return narrow ? "center center" : "left center";
  }
  return "center";
}
