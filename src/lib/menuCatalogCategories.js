/**
 * Top-tab categories for the menu catalog reader.
 * IDs map to backend browse_section values.
 */
export const MENU_CATALOG_TABS = [
  { id: "nearby", label: "Nearby" },
  { id: "american", label: "American" },
  { id: "asian", label: "Asian" },
  { id: "italian", label: "Italian" },
  { id: "qsr", label: "QSR" },
];

/** @deprecated use MENU_CATALOG_TABS */
export const MENU_CATALOG_SIDEBAR = MENU_CATALOG_TABS;

export const MENU_CATALOG_DEFAULT_SECTION = "nearby";

/** Drop your logo at public/menu-browser-logo.png */
export const MENU_BROWSER_INTRO_LOGO_SRC = "/menu-browser-logo.png";

/** Minimum intro splash duration (ms). */
export const MENU_BROWSER_INTRO_MIN_MS = 4000;

export function toMenuCatalogTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}
