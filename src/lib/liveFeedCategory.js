/**
 * Live Feed category captions + channel dials (See Who's Eating CRT).
 */

export const LIVE_FEED_CATEGORY_LABELS = {
  ate: "What I'm Eating",
  want: "What I Wanna Eat",
  plan: "My Eating Plans",
  event: "Events",
};

/** Radio stations on the green CRT (vertical dial strip). */
export const LIVE_FEED_CHANNELS = [
  { id: "all", label: "ALL", short: "ALL" },
  { id: "ate", label: "What I'm Eating", short: "EAT" },
  { id: "want", label: "What I Wanna Eat", short: "WANT" },
  { id: "plan", label: "My Eating Plans", short: "PLAN" },
  { id: "event", label: "Events", short: "EVENT" },
];

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

export function venueLiveFeedPath(venue) {
  const href = String(venue?.href || "").trim();
  if (href) return href;
  const slug = String(venue?.slug || "").trim();
  if (!slug) return null;
  return `/destination-venues/${encodeURIComponent(slug)}`;
}

export function liveFeedPosterLabel(item) {
  if (String(item?.kind || "").toLowerCase() === "event" || item?.poster_type === "venue") {
    return item?.venue?.name || "Venue";
  }
  return item?.diner?.display_name || "diner";
}

export function isLiveFeedVenueItem(item) {
  return (
    String(item?.kind || "").toLowerCase() === "event" || item?.poster_type === "venue"
  );
}
