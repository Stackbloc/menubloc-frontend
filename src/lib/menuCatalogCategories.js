/**
 * Top-tab categories for the menu catalog reader.
 * IDs map to backend browse_section values.
 */
export const MENU_CATALOG_TABS = [
  { id: "nearby", label: "Nearby", accent: "#2563eb" },
  { id: "american", label: "American", accent: "#d97706" },
  { id: "asian", label: "Asian", accent: "#6366f1" },
  { id: "italian", label: "Italian", accent: "#dc2626" },
  { id: "mexican", label: "Mexican", accent: "#f97316" },
  { id: "qsr", label: "QSR", accent: "#16a34a" },
];

export function getMenuCatalogTabAccent(id) {
  const tab = MENU_CATALOG_TABS.find((entry) => entry.id === id);
  return tab?.accent || "#1a1a1a";
}

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
