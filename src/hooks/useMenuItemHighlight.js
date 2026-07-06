import { useEffect, useRef } from "react";
import { MENU_ITEM_HIGHLIGHT_QUERY_KEY, menuItemDomId } from "../components/share/shareUtils.js";

const HIGHLIGHT_CLASS = "menuply-menu-item-highlight";
const HIGHLIGHT_MS = 7000;
const RETRY_MS = 200;
const RETRY_MAX_MS = 3500;
const SCROLL_RETRY_DELAYS_MS = [0, 50, 150, 350, 700, 1200];

function getStickyHeaderOffsetPx() {
  if (typeof document === "undefined") return 64;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--sph-h");
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 64;
}

function isElementVisiblyInViewport(el) {
  if (!el || !document.contains(el)) return false;
  const rect = el.getBoundingClientRect();
  if (rect.height < 8 || rect.width < 8) return false;
  const topBound = getStickyHeaderOffsetPx() + 12;
  const bottomBound = window.innerHeight - 12;
  return rect.top >= topBound && rect.bottom <= bottomBound;
}

function scrollMenuItemIntoView(el) {
  if (!el || !document.contains(el)) return;
  el.scrollIntoView({ block: "center", behavior: "auto" });
}

function scheduleScrollUntilVisible(el) {
  const timers = [];

  const cleanup = () => {
    timers.forEach((id) => window.clearTimeout(id));
    timers.length = 0;
  };

  for (const delay of SCROLL_RETRY_DELAYS_MS) {
    timers.push(
      window.setTimeout(() => {
        if (!document.contains(el)) {
          cleanup();
          return;
        }
        if (isElementVisiblyInViewport(el)) {
          cleanup();
          return;
        }
        scrollMenuItemIntoView(el);
      }, delay),
    );
  }

  return cleanup;
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
  if (session.timerId) window.clearTimeout(session.timerId);
  if (session.scrollCleanup) session.scrollCleanup();
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
  if (session.scrollCleanup) session.scrollCleanup();
  session.scrollCleanup = scheduleScrollUntilVisible(el);
  scheduleSessionEnd(sessionRef);
  return true;
}

function beginHighlight(sessionRef, targetId, el) {
  const prev = sessionRef.current;
  if (prev?.timerId) window.clearTimeout(prev.timerId);
  if (prev?.scrollCleanup) prev.scrollCleanup();
  if (prev?.element) clearHighlightElement(prev.element);

  sessionRef.current = {
    itemId: targetId,
    element: el,
    endsAt: Date.now() + HIGHLIGHT_MS,
    timerId: null,
    scrollCleanup: null,
  };

  applyHighlightElement(el);
  sessionRef.current.scrollCleanup = scheduleScrollUntilVisible(el);
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
