/**
 * Search & Shop mode: [ Search | Menu Browser ]. URL (?view=) wins, then the last mode the
 * viewer used (localStorage), then Search. Storage is best-effort — private mode can throw.
 */

export const SEARCH_SHOP_MODE_SEARCH = "search";
export const SEARCH_SHOP_MODE_MENU_BROWSER = "menu-browser";
export const SEARCH_SHOP_VIEW_PARAM = "view";
export const SEARCH_SHOP_MODE_STORAGE_KEY = "menuply.searchShop.mode";

export function normalizeSearchShopMode(raw) {
  return String(raw || "").trim() === SEARCH_SHOP_MODE_MENU_BROWSER
    ? SEARCH_SHOP_MODE_MENU_BROWSER
    : String(raw || "").trim() === SEARCH_SHOP_MODE_SEARCH
      ? SEARCH_SHOP_MODE_SEARCH
      : null;
}

export function readStoredSearchShopMode(storage) {
  try {
    const store = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    return normalizeSearchShopMode(store?.getItem(SEARCH_SHOP_MODE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredSearchShopMode(mode, storage) {
  const normalized = normalizeSearchShopMode(mode);
  if (!normalized) return;
  try {
    const store = storage ?? (typeof window !== "undefined" ? window.localStorage : null);
    store?.setItem(SEARCH_SHOP_MODE_STORAGE_KEY, normalized);
  } catch {
    /* storage unavailable — mode still works for this visit */
  }
}

export function resolveSearchShopMode(searchParams, storage) {
  return (
    normalizeSearchShopMode(searchParams?.get?.(SEARCH_SHOP_VIEW_PARAM)) ||
    readStoredSearchShopMode(storage) ||
    SEARCH_SHOP_MODE_SEARCH
  );
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
