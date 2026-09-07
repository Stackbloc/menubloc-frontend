import { useEffect, useRef } from "react";
import { MENU_ITEM_HIGHLIGHT_QUERY_KEY, menuItemDomId } from "../components/share/shareUtils.js";

const HIGHLIGHT_CLASS = "menuply-menu-item-highlight";
const RETRY_MS = 200;
const RETRY_MAX_MS = 3500;

/**
 * Keep the menu at the restaurant header (top). Do not jump to the highlighted row.
 */
function scrollMenuToRestaurantTop(fromEl) {
  if (typeof window === "undefined") return;

  const catalog =
    fromEl && typeof fromEl.closest === "function"
      ? fromEl.closest(".menu-catalog-scroll")
      : null;
  if (catalog) {
    catalog.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  let node = fromEl?.parentElement || null;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight + 8
    ) {
      node.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    node = node.parentElement;
  }

  window.scrollTo({ top: 0, behavior: "auto" });
}

function clearHighlightElement(el) {
  if (!el) return;
  el.classList.remove(HIGHLIGHT_CLASS);
}

function applyHighlightElement(el) {
  if (!el) return;
  el.classList.add(HIGHLIGHT_CLASS);
}

function finishSession(sessionRef) {
  const session = sessionRef.current;
  if (!session) return;
  clearHighlightElement(session.element);
  sessionRef.current = null;
}

function reapplyActiveHighlight(sessionRef) {
  const session = sessionRef.current;
  if (!session) return false;

  const el = document.getElementById(menuItemDomId(session.itemId) || "");
  if (!el) return false;

  if (session.element && session.element !== el) {
    clearHighlightElement(session.element);
  }

  session.element = el;
  applyHighlightElement(el);
  return true;
}

function beginHighlight(sessionRef, targetId, el, { pinToTop = true } = {}) {
  const prev = sessionRef.current;
  if (prev?.element) clearHighlightElement(prev.element);

  sessionRef.current = {
    itemId: targetId,
    element: el,
  };

  applyHighlightElement(el);
  if (pinToTop) scrollMenuToRestaurantTop(el);
}

/**
 * When a menu opens with a specific dish context (?highlightItem= / Feed menu_item_id):
 * keep the menu scrolled to the restaurant name (top) and show the existing green
 * border on that row for the whole menu session (until unmount or a new highlight id).
 * Does not scroll the highlighted row into view.
 */
export default function useMenuItemHighlight({
  highlightMenuItemId,
  ready,
  displaySections,
  setSearchParams = null,
}) {
  const sessionRef = useRef(null);
  const clearedParamForRef = useRef(null);

  function clearHighlightQueryParam(targetId) {
    if (typeof setSearchParams !== "function") return;
    clearedParamForRef.current = targetId;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(MENU_ITEM_HIGHLIGHT_QUERY_KEY);
      return next;
    }, { replace: true });
  }

  useEffect(() => () => finishSession(sessionRef), []);

  // Re-apply after menu rows re-render (DOM node swap) while the session is active.
  useEffect(() => {
    if (!ready) return;
    reapplyActiveHighlight(sessionRef);
  }, [ready, displaySections]);

  useEffect(() => {
    // Clearing highlightItem from the URL must not drop an active session.
    if (!highlightMenuItemId || !ready) return undefined;

    const targetId = String(highlightMenuItemId);
    if (sessionRef.current?.itemId === targetId) {
      if (clearedParamForRef.current !== targetId) {
        clearHighlightQueryParam(targetId);
      }
      reapplyActiveHighlight(sessionRef);
      return undefined;
    }

    let cancelled = false;
    let retryInterval;
    let retryStopTimer;

    const attemptHighlight = () => {
      const domId = menuItemDomId(targetId);
      if (!domId) return true;
      const el = document.getElementById(domId);
      if (!el || cancelled) return !!el;

      beginHighlight(sessionRef, targetId, el, { pinToTop: true });
      clearHighlightQueryParam(targetId);

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
      if (retryInterval) window.clearInterval(retryInterval);
      if (retryStopTimer) window.clearTimeout(retryStopTimer);
      // Do not remove the border here — URL param cleanup re-runs this effect.
    };
  }, [highlightMenuItemId, ready, displaySections, setSearchParams]);
}
