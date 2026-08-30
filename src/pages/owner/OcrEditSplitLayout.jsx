import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import OcrSourceEvidencePanel from "./OcrSourceEvidencePanel.jsx";
import LiveMenuReferencePanel, { normalizeLiveMenuItems } from "./LiveMenuReferencePanel.jsx";
import "./ocrEditSplitLayout.css";

/** Matches CSS: side-by-side only at 1480px+; drawer below (owner sidebar needs room). */
const DRAWER_MQ = "(max-width: 1479px)";
/** Clear sticky admin header while the rail is fixed to the viewport. */
const FIXED_TOP_PX = 68;
const FIXED_BOTTOM_PX = 16;

/**
 * Center editing surface + independently scrolling companion rail.
 * Mode 1: OCR source photos + text. Mode 2: plain live menu (no nutrition).
 *
 * Desktop: fixed-position rail (sticky fails under admin-console overflow-x: clip).
 * Below 1480px: overlay drawer.
 */
export default function OcrEditSplitLayout({
  pages = [],
  liveItems = null,
  ocrHref = null,
  children,
  railTitle = "Source menu",
  defaultOpen = true,
  defaultRailMode = "ocr",
  /** Menu Manager Edit dishes: keep Tom's-style OCR source rail even before pages load. */
  preferOcrRail = false,
}) {
  const hasPages = Array.isArray(pages) && pages.length > 0;
  const normalizedLive = normalizeLiveMenuItems(liveItems);
  const hasLive = normalizedLive.length > 0;
  const hasRail = hasPages || hasLive || preferOcrRail;

  const initialMode =
    preferOcrRail || defaultRailMode === "ocr"
      ? "ocr"
      : defaultRailMode === "live" && hasLive
        ? "live"
        : hasPages
          ? "ocr"
          : hasLive
            ? "live"
            : "ocr";

  const [railOpen, setRailOpen] = useState(defaultOpen);
  const [railMode, setRailMode] = useState(initialMode);
  const [isDrawer, setIsDrawer] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DRAWER_MQ).matches : true
  );
  const [fixedBox, setFixedBox] = useState(null);
  const slotRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mq = window.matchMedia(DRAWER_MQ);
    const onChange = () => setIsDrawer(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!hasRail) return;
    setRailOpen(defaultOpen);
  }, [hasRail, defaultOpen]);

  useEffect(() => {
    if (preferOcrRail || defaultRailMode === "ocr" || hasPages) {
      setRailMode("ocr");
      return;
    }
    if (defaultRailMode === "live" && hasLive) {
      setRailMode("live");
    } else if (hasLive) {
      setRailMode("live");
    }
  }, [defaultRailMode, hasLive, hasPages, preferOcrRail]);

  // Desktop: pin rail to viewport by measuring a full-height grid spacer.
  // position:sticky cannot work here — admin-console uses overflow-x:clip.
  useLayoutEffect(() => {
    if (!railOpen || isDrawer || typeof window === "undefined") {
      setFixedBox(null);
      return undefined;
    }

    const slot = slotRef.current;
    if (!slot) return undefined;

    const update = () => {
      const r = slot.getBoundingClientRect();
      const maxHeight = Math.max(120, window.innerHeight - FIXED_TOP_PX - FIXED_BOTTOM_PX);

      // Entire edit section scrolled away
      if (r.bottom <= FIXED_TOP_PX || r.top >= window.innerHeight) {
        setFixedBox(null);
        return;
      }

      let top = r.top;
      if (top < FIXED_TOP_PX) top = FIXED_TOP_PX;

      const height = Math.min(maxHeight, Math.max(80, r.bottom - top));
      // Release at bottom of section (don't overhang past the edit block)
      if (top + height > r.bottom) {
        top = Math.max(FIXED_TOP_PX, r.bottom - height);
      }

      setFixedBox({
        top: Math.round(top),
        left: Math.round(r.left),
        width: Math.round(r.width),
        height: Math.round(height),
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(slot);
    const parent = slot.closest(".admin-console__main") || slot.parentElement;
    if (parent && ro) ro.observe(parent);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro?.disconnect();
    };
  }, [railOpen, isDrawer, hasRail, railMode]);

  if (!hasRail) {
    return <>{children}</>;
  }

  const showingLive = railMode === "live" && hasLive;
  const showingOcr = !showingLive && (hasPages || preferOcrRail);
  const canToggleModes = hasPages && hasLive;
  const useFixedRail = railOpen && !isDrawer;

  const hideLabel = showingLive ? "Hide live menu" : "Hide source menu";
  const showLabel = showingLive
    ? "Live menu"
    : canToggleModes
      ? "Source menu · OCR"
      : "Source menu · magnifier";

  const panel = showingLive ? (
    <LiveMenuReferencePanel
      items={normalizedLive}
      hasOcrSource={hasPages}
      onViewOcr={hasPages ? () => setRailMode("ocr") : null}
      ocrHref={!hasPages && ocrHref ? ocrHref : null}
      onClose={isDrawer ? () => setRailOpen(false) : null}
    />
  ) : showingOcr ? (
    <OcrSourceEvidencePanel
      pages={pages}
      title={railTitle}
      onClose={isDrawer ? () => setRailOpen(false) : null}
    />
  ) : null;

  return (
    <div
      className={`ocr-edit-split${railOpen ? " ocr-edit-split--rail-open" : ""}${
        useFixedRail ? " ocr-edit-split--fixed-rail" : ""
      }`}
    >
      <div className="ocr-edit-split__toolbar">
        {canToggleModes && railOpen ? (
          <div className="ocr-edit-split__mode-toggle" role="group" aria-label="Reference panel mode">
            <button
              type="button"
              className={`ocr-edit-split__mode-btn${railMode === "ocr" ? " ocr-edit-split__mode-btn--active" : ""}`}
              onClick={() => setRailMode("ocr")}
              aria-pressed={railMode === "ocr"}
            >
              Source menu · OCR
            </button>
            <button
              type="button"
              className={`ocr-edit-split__mode-btn${railMode === "live" ? " ocr-edit-split__mode-btn--active" : ""}`}
              onClick={() => setRailMode("live")}
              aria-pressed={railMode === "live"}
            >
              Live menu
            </button>
          </div>
        ) : null}
        <button
          type="button"
          className={`ocr-edit-split__toggle${railOpen ? " ocr-edit-split__toggle--active" : ""}`}
          onClick={() => setRailOpen((v) => !v)}
          aria-pressed={railOpen}
          aria-label={railOpen ? hideLabel : showLabel}
        >
          {railOpen ? hideLabel : showLabel}
        </button>
      </div>

      <div className="ocr-edit-split__body">
        <div className="ocr-edit-split__center">{children}</div>

        {useFixedRail ? (
          <div
            ref={slotRef}
            className="ocr-edit-split__rail-slot"
            aria-hidden="true"
          />
        ) : null}

        {!useFixedRail ? (
          <aside
            className={`ocr-edit-split__rail${railOpen ? " ocr-edit-split__rail--open" : ""}`}
            aria-hidden={!railOpen}
          >
            {railOpen ? panel : null}
          </aside>
        ) : null}
      </div>

      {useFixedRail ? (
        <aside
          className="ocr-edit-split__rail ocr-edit-split__rail--open ocr-edit-split__rail--fixed"
          aria-hidden={false}
          style={
            fixedBox
              ? {
                  top: fixedBox.top,
                  left: fixedBox.left,
                  width: fixedBox.width,
                  height: fixedBox.height,
                }
              : { visibility: "hidden", pointerEvents: "none" }
          }
        >
          {panel}
        </aside>
      ) : null}

      {railOpen && isDrawer ? (
        <div
          className="ocr-edit-split__backdrop"
          onClick={() => setRailOpen(false)}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}
