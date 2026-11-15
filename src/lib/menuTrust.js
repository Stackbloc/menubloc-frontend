/**
 * Menu ⓘ box (Andre 2026-10-31): how fresh the menu is, and a link to report a problem.
 * Same wording as the app (menuply-mobile src/lib/menuTrust.ts); copy by claim status 2026-11-15. The review date is set only when
 * the restaurant's own operators save their menu (backend touchMenuReviewOnSave).
 */

export const MENU_REPORT_EMAIL = "menus@menuply.com";

/** Ring on the menu ⓘ (Andre 2026-11-15): green = claimed, red = not claimed, gray while unknown. */
export const CLAIM_RING = { claimed: "#16a34a", unclaimed: "#dc2626", unknown: "#cbd5e1" };

export const MPI_LINK_TEXT = "Menu Price Integrity";
export const MPI_PATH = "/menu-price-integrity";
export const REPORT_LEAD = "Menuply can't guarantee menu accuracy. See something wrong?";
export const REPORT_LINK_TEXT = "Report it";

/** "2026-10-12T18:04:00Z" → "October 12, 2026"; null when missing or unreadable. */
export function reviewDateLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/**
 * Menu ⓘ copy by claim status (Andre 2026-11-15: shorter, clearer, different for claimed vs not).
 * claimed: true / false, or null while the profile is loading (no headline yet).
 * `prices` (claimed only) is followed by the Menu Price Integrity link.
 */
export function menuClaimInfo({ claimed, reviewedAt }) {
  if (claimed === true) {
    const date = reviewDateLabel(reviewedAt);
    return {
      headline: "Claimed by the restaurant",
      detail: date ? `The owner manages this menu. Last updated by the owner on ${date}.` : "The owner manages this menu.",
      prices: "If you order here, prices can't be higher than at the restaurant:",
    };
  }
  if (claimed === false) {
    return {
      headline: "Not claimed by the restaurant",
      detail: "The owner hasn't checked this menu, so items and prices may be out of date.",
      prices: null,
    };
  }
  return { headline: null, detail: null, prices: null };
}

/** Claimed = claim_status exactly "claimed" (claim_pending is not claimed yet). Same as the app. */
export function isClaimedProfile(restaurant) {
  return String(restaurant?.claim_status || "").trim().toLowerCase() === "claimed";
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
