import { useEffect } from "react";
import { MENU_ITEM_HIGHLIGHT_QUERY_KEY, menuItemDomId } from "../components/share/shareUtils.js";

const HIGHLIGHT_CLASS = "menuply-menu-item-highlight";
const HIGHLIGHT_MS = 4000;
const RETRY_MS = 200;
const RETRY_MAX_MS = 3500;

/**
 * When arriving from menu item detail (?highlightItem=), scroll the menu row
 * into view and pulse a green outline so the user can add to basket quickly.
 */
export default function useMenuItemHighlight({
  highlightMenuItemId,
  ready,
  displaySections,
  setSearchParams,
}) {
  useEffect(() => {
    if (!highlightMenuItemId || !ready) return undefined;

    let cancelled = false;
    let highlightTimer;
    let retryInterval;
    let retryStopTimer;

    const clearHighlight = (el) => {
      if (el) el.classList.remove(HIGHLIGHT_CLASS);
    };

    const attemptHighlight = () => {
      const domId = menuItemDomId(highlightMenuItemId);
      if (!domId) return true;
      const el = document.getElementById(domId);
      if (!el || cancelled) return !!el;

      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(HIGHLIGHT_CLASS);
      highlightTimer = window.setTimeout(() => clearHighlight(el), HIGHLIGHT_MS);

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete(MENU_ITEM_HIGHLIGHT_QUERY_KEY);
        return next;
      }, { replace: true });

      return true;
    };

    if (!attemptHighlight()) {
      retryInterval = window.setInterval(() => {
        if (attemptHighlight() && retryInterval) {
          window.clearInterval(retryInterval);
          retryInterval = null;
        }
      }, RETRY_MS);
      retryStopTimer = window.setTimeout(() => {
        if (retryInterval) window.clearInterval(retryInterval);
      }, RETRY_MAX_MS);
    }

    return () => {
      cancelled = true;
      if (highlightTimer) window.clearTimeout(highlightTimer);
      if (retryInterval) window.clearInterval(retryInterval);
      if (retryStopTimer) window.clearTimeout(retryStopTimer);
      clearHighlight(document.getElementById(menuItemDomId(highlightMenuItemId) || ""));
    };
  }, [highlightMenuItemId, ready, displaySections, setSearchParams]);
}
