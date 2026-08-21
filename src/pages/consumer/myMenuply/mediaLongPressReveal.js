/**
 * Long-press / hard-press reveal for owner-only media actions.
 * Not hover — Delete must not appear from a light pass-over.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export const LONG_PRESS_MS = 550;

export function useLongPressReveal(enabled, { ms = LONG_PRESS_MS } = {}) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const armedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setOpen(false);
    armedRef.current = false;
  }, [clearTimer]);

  const onPointerDown = useCallback(
    (e) => {
      if (!enabled) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      clearTimer();
      armedRef.current = false;
      timerRef.current = setTimeout(() => {
        armedRef.current = true;
        setOpen(true);
        timerRef.current = null;
      }, ms);
    },
    [enabled, ms, clearTimer]
  );

  const onPointerUp = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onPointerCancel = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onPointerLeave = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  /** Right-click / long-press context menu — intentional, not hover. */
  const onContextMenu = useCallback(
    (e) => {
      if (!enabled) return;
      e.preventDefault();
      clearTimer();
      armedRef.current = true;
      setOpen(true);
    },
    [enabled, clearTimer]
  );

  /** Swallow the click that often follows a long-press so we don't open details. */
  const consumeArmedClick = useCallback(() => {
    if (!armedRef.current) return false;
    armedRef.current = false;
    return true;
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    open,
    dismiss,
    consumeArmedClick,
    bind: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onPointerLeave,
      onContextMenu,
    },
  };
}
