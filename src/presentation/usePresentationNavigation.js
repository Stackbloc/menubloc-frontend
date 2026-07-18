import { useCallback, useEffect, useRef } from "react";

const WHEEL_COOLDOWN_MS = 520;
const SWIPE_THRESHOLD_PX = 48;

/**
 * Keyboard, click-zone, wheel, and swipe navigation for PresentationEngine.
 */
export function usePresentationNavigation({
  index,
  count,
  onPrev,
  onNext,
  enabled = true,
  rootRef,
}) {
  const wheelLockRef = useRef(0);
  const touchStartRef = useRef(null);

  const goPrev = useCallback(() => {
    if (!enabled || count <= 0) return;
    onPrev();
  }, [enabled, count, onPrev]);

  const goNext = useCallback(() => {
    if (!enabled || count <= 0) return;
    onNext();
  }, [enabled, count, onNext]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      const tag = String(event.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || event.target?.isContentEditable) return;

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        goPrev();
        return;
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "PageDown" ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, goPrev, goNext]);

  useEffect(() => {
    if (!enabled) return undefined;
    const node = rootRef?.current;
    if (!node) return undefined;

    const onWheel = (event) => {
      const now = Date.now();
      if (now - wheelLockRef.current < WHEEL_COOLDOWN_MS) return;
      const dy = event.deltaY;
      const dx = event.deltaX;
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
      event.preventDefault();
      wheelLockRef.current = now;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) goNext();
        else goPrev();
        return;
      }
      if (dy > 0) goNext();
      else goPrev();
    };

    const onTouchStart = (event) => {
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    };

    const onTouchEnd = (event) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      const touch = event.changedTouches?.[0];
      if (!start || !touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) goNext();
      else goPrev();
    };

    node.addEventListener("wheel", onWheel, { passive: false });
    node.addEventListener("touchstart", onTouchStart, { passive: true });
    node.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      node.removeEventListener("wheel", onWheel);
      node.removeEventListener("touchstart", onTouchStart);
      node.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, rootRef, goPrev, goNext]);

  return { goPrev, goNext, index, count };
}
