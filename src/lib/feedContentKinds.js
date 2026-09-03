/** Feed video/content category ids — single source for X, compose, and live feed dials. */

export const FEED_CONTENT_KINDS = Object.freeze({
  ATE: "ate",
  WANT: "want",
  PLAN: "plan",
  REVIEWS: "reviews",
  COOKING: "cooking",
});

/** Categories that reuse the Ate recording UX + what_i_ate_today media contract. */
export function isAteLikeFeedCategory(category) {
  const id = String(category || "").trim().toLowerCase();
  return id === FEED_CONTENT_KINDS.ATE || id === FEED_CONTENT_KINDS.REVIEWS;
}

export function isCookingFeedCategory(category) {
  return String(category || "").trim().toLowerCase() === FEED_CONTENT_KINDS.COOKING;
}
