/**
 * Public profile Windows section — food-offer creatives diners see before going inside.
 *
 * Temporary product rule (2026-08-14): only In-N-Out shows Windows (legacy active creatives).
 * All other restaurants return [] so the section does not render — brand splash, hero art,
 * and deal billboards do NOT fill Windows. Dedicated content_type=window may return later.
 */

import { isActiveBillboardSplashPost } from "./claimedRestaurantBillboardSplash.js";

/** In-N-Out Burger chain — temporary sole Windows visibility exception. */
export const IN_N_OUT_CHAIN_ID = 59;

const WINDOWS_MAX_SLIDES = 4;

export function isInNOutWindowsException(profile) {
  if (!profile || typeof profile !== "object") return false;
  if (Number(profile.chain_id) === IN_N_OUT_CHAIN_ID) return true;
  const name = String(profile.restaurant_name || profile.name || "").toLowerCase();
  const slug = String(profile.slug || profile.restaurant_slug || "").toLowerCase();
  return name.includes("in-n-out") || slug.includes("in-n-out");
}

function postContentType(post) {
  return String(post?.content_type || "").trim().toLowerCase();
}

/**
 * Reserved for a future dedicated window creative path.
 * Not used for public pick while only In-N-Out is visible.
 */
export function isWindowsOfferPost(post) {
  if (!isActiveBillboardSplashPost(post)) return false;
  return postContentType(post) === "window";
}

/**
 * Posts for the public Windows carousel.
 * Empty array ⇒ do not render the Windows section at all.
 * Currently non-empty only for the In-N-Out exception.
 */
export function pickWindowsPosts(billboardPreview, profile = null, { limit = WINDOWS_MAX_SLIDES } = {}) {
  if (!isInNOutWindowsException(profile)) return [];

  const max = Math.max(1, Math.min(WINDOWS_MAX_SLIDES, Number(limit) || WINDOWS_MAX_SLIDES));
  const list = Array.isArray(billboardPreview) ? billboardPreview : [];

  const eligible = [];
  for (const post of list) {
    if (isActiveBillboardSplashPost(post)) eligible.push(post);
  }

  eligible.sort((a, b) => {
    const ao = Number(a.display_order);
    const bo = Number(b.display_order);
    const aOrder = Number.isFinite(ao) ? ao : 0;
    const bOrder = Number.isFinite(bo) ? bo : 0;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return (Number(b.id) || 0) - (Number(a.id) || 0);
  });

  return eligible.slice(0, max);
}

export { WINDOWS_MAX_SLIDES };
