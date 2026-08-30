/**
 * Claimed restaurant billboard splash — timing + post selection (no React).
 */

import { resolveBillboardMediaUrl } from "./billboardMediaUrl.js";

/** Default hold after a slide is visible when post has no duration. */
export const CLAIMED_BILLBOARD_SPLASH_MS = 3500;
export const CLAIMED_BILLBOARD_SPLASH_REDUCED_MS = 600;
/**
 * Max wait to decode the first splash image before skipping the entrance entirely.
 * Never leave the user on an empty/black full-screen shell.
 */
export const CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS = 1500;
export const CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES = 6;
/** Soft shell — never pure black while art is missing or letterboxed. */
export const CLAIMED_BILLBOARD_SPLASH_SHELL_BG = "#f2f1ec";
/** Hard cap on per-slide hold (product: entrance, not a 15s blackout). */
export const CLAIMED_BILLBOARD_SPLASH_MAX_HOLD_MS = 5000;

/** Active splash/profile-billboard creatives only (paused gallery posts excluded). */
export function isActiveBillboardSplashPost(post) {
  if (!post || typeof post !== "object") return false;
  const status = String(post.status || "").trim().toLowerCase();
  if (status && status !== "current") return false;
  const billboardStatus = String(post.billboard_status || "").trim().toLowerCase();
  if (billboardStatus && billboardStatus !== "active") return false;
  const imageUrl = String(post.image_url || post.photo_url || "").trim();
  const headline = String(post.headline_override || post.title || "").trim();
  return Boolean(imageUrl || headline);
}

/**
 * Pick ordered current splash creatives (max 6) for the entrance carousel.
 * Dedicated window offers (content_type=window) do not drive the entrance splash.
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
    if (!isActiveBillboardSplashPost(post)) continue;
    const contentType = String(post?.content_type || "").trim().toLowerCase();
    if (contentType === "window") continue;
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

function firstSplashImageUrl(posts) {
  const list = pickClaimedBillboardSplashPosts(posts);
  for (const post of list) {
    const url = resolveBillboardMediaUrl(post);
    if (url) return url;
  }
  return "";
}

/**
 * Resolve when the first splash image is decoded, or false if it times out / errors.
 * Callers must skip the entrance splash when this returns false — never show black void.
 * @param {unknown} posts
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<boolean>}
 */
export function waitForBillboardSplashImage(posts, opts = {}) {
  const url = firstSplashImageUrl(posts);
  if (!url) {
    // Headline-only splash is allowed without an image.
    return Promise.resolve(pickClaimedBillboardSplashPosts(posts).length > 0);
  }
  if (typeof Image === "undefined") return Promise.resolve(false);

  const timeoutMs = Math.max(
    200,
    Number(opts.timeoutMs) || CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS
  );

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      resolve(Boolean(ok));
    };

    const img = new Image();
    const timer = setTimeout(() => finish(false), timeoutMs);
    const clear = () => clearTimeout(timer);

    img.onload = () => {
      clear();
      const w = Number(img.naturalWidth) || 0;
      finish(w > 0);
    };
    img.onerror = () => {
      clear();
      finish(false);
    };
    try {
      img.decoding = "async";
      img.src = url;
      const settleFromElement = () => {
        if (img.complete && img.naturalWidth > 0) {
          if (typeof img.decode === "function") {
            img
              .decode()
              .then(() => {
                clear();
                finish(true);
              })
              .catch(() => {
                clear();
                finish(true);
              });
          } else {
            clear();
            finish(true);
          }
        }
      };
      // Cached images may already be complete before onload; also wait a tick.
      settleFromElement();
      if (!settled) {
        requestAnimationFrame(settleFromElement);
      }
    } catch {
      clear();
      finish(false);
    }
  });
}

/** Warm billboard splash images so entrance art is ready when the splash mounts. */
export function prefetchBillboardSplashImages(posts) {
  if (typeof Image === "undefined") return;
  const list = pickClaimedBillboardSplashPosts(posts);
  for (const post of list) {
    const url = String(post?.image_url || post?.photo_url || "").trim();
    if (!url) continue;
    try {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    } catch {
      /* ignore */
    }
  }
}

export function resolveSplashDurationMs(post, { reducedMotion = false } = {}) {
  if (reducedMotion) return CLAIMED_BILLBOARD_SPLASH_REDUCED_MS;
  const ms = Number(post?.display_duration_ms);
  if (Number.isFinite(ms) && ms >= 1000) {
    return Math.min(
      CLAIMED_BILLBOARD_SPLASH_MAX_HOLD_MS,
      Math.max(1000, Math.round(ms))
    );
  }
  return CLAIMED_BILLBOARD_SPLASH_MS;
}

/** Normalize venue/promo labels for duplicate detection. */
export function normalizeBillboardLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ");
}

/** True when owner-entered headline repeats the restaurant name on the splash. */
export function isDuplicateRestaurantBillboardHeadline(restaurantName, headline) {
  const venue = normalizeBillboardLabel(restaurantName);
  const promo = normalizeBillboardLabel(headline);
  return Boolean(venue && promo && venue === promo);
}

/**
 * Raw owner-entered splash copy (before venue dedupe).
 * @param {object|null|undefined} post
 * @returns {string}
 */
export function resolveBillboardSplashRawHeadline(post) {
  return String(post?.headline_override ?? post?.title ?? "").trim();
}

/**
 * Large headline on entrance splash — venue name once (large), never small eyebrow + large duplicate.
 * @param {object|null|undefined} post
 * @param {string} [restaurantName]
 * @returns {string}
 */
export function resolveBillboardSplashHeadline(post, restaurantName = "") {
  const raw = resolveBillboardSplashRawHeadline(post);
  if (!raw) return "";
  if (isDuplicateRestaurantBillboardHeadline(restaurantName, raw)) {
    return String(restaurantName || raw).trim();
  }
  return raw;
}

/** Small-caps venue eyebrow — only when a distinct promo headline follows in large type. */
export function shouldShowBillboardSplashVenueEyebrow(post, restaurantName = "") {
  const raw = resolveBillboardSplashRawHeadline(post);
  if (!raw) return false;
  return !isDuplicateRestaurantBillboardHeadline(restaurantName, raw);
}
