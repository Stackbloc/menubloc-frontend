/**
 * Live Feed category captions (See Who's Eating).
 * ate / want / plan — all three X compose categories with H.264-normalized video.
 */

export const LIVE_FEED_CATEGORY_LABELS = {
  ate: "What I'm Eating",
  want: "What I Wanna Eat",
  plan: "My Eating Plans",
};

export function liveFeedCategoryLabel(kind) {
  const key = String(kind || "")
    .trim()
    .toLowerCase();
  return LIVE_FEED_CATEGORY_LABELS[key] || LIVE_FEED_CATEGORY_LABELS.ate;
}

export function dinerPeerProfilePath(dinerId) {
  const id = Number(dinerId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return `/account/connections/${encodeURIComponent(String(id))}`;
}
