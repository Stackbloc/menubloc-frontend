/**
 * Shared mobile dialog layout for diner profile sheets.
 * Feed primary nav is z-index 1300 — dialogs must sit above it or Post/Save
 * is clipped. visualViewport max-height keeps the action row on screen when
 * the software keyboard opens.
 */

import { useEffect, useState } from "react";

export const MOBILE_DIALOG_Z_INDEX = 1400;

export const MOBILE_DIALOG_BACKDROP_PADDING =
  "12px 12px max(12px, env(safe-area-inset-bottom, 0px))";

export const MOBILE_DIALOG_MAX_HEIGHT_FALLBACK =
  "min(92dvh, calc(100dvh - 16px - env(safe-area-inset-bottom, 0px)))";

export function useMobileDialogMaxHeight(open) {
  const [maxHeight, setMaxHeight] = useState(MOBILE_DIALOG_MAX_HEIGHT_FALLBACK);

  useEffect(() => {
    if (!open || typeof window === "undefined") return undefined;

    function sync() {
      const h = Math.floor(window.visualViewport?.height || window.innerHeight || 0);
      if (h > 0) setMaxHeight(`${Math.max(220, h - 16)}px`);
    }

    sync();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [open]);

  return maxHeight;
}

export function mobileDialogBackdrop(extra = {}) {
  return {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.48)",
    zIndex: MOBILE_DIALOG_Z_INDEX,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: MOBILE_DIALOG_BACKDROP_PADDING,
    ...extra,
  };
}

export function mobileDialogPanel(maxHeight, extra = {}) {
  return {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: "20px 20px 14px 14px",
    boxShadow: "0 -12px 40px rgba(15, 23, 42, 0.18)",
    maxHeight: maxHeight || MOBILE_DIALOG_MAX_HEIGHT_FALLBACK,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    minHeight: 0,
    ...extra,
  };
}

export const mobileDialogScrollBody = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

export const mobileDialogStickyFooter = {
  flexShrink: 0,
  position: "sticky",
  bottom: 0,
  background: "#fff",
  paddingTop: 10,
  zIndex: 2,
};
