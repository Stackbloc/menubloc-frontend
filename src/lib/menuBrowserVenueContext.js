/**
 * Remember which Place Yellow Browser should brand for when the user leaves
 * a cluster page via BottomNav Browse (no ?cluster= in the path).
 */

import { MENU_BROWSER_VENUE_SLUGS } from "./menuBrowserVenueCover.js";

export const MENU_BROWSER_VENUE_SESSION_KEY = "menuply.yellowBrowser.cluster";

export function isMenuBrowserVenueSlug(slug) {
  return MENU_BROWSER_VENUE_SLUGS.includes(String(slug || "").trim().toLowerCase());
}

export function readMenuBrowserVenueSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = String(window.sessionStorage.getItem(MENU_BROWSER_VENUE_SESSION_KEY) || "")
      .trim()
      .toLowerCase();
    return isMenuBrowserVenueSlug(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function rememberMenuBrowserVenueSession(slug) {
  if (typeof window === "undefined") return;
  const key = String(slug || "").trim().toLowerCase();
  if (!isMenuBrowserVenueSlug(key)) return;
  try {
    window.sessionStorage.setItem(MENU_BROWSER_VENUE_SESSION_KEY, key);
  } catch {
    // ignore quota / private mode
  }
}

/** Extract Place slug from `/clusters/:state/:city/:slug`. */
export function clusterSlugFromPathname(pathname) {
  const match = String(pathname || "").match(/\/clusters\/[^/]+\/[^/]+\/([^/?#]+)/i);
  if (!match) return null;
  const slug = String(match[1] || "").trim().toLowerCase();
  return slug || null;
}

export function resolveBrowseMenusHref({ pathname = "", search = "" } = {}) {
  const params = new URLSearchParams(String(search || "").startsWith("?") ? search.slice(1) : search);
  const fromQuery = String(params.get("cluster") || "").trim().toLowerCase();
  const fromPath = clusterSlugFromPathname(pathname);
  const fromSession = readMenuBrowserVenueSession();
  const cluster = [fromQuery, fromPath, fromSession].find((slug) => isMenuBrowserVenueSlug(slug)) || null;
  if (!cluster) return "/browse-menus";
  return `/browse-menus?cluster=${encodeURIComponent(cluster)}`;
}
