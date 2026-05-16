/**
 * Menuply UV (Unverified menu) — shared UI copy keys and helpers.
 *
 * UV menus are public (search, browse, menu pages) but not confirmed by the
 * restaurant until they claim the listing and confirm their menu.
 */

export const MENU_UV_CODE = "UV";

export function isRestaurantVerifiedMenuStatus(status) {
  return String(status || "").trim().toLowerCase() === "verified";
}

/** i18n keys — resolve with t() */
export const MENU_UV_I18N = {
  badge: "menuUv.badge",
  explanation: "menuUv.explanation",
  explanationTitle: "menuUv.explanationTitle",
  banner: "menuUv.banner",
  claimCta: "menuUv.claimCta",
  searchChip: "menuUv.searchChip",
};
