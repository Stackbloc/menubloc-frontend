/**
 * Menu ⓘ box (Andre 2026-10-31): how fresh the menu is, and a link to report a problem.
 * Same wording as the app (menuply-mobile src/lib/menuTrust.ts). The review date is set only when
 * the restaurant's own operators save their menu (backend touchMenuReviewOnSave).
 */

export const MENU_REPORT_EMAIL = "menus@menuply.com";

const NO_GUARANTEE = "Menuply cannot guarantee the accuracy of the menu information.";

/** "2026-10-12T18:04:00Z" → "October 12, 2026"; null when missing or unreadable. */
export function reviewDateLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * With a review date: when the owner last reviewed or edited it. Unclaimed restaurants: not
 * claimed or verified. Franchise stores (the chain's shared menu, never claimed store by store)
 * and claimed restaurants without a date: the disclaimer only.
 */
export function menuTrustText({ reviewedAt, unclaimed, franchiseStore }) {
  const date = reviewDateLabel(reviewedAt);
  if (date) {
    return `The information in this menu was last reviewed or edited by the restaurant owner/operator on ${date}. ${NO_GUARANTEE}`;
  }
  if (unclaimed && !franchiseStore) {
    return `This menu has not been claimed or verified by the restaurant owner/operator. ${NO_GUARANTEE}`;
  }
  return NO_GUARANTEE;
}

/** Claimed and claim_pending restaurants are owned (website RestaurantPublicPage isClaimedRestaurant). */
export function isUnclaimedProfile(restaurant) {
  if (!restaurant) return false;
  const status = String(restaurant.claim_status || "").trim().toLowerCase();
  return restaurant.claimable !== false && status !== "claimed" && status !== "claim_pending";
}

/** mailto: link to menus@menuply.com that names the menu (restaurant, city, id, link, date shown). */
export function menuReportMailto({ restaurantId, name, city, state, menuUrl, reviewedAt }) {
  const where = [city, state].filter(Boolean).join(", ");
  const subject = `Menu report: ${name}${where ? `, ${where}` : ""}${restaurantId != null ? ` (#${restaurantId})` : ""}`;
  const lines = [
    `Restaurant: ${name}${where ? ` (${where})` : ""}`,
    restaurantId != null ? `Restaurant ID: ${restaurantId}` : null,
    menuUrl ? `Menu: ${menuUrl}` : null,
    `Last reviewed by the restaurant: ${reviewDateLabel(reviewedAt) || "not yet"}`,
    "",
    "What's wrong:",
    "",
  ].filter((l) => l != null);
  return `mailto:${MENU_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
}
