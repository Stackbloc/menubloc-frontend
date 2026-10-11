/**
 * Top-tab categories for the menu catalog reader.
 * IDs map to backend browse_section values (except personal library sections).
 */

/** Personal library — reads feedMenuLibrary (Save Menu / recently viewed). */
export const MENU_CATALOG_PERSONAL_TABS = [
  { id: "bookmarked", label: "Bookmarked", accent: "#ca8a04", personal: true },
  { id: "recent_viewed", label: "Recently Viewed", accent: "#64748b", personal: true },
];

/** Discovery / cuisine tabs (API-backed). */
export const MENU_CATALOG_DISCOVERY_TABS = [
  { id: "nearby", label: "Nearby", accent: "#2563eb" },
  { id: "american", label: "American", accent: "#d97706" },
  { id: "asian", label: "Asian", accent: "#6366f1" },
  { id: "italian", label: "Italian", accent: "#dc2626" },
  { id: "mexican", label: "Mexican", accent: "#f97316" },
  { id: "sushi", label: "Sushi", accent: "#0891b2" },
  { id: "burgers", label: "Burgers", accent: "#f59e0b" },
  { id: "pizza", label: "Pizza", accent: "#ef4444" },
  { id: "vegetarian", label: "Vegetarian", accent: "#4ade80" },
  { id: "dine_in", label: "Dine In", accent: "#7c2d12" },
  { id: "qsr", label: "QSR", accent: "#16a34a" },
];

export const MENU_CATALOG_TABS = [...MENU_CATALOG_PERSONAL_TABS, ...MENU_CATALOG_DISCOVERY_TABS];

/**
 * The single Menu Browser chip row (Andre, 2026-10-11): Bookmarked + four major cuisines.
 * Cuisines follow Common Knowledge — Asian covers Chinese, Japanese, Korean, Thai,
 * Vietnamese, Indian, Filipino and Sushi. Other section ids stay valid for typed searches
 * and old links; they just are not chips.
 */
const MENU_BROWSER_CHIP_IDS = ["bookmarked", "american", "mexican", "italian", "asian"];
export const MENU_BROWSER_CHIP_TABS = MENU_BROWSER_CHIP_IDS.map((id) =>
  MENU_CATALOG_TABS.find((tab) => tab.id === id)
).filter(Boolean);

/** Sections that /menus/browse understands (excludes personal library ids). */
export const MENU_CATALOG_BROWSE_SECTION_IDS = new Set([
  ...MENU_CATALOG_DISCOVERY_TABS.map((tab) => tab.id),
  "breakfast",
  "lunch",
  "dinner",
  "bbq",
  "seafood",
  "coffee",
  "desserts",
  "sandwiches",
  "vegan",
  "happy_hour",
  "trending",
  "newly_added",
  "local_favorites",
]);

export const MENU_CATALOG_PERSONAL_SECTION_IDS = new Set(
  MENU_CATALOG_PERSONAL_TABS.map((tab) => tab.id)
);

export function isMenuCatalogPersonalSection(id) {
  return MENU_CATALOG_PERSONAL_SECTION_IDS.has(String(id || "").trim().toLowerCase());
}

export function getMenuCatalogTabAccent(id) {
  const tab = MENU_CATALOG_TABS.find((entry) => entry.id === id);
  return tab?.accent || "#1a1a1a";
}

/** @deprecated use MENU_CATALOG_TABS */
export const MENU_CATALOG_SIDEBAR = MENU_CATALOG_TABS;

export const MENU_CATALOG_DEFAULT_SECTION = "nearby";

/** Restaurants fetched per /menus/browse request (Yellow Browser swipe buffer). */
export const MENU_CATALOG_BROWSE_PAGE_SIZE = 12;

/** Menu book artwork (top crop of official Yellow Browser splash). */
export const MENU_BROWSER_BOOK_SRC = "/menu-browser-book.png?v=20260702b";

/** @deprecated full composite; splash now renders book + spaced text in CSS */
export const MENU_BROWSER_INTRO_LOGO_SRC = "/menu-browser-logo.png?v=20260702";

/** Minimum intro splash duration (ms) after a mode is selected. */
export const MENU_BROWSER_INTRO_MIN_MS = 4000;

/** Yellow Browser splash duration before the Food/Drinks chooser (ms). */
export const MENU_BROWSER_COVER_MS = 2800;

export function toMenuCatalogTranslationKey(id) {
  return `menuBrowser.category.${String(id || "").replace(/-/g, "_")}`;
}
