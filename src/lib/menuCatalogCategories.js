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
  { id: "dine_in", label: "Dine In", accent: "#7c2d12" },
  { id: "qsr", label: "QSR", accent: "#16a34a" },
];

export function getMenuCatalogTabAccent(id) {
  const tab = MENU_CATALOG_TABS.find((entry) => entry.id === id);
  return tab?.accent || "#1a1a1a";
}

/** @deprecated use MENU_CATALOG_TABS */
export const MENU_CATALOG_SIDEBAR = MENU_CATALOG_TABS;

export const MENU_CATALOG_DEFAULT_SECTION = "nearby";

/** Menu book artwork (top crop of official Yellow Browser splash). */
export const MENU_BROWSER_BOOK_SRC = "/menu-browser-book.png?v=20260702b";

/** @deprecated full composite; splash now renders book + spaced text in CSS */
export const MENU_BROWSER_INTRO_LOGO_SRC = "/menu-browser-logo.png?v=20260702";

/** Minimum intro splash duration (ms) after a mode is selected. */
export const MENU_BROWSER_INTRO_MIN_MS = 4000;

/** Cover page display before the Food/Drinks chooser (ms). */
export const MENU_BROWSER_COVER_MS = 1800;

export function toMenuCatalogTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}
