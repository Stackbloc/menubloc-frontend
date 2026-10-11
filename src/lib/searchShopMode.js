/**
 * Search & Shop mode: [ Search | Menu Browser ]. Always opens in Search unless the URL
 * asks for Menu Browser (?view=menu-browser) — Andre, 2026-10-11 (no remembered mode).
 */

export const SEARCH_SHOP_MODE_SEARCH = "search";
export const SEARCH_SHOP_MODE_MENU_BROWSER = "menu-browser";
export const SEARCH_SHOP_VIEW_PARAM = "view";

export function normalizeSearchShopMode(raw) {
  return String(raw || "").trim() === SEARCH_SHOP_MODE_MENU_BROWSER
    ? SEARCH_SHOP_MODE_MENU_BROWSER
    : String(raw || "").trim() === SEARCH_SHOP_MODE_SEARCH
      ? SEARCH_SHOP_MODE_SEARCH
      : null;
}

export function resolveSearchShopMode(searchParams) {
  return normalizeSearchShopMode(searchParams?.get?.(SEARCH_SHOP_VIEW_PARAM)) || SEARCH_SHOP_MODE_SEARCH;
}

/** Same query + filters, only the view changes. */
export function buildSearchShopModeSearch(searchParams, mode) {
  const next = new URLSearchParams(searchParams?.toString?.() || "");
  next.set(SEARCH_SHOP_VIEW_PARAM, normalizeSearchShopMode(mode) || SEARCH_SHOP_MODE_SEARCH);
  return next;
}

/**
 * Old standalone Menu Browser (/browse-menus) → Search & Shop in Menu Browser mode.
 * Every query param (cluster, section, i, city, state, mode=drinks…) is carried over.
 */
export function buildMenuBrowserRedirectPath(search = "") {
  const raw = String(search || "");
  const next = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  next.set(SEARCH_SHOP_VIEW_PARAM, SEARCH_SHOP_MODE_MENU_BROWSER);
  return `/feed/search?${next.toString()}`;
}

/** Canonical Menu Browser link (Search & Shop → Menu Browser), with optional extra params. */
export const MENU_BROWSER_PATH = `/feed/search?${SEARCH_SHOP_VIEW_PARAM}=${SEARCH_SHOP_MODE_MENU_BROWSER}`;

export function menuBrowserPath(params = null) {
  const extra = params instanceof URLSearchParams ? params : new URLSearchParams(params || {});
  extra.delete(SEARCH_SHOP_VIEW_PARAM);
  const qs = extra.toString();
  return qs ? `${MENU_BROWSER_PATH}&${qs}` : MENU_BROWSER_PATH;
}
