/**
 * Feed shell "Menu Browser" tab → same PiP Menu Browser as the yellow video icon.
 * Does not navigate to /browse-menus from Feed video surfaces.
 */

export const OPEN_FEED_MENU_BROWSER_EVENT = "menuply:open-feed-menu-browser";

/** Routes that host a Feed video reel with Menu Browser PiP. */
export function isFeedMenuBrowserVideoRoute(pathname = "") {
  const path = String(pathname || "").split("?")[0];
  if (path === "/feed" || path === "/") return true;
  if (path === "/feed/deals" || path.startsWith("/feed/deals/")) return true;
  return false;
}

export function requestOpenFeedMenuBrowser() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_FEED_MENU_BROWSER_EVENT));
}
