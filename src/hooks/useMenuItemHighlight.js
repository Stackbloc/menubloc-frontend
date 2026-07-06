import { useEffect, useRef } from "react";
import { MENU_ITEM_HIGHLIGHT_QUERY_KEY, menuItemDomId } from "../components/share/shareUtils.js";

const HIGHLIGHT_CLASS = "menuply-menu-item-highlight";
const HIGHLIGHT_MS = 7000;
const RETRY_MS = 200;
const RETRY_MAX_MS = 3500;

function scrollItemIntoViewOnce(el) {
  if (!el || el.dataset.menuplyHighlightScrolled === "1") return;
  const rect = el.getBoundingClientRect();
  const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
  if (!inView) {
    el.scrollIntoView({ block: "center", behavior: "instant" });
  }
  el.dataset.menuplyHighlightScrolled = "1";
}

function clearHighlightElement(el) {
  if (!el) return;
  el.classList.remove(HIGHLIGHT_CLASS);
  delete el.dataset.menuplyHighlightScrolled;
}

function applyHighlightElement(el) {
  if (!el) return;
  el.classList.add(HIGHLIGHT_CLASS);
}

function finishSession(sessionRef) {
  const session = sessionRef.current;
  if (!session) return;
  if (session.timerId) window.clearTimeout(session.timerId);
  clearHighlightElement(session.element);
  sessionRef.current = null;
}

function scheduleSessionEnd(sessionRef) {
  const session = sessionRef.current;
  if (!session) return;
  if (session.timerId) window.clearTimeout(session.timerId);
  const remaining = session.endsAt - Date.now();
  if (remaining <= 0) {
    finishSession(sessionRef);
    return;
  }
  session.timerId = window.setTimeout(() => finishSession(sessionRef), remaining);
}

function reapplyActiveHighlight(sessionRef) {
  const session = sessionRef.current;
  if (!session) return false;
  if (Date.now() >= session.endsAt) {
    finishSession(sessionRef);
    return false;
  }

  const el = document.getElementById(menuItemDomId(session.itemId) || "");
  if (!el) return false;

  if (session.element && session.element !== el) {
    clearHighlightElement(session.element);
  }

  session.element = el;
  applyHighlightElement(el);
  scrollItemIntoViewOnce(el);
  scheduleSessionEnd(sessionRef);
  return true;
}

function beginHighlight(sessionRef, targetId, el) {
  const prev = sessionRef.current;
  if (prev?.timerId) window.clearTimeout(prev.timerId);
  if (prev?.element) clearHighlightElement(prev.element);

  sessionRef.current = {
    itemId: targetId,
    element: el,
    endsAt: Date.now() + HIGHLIGHT_MS,
    timerId: null,
  };

  applyHighlightElement(el);
  scrollItemIntoViewOnce(el);
  scheduleSessionEnd(sessionRef);
}

/**
 * When arriving from menu item detail (?highlightItem=), scroll the menu row
 * into view once (no smooth-scroll hijack) and show a green border for 7s.
 */
export default function useMenuItemHighlight({
  highlightMenuItemId,
  ready,
  displaySections,
  setSearchParams,
}) {
  const sessionRef = useRef(null);
  const clearedParamForRef = useRef(null);

  useEffect(() => () => finishSession(sessionRef), []);

  // Re-apply after menu rows re-render (DOM node swap) while the 7s window is active.
  useEffect(() => {
    if (!ready) return;
    reapplyActiveHighlight(sessionRef);
  }, [ready, displaySections]);

  useEffect(() => {
    if (!highlightMenuItemId || !ready) return undefined;

    const targetId = String(highlightMenuItemId);
    if (sessionRef.current?.itemId === targetId) {
      if (clearedParamForRef.current !== targetId) {
        clearedParamForRef.current = targetId;
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete(MENU_ITEM_HIGHLIGHT_QUERY_KEY);
          return next;
        }, { replace: true });
      }
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

      beginHighlight(sessionRef, targetId, el);
      clearedParamForRef.current = targetId;
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
      if (retryInterval) window.clearInterval(retryInterval);
      if (retryStopTimer) window.clearTimeout(retryStopTimer);
      // Do not remove the border here — URL param cleanup re-runs this effect.
    };
  }, [highlightMenuItemId, ready, displaySections, setSearchParams]);
}
