/**
 * Claimed restaurant billboard splash — timing + post selection (no React).
 */

/** Hold duration after the creative is visible (image loaded or headline-only). */
export const CLAIMED_BILLBOARD_SPLASH_MS = 3500;
export const CLAIMED_BILLBOARD_SPLASH_REDUCED_MS = 600;
/** Max wait for a large billboard image before starting the hold timer anyway. */
export const CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS = 12000;

/**
 * Pick the first current (or status-less) preview post with splash creative.
 * @param {unknown} posts
 * @returns {object | null}
 */
export function pickClaimedBillboardSplashPost(posts) {
  const list = Array.isArray(posts) ? posts : [];
  for (const post of list) {
    if (!post || typeof post !== "object") continue;
    const status = String(post.status || "").trim().toLowerCase();
    if (status && status !== "current") continue;
    const imageUrl = String(post.image_url || post.photo_url || "").trim();
    const headline = String(post.headline_override || post.title || "").trim();
    if (imageUrl || headline) return post;
  }
  return null;
}
