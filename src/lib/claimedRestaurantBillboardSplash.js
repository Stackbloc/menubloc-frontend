/**
 * Claimed restaurant billboard splash — timing + post selection (no React).
 */

/** Default hold after a slide is visible when post has no duration. */
export const CLAIMED_BILLBOARD_SPLASH_MS = 3500;
export const CLAIMED_BILLBOARD_SPLASH_REDUCED_MS = 600;
/** Max wait for a large billboard image before starting the hold timer anyway. */
export const CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS = 12000;
export const CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES = 6;

/**
 * Pick ordered current splash creatives (max 6) for the entrance carousel.
 * @param {unknown} posts
 * @param {{ limit?: number }} [opts]
 * @returns {object[]}
 */
export function pickClaimedBillboardSplashPosts(posts, opts = {}) {
  const limit = Math.max(1, Math.min(
    CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES,
    Number(opts.limit) || CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES
  ));
  const list = Array.isArray(posts) ? posts : [];
  const eligible = [];
  for (const post of list) {
    if (!post || typeof post !== "object") continue;
    const status = String(post.status || "").trim().toLowerCase();
    if (status && status !== "current") continue;
    const billboardStatus = String(post.billboard_status || "").trim().toLowerCase();
    if (billboardStatus && billboardStatus !== "active") continue;
    const imageUrl = String(post.image_url || post.photo_url || "").trim();
    const headline = String(post.headline_override || post.title || "").trim();
    if (!imageUrl && !headline) continue;
    eligible.push(post);
  }
  eligible.sort((a, b) => {
    const ao = Number(a.display_order);
    const bo = Number(b.display_order);
    const aOrder = Number.isFinite(ao) ? ao : 0;
    const bOrder = Number.isFinite(bo) ? bo : 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });
  return eligible.slice(0, limit);
}

/**
 * @deprecated Prefer pickClaimedBillboardSplashPosts — kept for older call sites/tests.
 * @param {unknown} posts
 * @returns {object | null}
 */
export function pickClaimedBillboardSplashPost(posts) {
  return pickClaimedBillboardSplashPosts(posts, { limit: 1 })[0] || null;
}

export function resolveSplashDurationMs(post, { reducedMotion = false } = {}) {
  if (reducedMotion) return CLAIMED_BILLBOARD_SPLASH_REDUCED_MS;
  const ms = Number(post?.display_duration_ms);
  if (Number.isFinite(ms) && ms >= 1000) {
    return Math.min(15000, Math.max(1000, Math.round(ms)));
  }
  return CLAIMED_BILLBOARD_SPLASH_MS;
}
